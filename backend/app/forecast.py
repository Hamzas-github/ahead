"""All model-specific code; shared by the API and future backtests."""

import os
from threading import Lock
from typing import Any
import numpy as np

MODEL_VERSION = "google/timesfm-3.0-pytorch"
_model: Any = None
_lock = Lock()


class ModelError(RuntimeError):
    pass


def engine_metadata() -> dict:
    engine = "mock" if os.getenv("USE_MOCK_MODEL") == "1" else os.getenv("FORECAST_ENGINE", "statistical").lower()
    if engine not in {"mock", "statistical", "timesfm"}:
        raise ModelError("FORECAST_ENGINE must be statistical or timesfm.")
    if engine == "timesfm" and os.getenv("APP_ENV", "").lower() == "production":
        raise ModelError("TimesFM 3 weights have a noncommercial license and are disabled in production. Set FORECAST_ENGINE=statistical.")
    return {"id": engine, "name": {"mock": "Demo seasonal baseline", "statistical": "Trend + seasonality", "timesfm": "TimesFM 3 research"}[engine], "commercial_use": engine == "statistical", "interval_label": {"statistical": "Empirical 80% residual range · not calibrated", "mock": "Demo standard-deviation range · not calibrated", "timesfm": "Model 10–90% quantiles · not calibrated"}[engine]}


def model_version() -> str:
    return {"mock": "mock-seasonal-naive", "statistical": "trend-seasonal-v1", "timesfm": MODEL_VERSION}[engine_metadata()["id"]]


def seasonal_period(freq: str) -> int:
    import pandas as pd
    offset = pd.tseries.frequencies.to_offset(freq)
    base = offset.name.upper()
    period = 24 if base == "H" else 7 if base == "D" else 5 if base == "B" else 52 if base.startswith("W") else 12 if base.startswith(("M", "BM")) else 4 if base.startswith("Q") else 1
    return max(1, period // offset.n)


def statistical_forecast(values: np.ndarray, horizon: int, freq: str) -> dict[str, list[float]]:
    period = seasonal_period(freq)
    y = np.asarray(values[-max(120, 4 * period):], dtype=float)
    magnitude = max(float(np.max(np.abs(y))), 1.0)
    y = y / magnitude
    period = period if len(y) >= 3 * period else 1
    x = np.arange(len(y), dtype=float)
    phases = np.arange(len(y)) % period
    seasonal = np.zeros(period)
    for _ in range(3):
        slope, intercept = np.polyfit(x, y - seasonal[phases], 1)
        residual = y - (intercept + slope * x)
        seasonal = np.array([residual[phases == k].mean() for k in range(period)])
        seasonal -= seasonal.mean()
    residual = y - (intercept + slope * x + seasonal[phases])
    future = np.arange(len(y), len(y) + horizon)
    point = intercept + slope * future + seasonal[future % period]
    low, high = np.quantile(residual, [0.1, 0.9])
    widening = np.sqrt(1 + np.arange(1, horizon + 1) / len(y))
    with np.errstate(over="ignore", invalid="ignore"):
        arrays = {"point": point * magnitude, "lower": (point + min(0, low) * widening) * magnitude, "upper": (point + max(0, high) * widening) * magnitude}
    if not all(np.isfinite(a).all() for a in arrays.values()):
        raise ValueError("Forecast values exceed the supported numeric range. Rescale your values and try again.")
    return {key: value.tolist() for key, value in arrays.items()}


def forecast(
    values: np.ndarray,
    horizon: int,
    freq: str,
    *,
    train_start: int | None = None,
    train_end: int | None = None,
) -> dict[str, list[float]]:
    """Internal bounds are positional and end-exclusive; API date bounds are applied before this call."""
    global _model
    values = np.asarray(values, dtype=np.float64)[train_start:train_end]
    if values.ndim != 1 or len(values) < 30 or not np.isfinite(values).all():
        raise ValueError("Forecasting needs at least 30 finite values in one series.")
    if not 1 <= horizon <= 256:
        raise ValueError("Choose a forecast length between 1 and 256.")
    engine = engine_metadata()["id"]
    if engine == "statistical":
        return statistical_forecast(values, horizon, freq)
    if engine == "mock":
        period = (
            4
            if freq.upper().startswith("Q")
            else (
                12
                if freq.upper().startswith("M")
                else (
                    24
                    if freq.lower().endswith("h")
                    else 52 if freq.upper().startswith("W") else 7
                )
            )
        )
        period = min(period, len(values) // 2)
        point = np.resize(values[-period:], horizon)
        magnitude = max(float(np.max(np.abs(values))), 1.0)
        normalized = values / magnitude
        residuals = normalized[period:] - normalized[:-period]
        spread = max(float(np.std(residuals)), float(np.std(normalized)) * 0.05) * 1.28155
        width = spread * np.sqrt(1 + np.arange(horizon) / period)
        with np.errstate(over="ignore", invalid="ignore"):
            arrays = {"point": point, "lower": (point / magnitude - width) * magnitude, "upper": (point / magnitude + width) * magnitude}
        if not all(np.isfinite(array).all() for array in arrays.values()):
            raise ValueError("Forecast values exceed the supported numeric range. Rescale your values and try again.")
        return {key: value.tolist() for key, value in arrays.items()}
    with _lock:
        try:
            if _model is None:
                import torch
                from timesfm3 import ModelConfig, TimesFM3Evaluator

                device = "cuda" if torch.cuda.is_available() else "cpu"
                _model = TimesFM3Evaluator(
                    ModelConfig(
                        checkpoint_path=MODEL_VERSION,
                        per_core_batch_size=1,
                        device=device,
                    )
                )
            result = next(
                iter(
                    _model.predict_batch(
                        [values],
                        horizon=horizon,
                        return_quantiles=True,
                        use_symmetric_averaging=False,
                        make_positive=False,
                    )
                )
            )
            point = np.asarray(result.forecast)
            quantiles = np.asarray(result.quantiles)
            lower, upper = quantiles[:, 0], quantiles[:, 8]
            if point.shape != (horizon,) or not all(
                np.isfinite(a).all() for a in (point, lower, upper)
            ):
                raise RuntimeError("Invalid model output")
            return {
                "point": point.tolist(),
                "lower": np.minimum(lower, upper).tolist(),
                "upper": np.maximum(lower, upper).tolist(),
            }
        except Exception as exc:
            raise ModelError(
                "TimesFM could not load or run. Check your internet connection, available memory, and model installation (requirements-model.txt). For an offline demo, restart with USE_MOCK_MODEL=1. "
                + f"Details: {type(exc).__name__}: {exc}"
            ) from exc
