"""Exercise the real adapter contract without downloading weights in unit tests."""

import importlib
import sys
from types import SimpleNamespace
import numpy as np
import pytest

module = importlib.import_module("app.forecast")


def test_real_adapter_quantiles_and_reuse(monkeypatch):
    monkeypatch.delenv("USE_MOCK_MODEL", raising=False)
    monkeypatch.setenv("FORECAST_ENGINE", "timesfm")
    monkeypatch.setattr(module, "_model", None)
    creations = []

    class Evaluator:
        def __init__(self, config):
            creations.append(config)

        def predict_batch(self, values, **kwargs):
            assert values[0].shape == (40,)
            assert kwargs["return_quantiles"] is True
            assert kwargs["make_positive"] is False
            h = kwargs["horizon"]
            yield SimpleNamespace(
                forecast=np.full(h, 4), quantiles=np.tile(np.arange(9), (h, 1))
            )

    monkeypatch.setitem(
        sys.modules,
        "torch",
        SimpleNamespace(cuda=SimpleNamespace(is_available=lambda: False)),
    )
    monkeypatch.setitem(
        sys.modules,
        "timesfm3",
        SimpleNamespace(ModelConfig=lambda **kw: kw, TimesFM3Evaluator=Evaluator),
    )
    for _ in range(2):
        result = module.forecast(np.arange(40), 5, "D")
        assert result == {"point": [4] * 5, "lower": [0] * 5, "upper": [8] * 5}
    assert len(creations) == 1
    assert creations[0]["device"] == "cpu"


def test_real_adapter_load_error(monkeypatch):
    monkeypatch.delenv("USE_MOCK_MODEL", raising=False)
    monkeypatch.setenv("FORECAST_ENGINE", "timesfm")
    monkeypatch.setattr(module, "_model", None)

    def fail(**kwargs):
        raise OSError("offline")

    monkeypatch.setitem(
        sys.modules,
        "torch",
        SimpleNamespace(cuda=SimpleNamespace(is_available=lambda: False)),
    )
    monkeypatch.setitem(
        sys.modules,
        "timesfm3",
        SimpleNamespace(ModelConfig=fail, TimesFM3Evaluator=object),
    )
    with pytest.raises(module.ModelError, match="USE_MOCK_MODEL=1"):
        module.forecast(np.arange(40), 5, "D")


def test_training_bounds(monkeypatch):
    monkeypatch.setenv("USE_MOCK_MODEL", "1")
    values = np.arange(100)
    assert module.forecast(
        values, 5, "D", train_start=20, train_end=70
    ) == module.forecast(values[20:70], 5, "D")
