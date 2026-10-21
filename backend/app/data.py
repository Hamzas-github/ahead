"""CSV inspection and regularization, independent of forecasting."""

from dataclasses import dataclass
from datetime import timedelta
from io import BytesIO
import warnings
import numpy as np
import pandas as pd

MAX_BYTES = 10 * 1024 * 1024
MAX_POINTS = 100_000


def read_csv(raw: bytes) -> pd.DataFrame:
    if len(raw) > MAX_BYTES:
        raise ValueError("Your file is larger than 10 MB. Please upload a smaller CSV.")
    try:
        frame = pd.read_csv(BytesIO(raw), nrows=MAX_POINTS + 1)
    except (pd.errors.ParserError, pd.errors.EmptyDataError, UnicodeDecodeError) as exc:
        raise ValueError(
            "We couldn't read this CSV. Save it as a UTF-8, comma-separated file."
        ) from exc
    if frame.empty or len(frame) > MAX_POINTS:
        raise ValueError("Please upload between 1 and 100,000 rows.")
    return frame


def parse_dates(series: pd.Series) -> pd.Series:
    # Numeric measurements must never silently become nanosecond dates.
    if pd.api.types.is_numeric_dtype(series):
        return pd.Series(pd.NaT, index=series.index, dtype="datetime64[ns, UTC]")
    with warnings.catch_warnings():
        warnings.simplefilter("ignore", UserWarning)
        return pd.to_datetime(series, errors="coerce", format="mixed", utc=True)


def infer_frequency(dates: pd.Series | pd.DatetimeIndex) -> str | None:
    index = pd.DatetimeIndex(dates).dropna().unique().sort_values()
    if len(index) < 3:
        return None
    inferred = pd.infer_freq(index)
    if inferred:
        return inferred
    if (index.day == 1).all():
        return "MS"
    if index.is_month_end.all():
        return "ME"
    deltas = pd.Series(index[1:] - index[:-1])
    step = deltas.mode().iloc[0]
    if step <= pd.Timedelta(0):
        return None
    # Only infer a grid when all observations fit it.
    if not ((index.asi8 - index.asi8[0]) % step.value == 0).all():
        return None
    return pd.tseries.frequencies.to_offset(step).freqstr


def preview(frame: pd.DataFrame) -> dict:
    scores = {col: parse_dates(frame[col]).notna().mean() for col in frame.columns}
    date = max(
        scores,
        key=lambda col: (
            scores[col],
            any(s in col.lower() for s in ("date", "time", "month")),
        ),
    )
    date = date if scores[date] >= 0.7 else None
    numeric = [
        col
        for col in frame.columns
        if col != date
        and pd.to_numeric(frame[col], errors="coerce").notna().mean() >= 0.7
    ]
    notes: list[str] = []
    frequency = None
    if date:
        dates = parse_dates(frame[date])
        frequency = infer_frequency(dates)
        if dates.isna().any():
            notes.append(f"{int(dates.isna().sum())} rows have unreadable dates.")
        if dates.dropna().duplicated().any():
            notes.append(
                "Duplicate dates found; the last row for each date will be kept."
            )
        if frequency:
            expected = bounded_grid_count(dates.min(), dates.max(), frequency)
            missing = expected - dates.dropna().nunique()
            if missing > 0:
                notes.append(f"{missing} dates are missing from the regular timeline.")
    else:
        notes.append("We couldn't detect a date column. Choose one below.")
    if frame.isna().any().any():
        notes.append(
            "Missing values found. Only internal gaps of up to 3 points can be filled."
        )
    return {
        "schema_version": 1,
        "columns": list(frame.columns),
        "detected_date_column": date,
        "detected_numeric_columns": numeric,
        "rows": frame.head(10)
        .replace({np.nan: None, np.inf: None, -np.inf: None})
        .to_dict("records"),
        "row_count": len(frame),
        "detected_frequency": frequency,
        "warnings": notes,
    }


@dataclass
class CleanSeries:
    values: pd.Series
    frequency: str
    n_filled: int
    warnings: list[str]


