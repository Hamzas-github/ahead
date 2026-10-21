import { useEffect, useState } from "react";

import { line, area } from "d3-shape";

import { scaleLinear } from "d3-scale";

import { number, type Backtest } from "../api";

import { Help } from "./Primitives";

export default function ReliabilityPanel({
  result,

  horizon,

  count,

  busy,

  stale,

  onCheck,
}: {
  result: Backtest | null;

  horizon: number;

  count: number;

  busy: boolean;

  stale: boolean;

  onCheck: (holdout: number, folds: number) => void;
}) {
  const [holdout, setHoldout] = useState(horizon);

  const [folds, setFolds] = useState(result?.metadata.folds ?? 1);

  const [fold, setFold] = useState(0);

  useEffect(() => setHoldout(horizon), [horizon]);

  useEffect(() => setFold(0), [result]);

  const valid =
    Number.isInteger(holdout) &&
    holdout >= 1 &&
    holdout <= 256 &&
    count - holdout * folds >= 30;

  const changed =
    stale ||
    (!!result &&
      (result.metadata.horizon !== holdout || result.folds.length !== folds));

  const f = result?.folds[Math.min(fold, result.folds.length - 1)];

  const all = f ? [...f.actual, ...f.lower, ...f.upper, ...f.point] : [0, 1];

  const lo = Math.min(...all),
    hi = Math.max(...all);

  const y = scaleLinear()
    .domain([lo - (hi - lo || 1) * 0.1, hi + (hi - lo || 1) * 0.1])

    .nice()

    .range([238, 20]);

  const x = scaleLinear()
    .domain([0, Math.max(1, (f?.dates.length ?? 2) - 1)])

    .range([64, 740]);

  const path = line<number>()
    .x((_, i) => x(i))

    .y((v) => y(v));

  const band = area<number>()
    .x((_, i) => x(i))

    .y0((_, i) => y(f!.lower[i]))

    .y1((_, i) => y(f!.upper[i]));

  return (
    <section className="reliability-panel" aria-labelledby="reliability-title">
      <div className="panel-intro">
        <span className="eyebrow">TRY IT BEFORE YOU TRUST IT</span>

        <h1 id="reliability-title">How close can we get?</h1>

        <p>
          We hide some past numbers, try to guess them, then compare our guesses
          with the real answers.
        </p>
      </div>

      <div className="backtest-controls">
        <div className="field-container">
          <Help title="How many numbers to hide?">
            We hide this many numbers from the end. More hidden numbers make the
            test look further ahead.
          </Help>
          <label>
            How many numbers to hide?
            <input
              aria-label="How many numbers to hide?"

              type="number"

              min="1"

              max="256"

              value={holdout || ""}

              onChange={(e) => setHoldout(Number(e.target.value))}

              disabled={busy}
            />
          </label>
        </div>

        <div className="field-container">
          <Help title="How many tries?">
            One try checks the latest dates. Three tries check different dates,
            so one unusual period matters less.
          </Help>
          <label>
            How many tries?
            <select
              value={folds}

              onChange={(e) => setFolds(Number(e.target.value))}

              disabled={busy}
            >
              <option value="1">Once - most recent numbers</option>

              <option value="3">Three times - different dates</option>
            </select>
          </label>
        </div>

        <button
          className="primary"

          disabled={!valid || busy}

          onClick={() => onCheck(holdout, folds)}
        >
          {busy
            ? "Checking past predictions…"
            : result
              ? "Run check again"
              : "Check with past data"}
        </button>
      </div>

      {!valid && (
        <p className="warning-text" role="status">
          Use 1–256 holdout points and leave at least 30 earlier points in every
          test window. This selection needs {30 + holdout * folds} observations;
          you have {count}.
        </p>
      )}

      {changed && (
        <p className="warning-text" role="status">
          Settings changed. Run the check again before using these scores.
        </p>
      )}

      {result && f ? (
        <>
          <div className="reliability-verdict">
            <span className="reliability-badge">Past-data check complete</span>

            <p>
              Across {result.folds.length} past{" "}
              {result.folds.length === 1 ? "try" : "tries"}, predictions were
              off by {number(result.metrics.mae)} units on average. The real
              numbers were inside the shaded area{" "}
              {number(result.metrics.coverage * 100)}% of the time.
            </p>
          </div>

          <dl className="metrics-grid simple-metrics">
            <div>
              <dt>
                Average miss{" "}
                <Help title="Average miss">
                  How far our guesses were from the real numbers, on average.
                  Smaller is better. For orders, this is a number of orders.
                </Help>
              </dt>
              <dd>{number(result.metrics.mae)}</dd>
              <small>In the same units as your numbers</small>
            </div>

            <div>
              <dt>
                Inside the shaded area{" "}
                <Help title="Inside the shaded area">
                  How often the real answer was between the low and high
                  estimates. A wide area can catch more answers without giving a
                  useful guess.
                </Help>
              </dt>
              <dd>{number(result.metrics.coverage * 100)}%</dd>
              <small>How often the real answer was in range</small>
            </div>
          </dl>

          <details className="score-details">
            <summary>More details about the check</summary>

            <dl className="metrics-grid simple-metrics">
              <div>
                <dt>Miss as a percentage - sMAPE</dt>
                <dd>
                  {result.metrics.smape === null
                    ? "Not available"
                    : `${number(result.metrics.smape)}%`}
                </dd>
                <small>
                  Compares the miss with the size of the guess and the answer.
                  Smaller is better.
                </small>
              </div>

              <div>
                <dt>Miss compared with past changes - MASE</dt>
                <dd>
                  {result.metrics.mase === null
                    ? "Not available"
                    : number(result.metrics.mase)}
                </dd>
                <small>
                  Below 1 means the miss was smaller than typical seasonal
                  changes in the earlier data. It does not promise future
                  accuracy.
                </small>
              </div>
            </dl>

            {result.metadata.warnings.map((w, i) => (
              <p className="field-help" key={i}>
                {w}
              </p>
            ))}
          </details>

          <div className="backtest-chart-heading">
            <h2>Our guesses and the real answers</h2>

            {result.folds.length > 1 && (
              <label>
                Try{" "}
                <select
                  aria-label="Which try to show"

                  value={fold}

                  onChange={(e) => setFold(Number(e.target.value))}
                >
                  {result.folds.map((_, i) => (
                    <option key={i} value={i}>
                      Try {i + 1}
                    </option>
                  ))}
                </select>
              </label>
            )}
          </div>

          <div className="backtest-legend">
            <span>— What actually happened</span>

            <span className="prediction">— What we predicted</span>

            <span className="muted">Shaded: possible range</span>
          </div>

          <svg
            className="backtest-chart"

            viewBox="0 0 800 280"

            role="img"

            aria-label={`Held-out predictions against actual values from ${f.dates[0]?.slice(0, 10)} to ${f.dates.at(-1)?.slice(0, 10)}. Data table below.`}
          >
            {y.ticks(4).map((v) => (
              <g key={v}>
                <line
                  x1="64"

                  x2="740"

                  y1={y(v)}

                  y2={y(v)}

                  stroke="var(--border)"
                />

                <text
                  x="52"

                  y={y(v) + 4}

                  textAnchor="end"

                  fill="var(--text-muted)"
                >
                  {new Intl.NumberFormat("en", { notation: "compact" }).format(
                    v,
                  )}
                </text>
              </g>
            ))}

            <path d={band(f.point) || ""} fill="var(--accent-dim)" />

            <path
              d={path(f.point) || ""}

              stroke="var(--accent)"

              fill="none"

              strokeWidth="2"
            />

            <path
              d={path(f.actual) || ""}

              stroke="var(--text)"

              fill="none"

              strokeWidth="1.5"
            />

            {f.point.length === 1 && (
              <>
                <circle
                  cx={x(0)}

                  cy={y(f.point[0])}

                  r="4"

                  fill="var(--accent)"
                />

                <circle
                  cx={x(0)}

                  cy={y(f.actual[0])}

                  r="3"

                  fill="var(--text)"
                />
              </>
            )}

            <text x="64" y="268" fill="var(--text-muted)">
              {f.dates[0]?.slice(0, 10)}
            </text>

            <text x="740" y="268" textAnchor="end" fill="var(--text-muted)">
              {f.dates.at(-1)?.slice(0, 10)}
            </text>
          </svg>

          <details className="backtest-table">
            <summary>See the numbers side by side</summary>

            <div className="table-scroll">
              <table>
                <thead>
                  <tr>
                    <th>Date</th>

                    <th>Actual</th>

                    <th>Predicted</th>

                    <th>Lower</th>

                    <th>Upper</th>
                  </tr>
                </thead>

                <tbody>
                  {f.dates.map((d, i) => (
                    <tr key={d}>
                      <td>{d.slice(0, 10)}</td>

                      <td>{number(f.actual[i])}</td>

                      <td>{number(f.point[i])}</td>

                      <td>{number(f.lower[i])}</td>

                      <td>{number(f.upper[i])}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </details>

          <p className="field-help">
            Doing well on old numbers does not promise a good future guess. Try
            different dates, and check again when you have new numbers.{" "}
            <a href="/methodology" target="_blank" rel="noopener">
              How this check works ↗
            </a>
            .
          </p>
        </>
      ) : (
        <div className="reliability-empty">
          <h2>A good guess should pass a test.</h2>

          <p>
            Start with one try. We only show the earlier numbers to the
            prediction tool, so it cannot peek at the answers.
          </p>
        </div>
      )}
    </section>
  );
}
