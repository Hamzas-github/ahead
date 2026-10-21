import numpy as np
import pandas as pd
import pytest
from fastapi.testclient import TestClient
from app.main import app
from app.forecast import forecast, ModelError
from app.backtest import metrics, build_backtest

client = TestClient(app)

@pytest.fixture(autouse=True)
def statistical(monkeypatch):
    monkeypatch.delenv('USE_MOCK_MODEL', raising=False)
    monkeypatch.setenv('FORECAST_ENGINE', 'statistical')


def data(n=100):
    return pd.DataFrame({'date': pd.date_range('2020-01-01', periods=n), 'value': 10 + np.arange(n) * .5})


def test_linear_extrapolation():
    r = forecast(10 + np.arange(100) * .5, 12, 'D')
    np.testing.assert_allclose(r['point'], 10 + np.arange(100,112)*.5, atol=1e-7)


def test_production_guard(monkeypatch):
    monkeypatch.setenv('FORECAST_ENGINE', 'timesfm')
    monkeypatch.setenv('APP_ENV', 'production')
    with pytest.raises(ModelError, match='noncommercial'):
        forecast(np.arange(40), 5, 'D')
    assert client.get('/api/health').status_code == 503


def test_metrics():
    r=metrics([4,8], {'point':[2,10], 'lower':[1,7], 'upper':[5,11]}, np.arange(30), 7)
    assert r['mae']==pytest.approx(2)
    assert r['mase']==pytest.approx(2/7)
    assert r['smape']==pytest.approx(200*((2/6+2/18)/2))
    assert r['coverage']==1
    r=metrics([0], {'point':[0], 'lower':[0], 'upper':[0]}, np.zeros(30), 52)
    assert r['mase'] is None and r['smape'] is None


def test_window_and_three_folds():
    raw=data().to_csv(index=False).encode()
    form={'date_column':'date','value_column':'value','horizon':10, 'train_start':'2020-01-11', 'train_end':'2020-03-30'}
    r=client.post('/api/forecast', files={'file':('x.csv',raw)}, data=form)
    assert r.status_code==200, r.text
    assert r.json()['metadata']['n_history_points']==80
    r=client.post('/api/backtest',files={'file':('x.csv',raw)},data={**form,'folds':3})
    assert r.status_code==200, r.text
    assert len(r.json()['folds'])==3
    assert r.json()['metrics']['mae']<1e-7


def test_gap_at_training_boundary_cannot_use_holdout():
    df=data(60);df.loc[49,'value']=np.nan
    with pytest.raises(ValueError,match='edge'):
        build_backtest(df.to_csv(index=False).encode(),'date','value',10)


def test_holdout_never_filled():
    df=data(60);df.loc[55,'value']=np.nan
    with pytest.raises(ValueError,match='holdout'):
        build_backtest(df.to_csv(index=False).encode(),'date','value',10)


def test_holdout_values_do_not_change_predictions():
    df=data(60)
    a=build_backtest(df.to_csv(index=False).encode(),'date','value',10)
    df.loc[50:,'value']+=10000
    b=build_backtest(df.to_csv(index=False).encode(),'date','value',10)
    assert a['folds'][0]['point']==b['folds'][0]['point']


def test_unknown_api_not_spa():
    assert client.get('/api/absent').status_code==404

def test_static_pages_and_real_404(tmp_path, monkeypatch):
    import app.main as main
    (tmp_path/'app').mkdir()
    (tmp_path/'app'/'index.html').write_text('workspace')
    (tmp_path/'fallback404.html').write_text('missing')
    monkeypatch.setattr(main, 'DIST', tmp_path)
    assert client.get('/app').text=='workspace'
    assert client.get('/absent').status_code==404
    assert client.get('/api/absent').status_code==404
    assert client.get('/%2e%2e/secret').status_code==404


def test_bounded_jobs_release_after_failure():
    import app.main as main
    main._jobs.acquire();main._jobs.acquire()
    try:
        response=client.post('/api/forecast',files={'file':('x.csv',data().to_csv(index=False).encode())},data={'date_column':'date','value_column':'value','horizon':10})
        assert response.status_code==429
    finally:
        main._jobs.release();main._jobs.release()


def test_negative_and_huge_values():
    result = forecast(-100 + np.arange(100) * .2, 12, 'D')
    assert max(result['point']) < 0
    result = forecast(np.full(100, 1e300), 12, 'D')
    assert np.isfinite(result['upper']).all()
    with pytest.raises(ValueError, match='Rescale'):
        forecast(np.linspace(0, 1e308, 100), 256, 'D')


def test_weekly_sample_horizon():
    df = data(156)
    df['date'] = pd.date_range('2021-01-04', periods=156, freq='W-MON')
    result = build_backtest(df.to_csv(index=False).encode(), 'date', 'value', 31, folds=3)
    assert len(result['folds']) == 3
    assert result['metrics']['mae'] < 1e-10
    assert result['metrics']['mase'] is not None


def test_mock_interval_label(monkeypatch):
    from app.forecast import engine_metadata
    monkeypatch.setenv('USE_MOCK_MODEL', '1')
    assert 'standard-deviation' in engine_metadata()['interval_label']


def test_huge_backtest_aggregate_stays_finite():
    df = data(100)
    df['value'] = np.random.default_rng(7).choice([-8e307, 8e307], len(df))
    result = build_backtest(df.to_csv(index=False).encode(), 'date', 'value', 10, folds=3)
    expected = sum(fold['metrics']['mae'] / 3 for fold in result['folds'])
    assert np.isfinite(result['metrics']['mae'])
    assert result['metrics']['mae'] == pytest.approx(expected)


def test_mock_large_finite_values(monkeypatch):
    monkeypatch.setenv('USE_MOCK_MODEL', '1')
    result = forecast(np.linspace(1e300, 2e300, 100), 12, 'D')
    assert all(np.isfinite(values).all() for values in result.values())
    with pytest.raises(ValueError, match='Rescale'):
        forecast(np.resize([-1e308, 1e308], 100), 256, 'D')
