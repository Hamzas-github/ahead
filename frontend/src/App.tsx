import { useCallback, useEffect, useRef, useState } from "react";
import { ChevronDown } from "lucide-react";
import { download, number, unit } from "./api";
import { useWorkspace } from "./hooks/useWorkspace";
import AppShell from "./components/AppShell";
import Sidebar from "./components/Sidebar";
import DropZone from "./components/DropZone";
import StatRow from "./components/StatRow";
import ForecastChart from "./components/ForecastChart";
import { InlineMessage } from "./components/Primitives";
import ReliabilityPanel from "./components/ReliabilityPanel";
import { downloadBrief } from "./report";
import "./workspace-product.css";

export default function App() {
  const w = useWorkspace();
  const input = useRef<HTMLInputElement>(null);
  const [ready, setReady] = useState(false);
  const [view, setView] = useState<"forecast" | "reliability">("forecast");
  const sampleStarted = useRef(false);
  useEffect(() => {
    if (
      !sampleStarted.current &&
      new URLSearchParams(location.search).get("sample") === "1"
    ) {
      sampleStarted.current = true;
      void w.sample();
    }
  }, [w.sample]);
  const onReady = useCallback(() => setReady(true), []);
  const f = w.result?.forecast;
  const last = w.history.values.at(-1) ?? null;
  const end = f?.point.at(-1) ?? null;
  const delta = end !== null && last !== null ? end - last : 0;
  const trend =
    Math.abs(delta) < Math.max(Math.abs(last ?? 0) * 0.02, 1e-8)
      ? "stay near the last observed value"
      : delta > 0
        ? "rise"
        : "fall";
  const onFile = (file: File) => {
    setReady(false);
    void w.upload(file);
  };
  return (
    <>
      <input
        ref={input}
        type="file"
        accept=".csv,text/csv"
        className="file-input"
        tabIndex={-1}
        aria-label="Upload CSV"
        onChange={(event) => {
          const file = event.target.files?.[0];
          if (file) onFile(file);
          event.target.value = "";
        }}
      />
      <AppShell
        filename={w.file?.name}
        rows={w.preview?.row_count}
        busy={!!w.busy}
        canDownload={!!w.result && !w.stale}
        onDownload={() => w.result && download(w.result)}
        onReplace={() => input.current?.click()}
        sidebar={
          <Sidebar
            file={w.file}
            preview={w.preview}
            controls={w.controls}
            busy={w.busy}
            stale={w.stale}
            hasResult={!!w.result}
            onChange={w.update}
            history={w.rawHistory}
            selectedCount={w.selectedHistory.values.length}
            onReliability={() => setView("reliability")}
            onRun={() => {
              setView("forecast");
              setReady(false);
              void w.run();
            }}
          />
        }
      >
        {w.error && <InlineMessage>{w.error}</InlineMessage>}
        {w.engine && !w.engine.commercial_use && (
          <InlineMessage>
            Research mode. This engine is not licensed for commercial planning.
            Switch the server to the statistical engine for business use.
          </InlineMessage>
        )}
        {!w.preview ? (
          <DropZone
            busy={w.busy === "upload"}
            onBrowse={() => input.current?.click()}
            onFile={onFile}
            onSample={() => void w.sample()}
          />
        ) : (
          <>
            <div
              className="workspace-tabs"
              role="tablist"
              aria-label="Planning workflow"
              onKeyDown={(e) => {
                if (!["ArrowLeft", "ArrowRight", "Home", "End"].includes(e.key))
                  return;
                e.preventDefault();
                const next =
                  e.key === "Home"
                    ? "forecast"
                    : e.key === "End"
                      ? "reliability"
                      : view === "forecast"
                        ? "reliability"
                        : "forecast";
                setView(next);
                e.currentTarget
                  .querySelector<HTMLButtonElement>(`#${next}-tab`)
                  ?.focus();
              }}
            >
              <button
                role="tab"
                tabIndex={view === "forecast" ? 0 : -1}
                id="forecast-tab"
                aria-controls="forecast-panel"
                aria-selected={view === "forecast"}
                onClick={() => setView("forecast")}
              >
                1. See what comes next
              </button>
              <button
                role="tab"
                tabIndex={view === "reliability" ? 0 : -1}
                id="reliability-tab"
                aria-controls="reliability-panel"
                aria-selected={view === "reliability"}
                onClick={() => setView("reliability")}
              >
                2. Check with past data
              </button>
              <a
                href="/guides/read-a-forecast"
                target="_blank"
                rel="noopener"
                title="Opens in a new tab"
              >
                Help reading this ↗
              </a>
            </div>
            {view === "reliability" ? (
              <div
                id="reliability-panel"
                role="tabpanel"
                aria-labelledby="reliability-tab"
              >
                <ReliabilityPanel
                  result={w.backtest}
                  horizon={w.controls.horizon}
                  count={w.selectedHistory.values.length}
                  busy={!!w.busy}
                  stale={w.backtestStale}
                  onCheck={(h, f) => void w.check(h, f)}
                />
              </div>
            ) : (
              <div
                id="forecast-panel"
                role="tabpanel"
                aria-labelledby="forecast-tab"
                className="forecast-content"
              >
                <div className="canvas-heading">
                  <h1>
                    {w.result
                      ? `${w.resultValue}: what comes next`
                      : "Review your data"}
                  </h1>
                  <span>
                    {w.busy === "forecast"
                      ? "Working it out"
                      : w.stale
                        ? "Settings changed"
                        : w.result
                          ? "Prediction ready"
                          : "Ready when you are"}
                  </span>
                </div>
                <StatRow
                  last={last}
                  end={end}
                  firstReveal={
                    w.revision === 1 && !ready && w.busy !== "forecast"
                  }
                />
                <ForecastChart
                  key={w.datasetId}
                  history={w.history}
                  forecast={w.result?.forecast}
                  generation={w.revision}
                  loading={w.busy === "forecast"}
                  stale={w.stale}
                  valueLabel={w.result ? w.resultValue : w.controls.value}
                  onReady={onReady}
                />
                <div
                  className={`chart-explanation ${ready ? "is-ready" : ""}`}
                  aria-live="polite"
                >
                  <p>
                    {w.result && f && end !== null ? (
                      <>
                        Over the next{" "}
                        <span className="mono">{f.point.length}</span>{" "}
                        {unit(w.result.metadata.frequency)}, the numbers may{" "}
                        {trend}, reaching{" "}
                        <span className="prediction mono">{number(end)}</span>{" "}
                        <span className="muted">
                          (likely {number(f.lower.at(-1)!)}–
                          {number(f.upper.at(-1)!)}).
                        </span>
                      </>
                    ) : w.busy === "forecast" ? (
                      "Reading patterns in your history. This may take a moment."
                    ) : (
                      "These are your past numbers. Choose how far ahead and press Make prediction."
                    )}
                  </p>
                  <details className="how-to">
                    <summary>
                      How to read this
                      <ChevronDown />
                    </summary>
                    <p>
                      White shows what happened. Green shows what might happen
                      next. The shaded area shows a possible range. It is not a
                      promise. <br />
                      Real numbers can fall outside the shaded area.
                      {w.result?.metadata.model_version.startsWith("mock")
                        ? " Demo mode uses a seasonal-naive prediction and an illustrative range."
                        : ""}
                    </p>
                  </details>
                </div>
                {w.result && (
                  <div className="next-action">
                    <div>
                      <strong>See how close we get.</strong>
                      <p>
                        {w.backtest && !w.backtestStale
                          ? "Your past-data check is ready. Review it or save a summary."
                          : "Try it on past numbers before using the result."}
                      </p>
                    </div>
                    <button
                      className="secondary"
                      disabled={!!w.busy}
                      onClick={() => setView("reliability")}
                    >
                      Check with past data
                    </button>
                    <button
                      className="secondary"
                      disabled={w.stale || !!w.busy}
                      onClick={() =>
                        downloadBrief(
                          w.result!,
                          w.file!.name,
                          w.resultValue,
                          w.backtestStale ? null : w.backtest,
                        )
                      }
                    >
                      Save summary
                    </button>
                  </div>
                )}
                <div className="canvas-status">
                  <span>
                    {w.result
                      ? w.result.metadata.model_version.startsWith("mock")
                        ? "Demo · seasonal-naive"
                        : (w.result.metadata.engine?.name ??
                          w.result.metadata.model_version)
                      : (w.engine?.name ?? "Forecast engine")}
                    <span className="status-separator">/</span>
                    {w.result
                      ? `${(w.result.metadata.runtime_ms / 1000).toFixed(1)}s`
                      : "Ready"}
                  </span>
                  <span>
                    {w.result
                      ? `${w.result.metadata.n_filled_points} blank numbers filled in`
                      : "Your uploaded numbers"}
                  </span>
                </div>
                <details className="preview-table">
                  <summary>
                    See the numbers in your file · first 10 rows
                  </summary>
                  <div className="table-scroll">
                    <table>
                      <thead>
                        <tr>
                          {w.preview.columns.map((c) => (
                            <th key={c}>{c}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {w.preview.rows.map((row, i) => (
                          <tr key={i}>
                            {w.preview!.columns.map((c) => (
                              <td key={c}>{row[c] ?? "Missing"}</td>
                            ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </details>
                {(w.result?.metadata.warnings ?? w.preview.warnings).length >
                  0 && (
                  <details className="data-notes">
                    <summary>
                      {
                        (w.result?.metadata.warnings ?? w.preview.warnings)
                          .length
                      }{" "}
                      data notes
                      <ChevronDown />
                    </summary>
                    {(w.result?.metadata.warnings ?? w.preview.warnings).map(
                      (note) => (
                        <p key={note}>{note}</p>
                      ),
                    )}
                  </details>
                )}
              </div>
            )}
          </>
        )}
      </AppShell>
    </>
  );
}
