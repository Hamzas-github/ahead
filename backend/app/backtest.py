"""Chronological holdouts; missing holdout values are never interpolated."""
import numpy as np
import pandas as pd
from app.data import clean, read_csv, select_window
from app.forecast import forecast, engine_metadata, seasonal_period


def metrics(actual: np.ndarray | list[float], prediction: dict[str, list[float]], train: np.ndarray, period: int) -> dict[str, float | None]:
    actual, point = np.asarray(actual), np.asarray(prediction['point'])
    magnitude = max(float(np.max(np.abs(actual))), float(np.max(np.abs(point))), float(np.max(np.abs(train))), 1.0)
    normalized_actual, normalized_point, normalized_train = actual/magnitude, point/magnitude, train/magnitude
    error = np.abs(normalized_actual - normalized_point)
    denominator = np.abs(normalized_actual) + np.abs(normalized_point)
    scale = np.mean(np.abs(normalized_train[period:] - normalized_train[:-period])) if len(train) > period else 0
    with np.errstate(over="ignore", invalid="ignore"):
        result = {
            'mae': float(error.mean() * magnitude),
            'smape': float(200 * np.mean(error[denominator > 0] / denominator[denominator > 0])) if np.any(denominator > 0) else None,
            'mase': float(error.mean() / scale) if scale > 0 else None,
            'coverage': float(np.mean((actual >= prediction['lower']) & (actual <= prediction['upper']))),
        }
    if any(value is not None and not np.isfinite(value) for value in result.values()):
        raise ValueError('Backtest errors exceed the supported numeric range. Rescale your values and try again.')
    return result



def build_backtest(raw: bytes, date_column: str, value_column: str, horizon: int, frequency: str | None = None, train_start: str | None = None, train_end: str | None = None, folds: int = 1) -> dict:
    if folds not in (1, 3):
        raise ValueError('Choose 1 or 3 backtest folds.')
    frame = select_window(read_csv(raw), date_column, train_start, train_end)
    data = clean(frame, date_column, value_column, frequency, fill=False)
    if len(data.values) - folds * horizon < 30:
        raise ValueError('The selected window needs at least 30 training points plus horizon × folds holdout points.')
    results = []
    warnings = list(data.warnings)
    for i in range(folds):
        cut = len(data.values) - (folds-i) * horizon
        train_raw = data.values.iloc[:cut]
        # Interpolation sees only this fold's training prefix.
        train = clean(pd.DataFrame({'date': train_raw.index.astype(str), 'value': train_raw.to_numpy()}), 'date', 'value', data.frequency)
        actual = data.values.iloc[cut:cut+horizon]
        if actual.isna().any():
            raise ValueError('A holdout contains missing values. Backtests require observed holdout values; they are never filled.')
        prediction = forecast(train.values.to_numpy(), horizon, data.frequency)
        score = metrics(actual.to_numpy(), prediction, train.values.to_numpy(), seasonal_period(data.frequency))
        results.append({'train_start': train.values.index[0].isoformat(), 'train_end': train.values.index[-1].isoformat(), 'dates': [d.isoformat() for d in actual.index], 'actual': actual.tolist(), **prediction, 'metrics': score})
        warnings.extend(train.warnings)
    aggregate = {}
    for key in results[0]['metrics']:
        scores = [fold['metrics'][key] for fold in results]
        if any(score is None for score in scores):
            aggregate[key] = None
        else:
            # Scale before averaging: the sum can overflow even when its mean is finite.
            magnitude = max(max(abs(score) for score in scores), 1.0)
            aggregate[key] = float(np.mean(np.asarray(scores) / magnitude) * magnitude)
    if aggregate['mase'] is None:
        warnings.append('MASE unavailable: seasonal training scale is zero or history is shorter than one seasonal lag.')
    if aggregate['smape'] is None:
        warnings.append('sMAPE unavailable: actual and forecast values are all zero.')
    badge = {'label': 'Limited evidence', 'tone': 'neutral', 'reason': 'Historical holdouts do not guarantee future accuracy.'}
    if folds == 3 and aggregate['mase'] is not None:
        badge = {'label': 'Below seasonal error scale' if aggregate['mase'] < 1 else 'Review forecast fit', 'tone': 'positive' if aggregate['mase'] < 1 else 'warning', 'reason': 'Mean absolute error compared with training-only seasonal differences across three holdouts.'}
    return {'schema_version': 1, 'metrics': aggregate, 'badge': badge, 'folds': results, 'metadata': {'engine': engine_metadata(), 'frequency': data.frequency, 'horizon': horizon, 'folds': folds, 'warnings': list(dict.fromkeys(warnings)), 'interval_note': 'Coverage is the observed fraction inside the range, not a calibration guarantee.', 'smape_note': 'Zero/zero pairs are omitted; all-zero denominators return null.'}}
