import { useEffect, useState } from "react";
import {
  ChevronDown,
  LoaderCircle,
  Minus,
  Plus,
  ArrowRight,
} from "lucide-react";
import { unit, type Preview } from "../api";
import type { Controls, History } from "../hooks/useWorkspace";
import TrainingWindow from "./TrainingWindow";
import { ControlGroup, Field, Select } from "./Primitives";

type Props = {
  file: File | null;
  preview: Preview | null;
  controls: Controls;
  busy: string | null;
  stale: boolean;
  hasResult: boolean;
  onChange: (patch: Partial<Controls>) => void;
  onRun: () => void;
  history: History;
  selectedCount: number;
  onReliability: () => void;
};
export default function Sidebar({
  file,
  preview,
  controls,
  busy,
  stale,
  hasResult,
  onChange,
  onRun,
  history,
  selectedCount,
  onReliability,
}: Props) {
  const [open, setOpen] = useState(
    () => matchMedia("(min-width:1024px)").matches,
  );
  useEffect(() => {
    const media = matchMedia("(min-width:1024px)");
    const change = () => setOpen(media.matches);
    media.addEventListener("change", change);
    return () => media.removeEventListener("change", change);
  }, []);
  const freq = controls.frequency || preview?.detected_frequency || "";
  const units = unit(freq);
  const picks =
    units === "months"
      ? [3, 6, 12]
      : units === "weeks"
        ? [4, 8, 12]
        : units === "hours"
          ? [12, 24, 48]
          : [7, 30, 90];
  const valid =
    Number.isInteger(controls.horizon) &&
    controls.horizon >= 1 &&
    controls.horizon <= 256;
  return (
    <aside className="sidebar">
      <details
        className="controls-details"
        open={open}
        onToggle={(event) => {
          if (matchMedia("(min-width:1024px)").matches) {
            event.currentTarget.open = true;
            setOpen(true);
          } else setOpen(event.currentTarget.open);
        }}
      >
        <summary className="sidebar-title">
          Controls
          <ChevronDown aria-hidden="true" />
        </summary>
        <div className="sidebar-scroll">
          <ControlGroup title="Your file">
            <div className="file-info">
              <p title={file?.name}>{file?.name ?? "No dataset selected"}</p>
              <dl>
                <div>
                  <dt>Rows of numbers</dt>
                  <dd>{preview?.row_count.toLocaleString() ?? "—"}</dd>
                </div>
                <div>
                  <dt>Time between rows</dt>
                  <dd>
                    {preview?.detected_frequency
                      ? ((
                          {
                            days: "Daily",
                            weeks: "Weekly",
                            months: "Monthly",
                            hours: "Hourly",
                            quarters: "Quarterly",
                            years: "Yearly",
                          } as Record<string, string>
                        )[unit(preview.detected_frequency)] ??
                        preview.detected_frequency)
                      : "—"}
                  </dd>
                </div>
              </dl>
            </div>
            <fieldset disabled={!preview || !!busy}>
              <Field
                label="Which column has dates?"
                help="Choose the column with calendar dates, such as 2025-01-01. We use it to put your numbers in order."
                tag={
                  controls.date === preview?.detected_date_column
                    ? "suggested"
                    : undefined
                }
              >
                <Select
                  value={controls.date}
                  onChange={(e) => onChange({ date: e.target.value })}
                >
                  <option value="" disabled>
                    Select date column
                  </option>
                  {preview?.columns.map((c) => (
                    <option key={c}>{c}</option>
                  ))}
                </Select>
              </Field>
              <Field
                label="What should we predict?"
                help="Choose the numbers you want to estimate, such as weekly orders. The green line will predict these numbers."
                tag={
                  preview?.detected_numeric_columns.includes(controls.value)
                    ? "suggested"
                    : undefined
                }
              >
                <Select
                  value={controls.value}
                  onChange={(e) => onChange({ value: e.target.value })}
                >
                  <option value="" disabled>
                    Select value column
                  </option>
                  {preview?.columns.map((c) => (
                    <option key={c}>{c}</option>
                  ))}
                </Select>
              </Field>
              <details className="frequency-options">
                <summary>
                  Change time spacing
                  <ChevronDown aria-hidden="true" />
                </summary>
                <Field
                  label="Time between rows"
                  help="Usually you can leave this alone. Change it only if we picked days when your numbers are actually weeks or months."
                >
                  <Select
                    value={controls.frequency}
                    onChange={(e) => onChange({ frequency: e.target.value })}
                  >
                    <option value="">
                      Choose for me
                      {preview?.detected_frequency
                        ? ` (${preview.detected_frequency})`
                        : ""}
                    </option>
                    <option value="h">Hourly</option>
                    <option value="D">Daily</option>
                    <option value="W-MON">Weekly · Monday</option>
                    <option value="W-SUN">Weekly · Sunday</option>
                    <option value="MS">Monthly · start</option>
                    <option value="ME">Monthly · end</option>
                    <option value="QS">Quarterly · start</option>
                    <option value="YS">Yearly · start</option>
                  </Select>
                </Field>
              </details>
            </fieldset>
          </ControlGroup>
          <ControlGroup title="Look ahead">
            <fieldset disabled={!preview || !!busy}>
              <Field
                label="How far ahead?"
                help="Choose how many future days, weeks or months to estimate. Looking farther ahead is usually less certain."
              >
                <div className="stepper">
                  <button
                    type="button"
                    aria-label="Look one step less ahead"
                    disabled={controls.horizon <= 1}
                    onClick={() =>
                      onChange({ horizon: Math.max(1, controls.horizon - 1) })
                    }
                  >
                    <Minus />
                  </button>
                  <input
                    aria-label="How far ahead?"
                    aria-invalid={!valid}
                    aria-describedby={!valid ? "horizon-error" : undefined}
                    type="number"
                    min={1}
                    max={256}
                    step={1}
                    value={controls.horizon || ""}
                    onChange={(e) =>
                      onChange({ horizon: Number(e.target.value) })
                    }
                  />
                  <span>{units}</span>
                  <button
                    type="button"
                    aria-label="Look one step further ahead"
                    disabled={controls.horizon >= 256}
                    onClick={() =>
                      onChange({ horizon: Math.min(256, controls.horizon + 1) })
                    }
                  >
                    <Plus />
                  </button>
                </div>
              </Field>
              <div className="quick-picks" aria-label="Quick forecast lengths">
                {picks.map((n) => (
                  <button
                    type="button"
                    key={n}
                    aria-pressed={controls.horizon === n}
                    onClick={() => onChange({ horizon: n })}
                  >
                    {n}
                    <span>{units}</span>
                  </button>
                ))}
              </div>
            </fieldset>
            {!valid && (
              <p className="field-error" id="horizon-error">
                Enter a whole number from 1 to 256.
              </p>
            )}
            <button
              className="primary run-button"
              disabled={
                !preview ||
                !!busy ||
                !valid ||
                selectedCount < 30 ||
                !controls.date ||
                !controls.value
              }
              onClick={onRun}
            >
              {busy === "forecast" ? (
                <>
                  <LoaderCircle className="spinner" />
                  Making your prediction…
                </>
              ) : (
                <>
                  {hasResult ? "Update prediction" : "Make prediction"}
                  <ArrowRight />
                </>
              )}
            </button>
            <p className={`run-hint ${stale ? "stale" : ""}`} role="status">
              {stale ? (
                <>
                  <i />
                  Settings changed · update your prediction
                </>
              ) : busy === "forecast" ? (
                "Looking for patterns in your past numbers."
              ) : hasResult ? (
                "Your prediction is up to date."
              ) : (
                "Choose how far ahead, then press the green button."
              )}
            </p>
          </ControlGroup>
          <ControlGroup
            title="Dates to use"
            help="By default, we use all your dates. Pick a shorter time if older numbers no longer describe how things work."
          >
            <TrainingWindow
              history={history}
              controls={controls}
              count={selectedCount}
              disabled={!!busy}
              onChange={onChange}
            />
          </ControlGroup>
          <ControlGroup title="Check with past data">
            <p>
              Try predicting numbers you already know to see how close we get.
            </p>
            <button
              className="secondary"
              disabled={!preview || !!busy}
              onClick={onReliability}
            >
              Try a past-data check
            </button>
          </ControlGroup>
          <div className="sidebar-footer">
            <span>YOUR FILE IS NOT SAVED</span>
            <p>
              Sent to the server to work out the result.{" "}
              <a href="/privacy" target="_blank" rel="noopener">
                Privacy ↗
              </a>{" "}
              ·{" "}
              <a href="/guides" target="_blank" rel="noopener">
                Guides ↗
              </a>
            </p>
          </div>
        </div>
      </details>
    </aside>
  );
}
