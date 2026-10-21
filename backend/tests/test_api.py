import numpy as np
import pandas as pd
import pytest
from fastapi.testclient import TestClient
from app.main import app
from app.forecast import ModelError

client = TestClient(app)


@pytest.fixture(autouse=True)
def mock_model(monkeypatch):
    monkeypatch.setenv("USE_MOCK_MODEL", "1")


def csv_bytes():
    return (
        pd.DataFrame(
            {
                "date": pd.date_range("2020-01-01", periods=60),
                "value": 100 + np.sin(np.arange(60)),
            }
        )
        .to_csv(index=False)
        .encode()
    )


def test_complete_flow():
    preview = client.post(
        "/api/preview", files={"file": ("data.csv", csv_bytes(), "text/csv")}
    )
    assert preview.status_code == 200
    assert preview.json()["detected_frequency"] == "D"
    response = client.post(
        "/api/forecast",
        files={"file": ("data.csv", csv_bytes())},
        data={"date_column": "date", "value_column": "value", "horizon": 12},
    )
    assert response.status_code == 200, response.text
    result = response.json()
    assert result["schema_version"] == 1
    assert result["metadata"]["model_version"] == "mock-seasonal-naive"
    assert len(result["forecast"]["point"]) == 12
    assert result["forecast"]["dates"][0] > result["history"]["dates"][-1]
    assert all(
        a <= b for a, b in zip(result["forecast"]["lower"], result["forecast"]["upper"])
    )


@pytest.mark.parametrize("horizon", [0, 257, "oops", 1.5])
def test_bad_horizon(horizon):
    response = client.post(
        "/api/forecast",
        files={"file": ("data.csv", csv_bytes())},
        data={"date_column": "date", "value_column": "value", "horizon": horizon},
    )
    assert response.status_code == 422
    assert isinstance(response.json()["detail"], str)


def test_model_failure(monkeypatch):
    def fail(*args, **kwargs):
        raise ModelError("Weights could not download")

    monkeypatch.setattr("app.main.forecast", fail)
    response = client.post(
        "/api/forecast",
        files={"file": ("data.csv", csv_bytes())},
        data={"date_column": "date", "value_column": "value", "horizon": 12},
    )
    assert response.status_code == 503
    assert "download" in response.json()["detail"]


def test_size_limit():
    response = client.post(
        "/api/preview", files={"file": ("large.csv", b"x" * (10 * 1024 * 1024 + 1))}
    )
    assert response.status_code == 413


def test_health():
    assert client.get("/api/health").json()["status"] == "ok"
