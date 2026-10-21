import numpy as np
import pandas as pd
import pytest
from app.data import clean, infer_frequency, preview, read_csv


def frame(n: int = 60) -> pd.DataFrame:
    return pd.DataFrame(
        {
            "Date": pd.date_range("2020-01-01", periods=n).astype(str),
            "Value": np.arange(n, dtype=float),
        }
    )


def test_date_detection_ignores_numbers():
    result = preview(frame())
    assert result["detected_date_column"] == "Date"
    assert result["detected_numeric_columns"] == ["Value"]
    assert result["row_count"] == 60
    assert len(result["rows"]) == 10


@pytest.mark.parametrize("freq", ["D", "MS", "ME", "h", "W-MON"])
def test_frequency(freq):
    assert infer_frequency(pd.date_range("2020-01-01", periods=40, freq=freq)) == freq


def test_gap_and_nan_filling():
    df = frame().drop(index=[10, 11])
    df.loc[20, "Value"] = np.nan
    result = clean(df, "Date", "Value")
    assert result.n_filled == 3
    np.testing.assert_allclose(result.values, np.arange(60))


def test_monthly_missing_date():
    df = frame(48)
    df["Date"] = pd.date_range("2020-01-01", periods=48, freq="MS").astype(str)
    result = clean(df.drop(index=15), "Date", "Value")
    assert result.frequency == "MS"
    assert result.n_filled == 1


def test_duplicates_keep_last_and_sort():
    df = frame()
    df = pd.concat([df, df.iloc[[10]].assign(Value=123)]).iloc[::-1]
    result = clean(df, "Date", "Value")
    assert len(result.values) == 60
    assert result.values.iloc[10] == 10


@pytest.mark.parametrize(
    "kind,match",
    [
        ("short", "30 valid"),
        ("dates", "couldn't find any dates"),
        ("gap", "gap longer"),
        ("edge", "missing values at an edge"),
        ("frequency", "don't fit"),
    ],
)
def test_validation(kind, match):
    df = frame()
    frequency = None
    if kind == "short":
        df = df.head(20)
    if kind == "dates":
        df["Date"] = "bad"
    if kind == "gap":
        df = df.drop(index=[10, 11, 12, 13])
    if kind == "edge":
        df.loc[0, "Value"] = np.nan
    if kind == "frequency":
        frequency = "MS"
    with pytest.raises(ValueError, match=match):
        clean(df, "Date", "Value", frequency)


def test_empty_csv():
    with pytest.raises(ValueError, match="couldn't read"):
        read_csv(b"")


def test_tiny_frequency_rejected_before_allocation():
    with pytest.raises(ValueError, match="100,000"):
        clean(frame(), "Date", "Value", "ns")
