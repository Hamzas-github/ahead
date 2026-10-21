import { useId } from "react";
import type { History, Controls } from "../hooks/useWorkspace";

export default function TrainingWindow({
  history,
  controls,
  count,
  disabled,
  onChange,
}: {
  history: History;
  controls: Controls;
  count: number;
  disabled: boolean;
  onChange: (p: Partial<Controls>) => void;
}) {
  const id = useId();
  const dates = history.dates.map((d) => d.slice(0, 10));
  const start = controls.trainStart || dates[0] || "";
  const end = controls.trainEnd || dates.at(-1) || "";
  const a = Math.max(
    0,
    dates.findIndex((d) => d >= start),
  );
  const found = dates.reduce((last, d, i) => (d <= end ? i : last), -1);
  const b = Math.max(a, found);
  const max = Math.max(1, dates.length - 1);
  const low = history.values.reduce((a, b) => Math.min(a, b), Infinity);
  const high = history.values.reduce((a, b) => Math.max(a, b), -Infinity);
  const stride = Math.max(1, Math.floor(dates.length / 240));
  const path = history.values
    .map((v, i) =>
      i % stride === 0 || i === max
        ? `${i === 0 ? "M" : "L"}${(i / max) * 260},${52 - ((v - low) / (high - low || 1)) * 44}`
        : "",
    )
    .join(" ");
  return (
    <fieldset
      className="training-controls"
      disabled={disabled || !dates.length}
    >
      <svg
        viewBox="0 0 260 60"
        role="img"
        aria-label={`${count} rows selected from ${start} to ${end}`}
      >
        <rect
          x={(a / max) * 260}
          width={Math.max(1, ((b - a) / max) * 260)}
          y="0"
          height="60"
          fill="var(--surface-2)"
          stroke="var(--border-strong)"
        />
        <path
          d={path}
          fill="none"
          stroke="var(--text-muted)"
          strokeWidth="1.25"
        />
        <path
          d={`M${(a / max) * 260} 0V60 M${(b / max) * 260} 0V60`}
          stroke="var(--text)"
          strokeWidth="1"
        />
      </svg>
      <div className="date-fields">
        <label htmlFor={`${id}-start`}>
          Start
          <input
            id={`${id}-start`}
            type="date"
            value={start}
            min={dates[0]}
            max={end}
            onInput={(e) => onChange({ trainStart: e.currentTarget.value })}
            onChange={(e) => onChange({ trainStart: e.target.value })}
          />
        </label>
        <label htmlFor={`${id}-end`}>
          End
          <input
            id={`${id}-end`}
            type="date"
            value={end}
            min={start}
            max={dates.at(-1)}
            onInput={(e) => onChange({ trainEnd: e.currentTarget.value })}
            onChange={(e) => onChange({ trainEnd: e.target.value })}
          />
        </label>
      </div>
      <label className="range-label">
        Move start date
        <input
          aria-label="Training start position"
          type="range"
          min="0"
          max={max}
          value={a}
          onChange={(e) =>
            onChange({ trainStart: dates[Math.min(Number(e.target.value), b)] })
          }
        />
      </label>
      <label className="range-label">
        Move end date
        <input
          aria-label="Training end position"
          type="range"
          min="0"
          max={max}
          value={b}
          onChange={(e) =>
            onChange({ trainEnd: dates[Math.max(Number(e.target.value), a)] })
          }
        />
      </label>
      <div className="window-count">
        <span className={count < 30 ? "warning-text" : ""}>
          {count} usable numbers{count < 30 ? " · at least 30 needed" : ""}
        </span>
        <button
          type="button"
          className="tertiary"
          onClick={() => onChange({ trainStart: "", trainEnd: "" })}
        >
          Use all dates
        </button>
      </div>
      <p className="field-help">
        The prediction starts after your end date. Blank numbers are not
        counted.
      </p>
    </fieldset>
  );
}