def clean(
    frame: pd.DataFrame,
    date_column: str,
    value_column: str,
    frequency: str | None = None,
    fill: bool = True,
) -> CleanSeries:
    if date_column not in frame or value_column not in frame:
        raise ValueError("Choose date and value columns that exist in your CSV.")
    if date_column == value_column:
        raise ValueError("Choose different columns for dates and values.")
    dates = parse_dates(frame[date_column])
    if dates.notna().sum() == 0:
        raise ValueError(
            f"We couldn't find any dates in column '{date_column}'. Try picking a different column."
        )
    numbers = pd.to_numeric(frame[value_column], errors="coerce").replace(
        [np.inf, -np.inf], np.nan
    )
    series = pd.Series(numbers.to_numpy(), index=pd.DatetimeIndex(dates))
    notes = []
    if dates.isna().any():
        notes.append(f"Dropped {int(dates.isna().sum())} rows with unreadable dates.")
    series = series[series.index.notna()]
    duplicates = int(series.index.duplicated(keep="last").sum())
    if duplicates:
        notes.append(
            f"Removed {duplicates} duplicate timestamps, keeping the last row."
        )
    series = series[~series.index.duplicated(keep="last")].sort_index()
    if series.notna().sum() < 30:
        raise ValueError("We need at least 30 valid data points to make a forecast.")
    freq = frequency or infer_frequency(series.index)
    if not freq:
        raise ValueError(
            "We couldn't determine a regular frequency. Choose a frequency below."
        )
    try:
        offset = pd.tseries.frequencies.to_offset(freq)
        if offset.n <= 0:
            raise ValueError()
        # Bound allocation before constructing a potentially enormous grid.
        first_step = (series.index[0] + offset) - series.index[0]
        if (
            first_step <= pd.Timedelta(0)
            or (series.index[-1] - series.index[0]) / first_step > MAX_POINTS * 1.1
        ):
            raise ValueError()
        grid = pd.date_range(series.index[0], series.index[-1], freq=offset)
        if len(grid) > MAX_POINTS:
            raise ValueError()
    except (ValueError, OverflowError, pd.errors.OutOfBoundsDatetime) as exc:
        raise ValueError(
            "Choose a supported frequency with no more than 100,000 time points."
        ) from exc
    if not series.index.isin(grid).all():
        raise ValueError(
            "Some dates don't fit that frequency. Choose a frequency matching your timestamps."
        )
    series = series.reindex(grid)
    if not fill:
        return CleanSeries(series, offset.freqstr, 0, notes)
    missing = series.isna()
    runs = missing.groupby((~missing).cumsum()).transform("sum")
    if (runs[missing] > 3).any() or missing.iloc[0] or missing.iloc[-1]:
        raise ValueError(
            "Your data has a gap longer than 3 points or missing values at an edge. Please fill these in your CSV first."
        )
    filled = int(missing.sum())
    series = series.interpolate(method="time", limit_area="inside")
    if filled:
        notes.append(f"Filled {filled} missing points by interpolation.")
    return CleanSeries(series, offset.freqstr, filled, notes)


def bounded_grid_count(start: pd.Timestamp, end: pd.Timestamp, frequency: str) -> int:
    offset = pd.tseries.frequencies.to_offset(frequency)
    step = start + offset - start
    if step <= pd.Timedelta(0) or (end - start) / step > MAX_POINTS * 1.1:
        raise ValueError("Timeline exceeds 100,000 points. Choose a smaller CSV.")
    return len(pd.date_range(start, end, freq=frequency))


def select_window(frame: pd.DataFrame, date_column: str, train_start: str | None = None, train_end: str | None = None) -> pd.DataFrame:
    if date_column not in frame:
        raise ValueError("Choose a date column that exists in your CSV.")
    dates = parse_dates(frame[date_column])
    mask = pd.Series(True, index=frame.index)
    bounds = []
    for name, value in (("start", train_start), ("end", train_end)):
        if value:
            try:
                bound = pd.Timestamp(value).as_unit("ns")
                bound = bound.tz_localize("UTC") if bound.tzinfo is None else bound.tz_convert("UTC")
                if pd.isna(bound):
                    raise ValueError()
            except (ValueError, TypeError) as exc:
                raise ValueError("Enter valid training dates.") from exc
            bounds.append(bound)
            if name == "start":
                mask &= dates >= bound
            else:
                if len(value) == 10:
                    mask = mask & (dates < (bound + timedelta(days=1)))
                else:
                    mask = mask & (dates <= bound)
    if len(bounds) == 2 and bounds[0] > bounds[1]:
        raise ValueError("Training start must be before training end.")
    return frame.loc[mask].copy()
