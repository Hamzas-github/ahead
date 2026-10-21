from time import perf_counter
from functools import wraps
from threading import BoundedSemaphore
from typing import Annotated, Callable, ParamSpec, TypeVar
import pandas as pd
from fastapi import FastAPI, File, Form, HTTPException, UploadFile
from fastapi.exceptions import RequestValidationError
from fastapi.responses import JSONResponse
from starlette.concurrency import run_in_threadpool
from app.data import MAX_BYTES, clean, preview, read_csv, select_window
from app.forecast import ModelError, forecast, model_version, engine_metadata
from app.backtest import build_backtest

_jobs = BoundedSemaphore(2)
P = ParamSpec("P")
R = TypeVar("R")


def bounded_job(function: Callable[P, R]) -> Callable[P, R]:
    @wraps(function)
    def run(*args: P.args, **kwargs: P.kwargs) -> R:
        if not _jobs.acquire(blocking=False):
            raise HTTPException(429, "Forecast capacity is busy. Please retry shortly.")
        try:
            return function(*args, **kwargs)
        finally:
            _jobs.release()
    return run


build_backtest = bounded_job(build_backtest)

app = FastAPI(title="Ahead Forecast API", version="0.2.0")


@app.exception_handler(RequestValidationError)
async def validation_error(_request, exc: RequestValidationError) -> JSONResponse:
    return JSONResponse(
        status_code=422,
        content={
            "schema_version": 1,
            "detail": "Check your columns and enter a whole-number forecast length between 1 and 256.",
        },
    )


async def read_upload(file: UploadFile) -> bytes:
    raw = await file.read(MAX_BYTES + 1)
    await file.close()
    if len(raw) > MAX_BYTES:
        raise HTTPException(
            413, "Your file is larger than 10 MB. Please upload a smaller CSV."
        )
    return raw


@app.get("/api/health")
def health() -> dict:
    try:
        return {"schema_version": 1, "status": "ok", "model_version": model_version(), "engine": engine_metadata(), "capabilities": {"forecast": True, "backtest": True, "training_window": True, "max_horizon": 256, "max_folds": 3}}
    except ModelError as exc:
        raise HTTPException(503, str(exc)) from exc


@app.post("/api/preview")
async def preview_csv(file: Annotated[UploadFile, File()]) -> dict:
    raw = await read_upload(file)
    try:
        return await run_in_threadpool(lambda: preview(read_csv(raw)))
    except ValueError as exc:
        raise HTTPException(422, str(exc)) from exc


@bounded_job
def build_forecast(
    raw: bytes, date_column: str, value_column: str, horizon: int, frequency: str | None, train_start: str | None = None, train_end: str | None = None
) -> dict:
    start = perf_counter()
    data = clean(select_window(read_csv(raw), date_column, train_start, train_end), date_column, value_column, frequency)
    prediction = forecast(data.values.to_numpy(), horizon, data.frequency)
    future = pd.date_range(
        data.values.index[-1], periods=horizon + 1, freq=data.frequency
    )[1:]
    return {
        "schema_version": 1,
        "history": {
            "dates": [d.isoformat() for d in data.values.index],
            "values": data.values.tolist(),
        },
        "forecast": {"dates": [d.isoformat() for d in future], **prediction},
        "metadata": {
            "engine": engine_metadata(),
            "train_start": data.values.index[0].isoformat(),
            "train_end": data.values.index[-1].isoformat(),
            "frequency": data.frequency,
            "n_history_points": len(data.values),
            "n_filled_points": data.n_filled,
            "model_version": model_version(),
            "runtime_ms": round((perf_counter() - start) * 1000),
            "warnings": data.warnings,
        },
    }


@app.post("/api/forecast")
async def forecast_csv(
    file: Annotated[UploadFile, File()],
    date_column: Annotated[str, Form()],
    value_column: Annotated[str, Form()],
    horizon: Annotated[int, Form(ge=1, le=256)],
    frequency: Annotated[str | None, Form()] = None,
    train_start: Annotated[str | None, Form()] = None,
    train_end: Annotated[str | None, Form()] = None,
) -> dict:
    raw = await read_upload(file)
    try:
        return await run_in_threadpool(
            build_forecast, raw, date_column, value_column, horizon, frequency, train_start, train_end
        )
    except ValueError as exc:
        raise HTTPException(422, str(exc)) from exc
    except ModelError as exc:
        raise HTTPException(503, str(exc)) from exc


@app.post("/api/backtest")
async def backtest_csv(
    file: Annotated[UploadFile, File()],
    date_column: Annotated[str, Form()],
    value_column: Annotated[str, Form()],
    horizon: Annotated[int, Form(ge=1, le=256)] = 12,
    frequency: Annotated[str | None, Form()] = None,
    train_start: Annotated[str | None, Form()] = None,
    train_end: Annotated[str | None, Form()] = None,
    folds: Annotated[int, Form()] = 1,
) -> dict:
    raw = await read_upload(file)
    try:
        return await run_in_threadpool(build_backtest, raw, date_column, value_column, horizon, frequency, train_start, train_end, folds)
    except ValueError as exc:
        raise HTTPException(422, str(exc)) from exc
    except ModelError as exc:
        raise HTTPException(503, str(exc)) from exc


# Exact public pages and static assets; no SPA fallback for unknown/API paths.
from pathlib import Path
from fastapi.responses import FileResponse

DIST = Path(__file__).resolve().parents[2] / "frontend" / "dist"


@app.get("/{path:path}", include_in_schema=False)
def public_file(path: str) -> FileResponse:
    if path == "api" or path.startswith("api/"):
        raise HTTPException(404, "API route not found.")
    target = (DIST / path).resolve()
    if not target.is_relative_to(DIST.resolve()):
        raise HTTPException(404, "Page not found.")
    if target.is_dir():
        target = target / "index.html"
    if target.is_file():
        return FileResponse(target)
    fallback = DIST / "fallback404.html"
    if fallback.is_file():
        return FileResponse(fallback, status_code=404)
    raise HTTPException(404, "Page not found.")
