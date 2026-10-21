# Ahead backend API

Start from this directory with `uvicorn app.main:app`. Default engine is `statistical`; no model download or model package is needed. Set `FORECAST_ENGINE=timesfm` only for research. TimesFM 3 weights are noncommercial; this provider returns 503 when `APP_ENV=production`. `USE_MOCK_MODEL=1` selects the demo provider. Environment variables must be exported by the process launcher; `.env.example` is illustrative.

## Forecast

`POST /api/forecast`, multipart fields: file, date_column, value_column, horizon (1–256), optional frequency, train_start and train_end. Date bounds select an inclusive window before cleaning; date-only end bounds include the whole day. Returns schema_version 1, history {dates,values}, forecast {dates,point,lower,upper}, metadata {frequency,n_history_points,n_filled_points,model_version,runtime_ms,warnings,engine,train_start,train_end}.

Engine metadata: {id,name,commercial_use,interval_label}. Statistical provider fits trend and phase means over the latest max(120,4×seasonal_period) points. Seasonality requires three cycles. The 10th/90th percentiles of fitted residuals are widened with horizon. These are empirical ranges, not calibrated predictive intervals. Structural changes, outliers, and long horizons can cause poor forecasts.

## Backtest

`POST /api/backtest` accepts the same form with folds=1 (default) or 3. Horizon defaults to 12 if omitted; the UI passes its selected horizon. Uses the last folds×horizon points inside the selected window as consecutive holdouts, with expanding training prefixes of at least 30 valid points. Each prefix is independently cleaned. Missing edge training values and missing holdout values are rejected; held-out observations never fill training gaps.

Returns schema_version 1, metrics {mae,smape,mase,coverage}, badge {label,tone,reason}, folds [{train_start,train_end,dates,actual,point,lower,upper,metrics}], metadata {engine,frequency,horizon,folds,warnings,interval_note,smape_note}.

sMAPE is percent, omitting zero/zero pairs (null if all pairs have zero denominators). MASE uses each fold's training-only seasonal absolute difference scale; null if no seasonal lag or scale is zero. Aggregate metrics average equal-sized folds, propagating unavailable values. Coverage is a fraction from 0 to 1. Badges describe limited historical evidence, not a future quality guarantee.

`GET /api/health` returns engine and capabilities. `POST /api/preview` inspects CSV columns and first ten rows. Uploads are limited to 10 MB and 100,000 parsed rows; regularized grids to 100,000 points. Forecast/backtest concurrency is limited to two jobs per worker (429 when busy). Multiple server workers each have their own cap. No application data storage is used.

If frontend/dist exists, its files and exact directory index pages are served. Missing routes return fallback404.html with HTTP 404; unknown /api routes always return 404.
