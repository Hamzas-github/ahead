import { useEffect, useId, useMemo, useRef, useState } from "react";
import { RotateCcw } from "lucide-react";
import { number, type Result } from "../api";
import {
  geometry,
  points,
  nearest,
  tickDate,
  fullDate,
} from "../chart/geometry";
import { usePathMorph } from "../chart/usePathMorph";

type Props = {
  history: Result["history"];
  forecast?: Result["forecast"];
  onReady?: () => void;
  loading?: boolean;
  generation?: number;
  valueLabel?: string;
  stale?: boolean;
};
export default function PredictionChart({
  history,
  forecast,
  onReady,
  loading = false,
  generation = 0,
  valueLabel = "Value",
  stale = false,
}: Props) {
  const host = useRef<HTMLDivElement>(null);
  const motion = useRef<SVGAnimateMotionElement>(null);
  const [size, setSize] = useState({ width: 800, height: 400 });
  const [active, setActive] = useState<number | null>(null);
  const [cursorY, setCursorY] = useState(64);
  const [replay, setReplay] = useState(0);
  const replayGeneration = useRef(0);
  const [skip, setSkip] = useState(false);
  const [revealing, setRevealing] = useState(false);
  const clipId = useId().replace(/:/g, "");
  const data = useMemo(() => points(history, forecast), [history, forecast]);
  const g = useMemo(
    () => geometry(data, size.width, size.height),
    [data, size],
  );
  const isReplay = replay > 0 && replayGeneration.current === generation;
  const isReveal = !!forecast && (generation === 1 || isReplay) && !skip;
  const historyRef = usePathMorph(g.historyPath, generation > 1 && !isReveal);
  const forecastRef = usePathMorph(g.forecastPath, generation > 1 && !isReveal);
  const bandRef = usePathMorph(g.bandPath, generation > 1 && !isReveal);
  useEffect(() => {
    if (!host.current) return;
    const observer = new ResizeObserver(([entry]) =>
      setSize({
        width: Math.max(200, entry.contentRect.width),
        height: Math.max(240, entry.contentRect.height),
      }),
    );
    observer.observe(host.current);
    return () => observer.disconnect();
  }, []);
  useEffect(() => {
    setActive(null);
    setSkip(false);
    if (!forecast) return;
    const reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;
    setRevealing(generation === 1 && !reduced);
    if (generation === 1 && !reduced) motion.current?.beginElementAt(0.6);
    const timer = setTimeout(
      () => {
        setRevealing(false);
        onReady?.();
      },
      generation === 1 && !reduced ? 2200 : 500,
    );
    return () => clearTimeout(timer);
  }, [forecast, generation, onReady]);
  useEffect(() => {
    if (!replay) return;
    setRevealing(true);
    motion.current?.beginElementAt(0.6);
    const timer = setTimeout(() => {
      setRevealing(false);
      onReady?.();
    }, 2200);
    return () => clearTimeout(timer);
  }, [replay, onReady]);
  const focus =
    active === null ? null : data[Math.min(active, data.length - 1)];
  const boundaryX = g.boundary ? g.x(g.boundary.time) : g.right;
  const tooltipWidth = Math.min(248, size.width - 16);
  const tooltipX = focus
    ? Math.max(8, Math.min(size.width - tooltipWidth - 8, g.x(focus.time) + 16))
    : 0;
  const tooltipY = Math.max(8, Math.min(size.height - 108, cursorY - 92));
  const announcement = focus
    ? `${fullDate(focus.date)}. ${focus.future ? "Expected" : "Actual"} ${number(focus.value)}${focus.future ? `. Likely between ${number(focus.lower!)} and ${number(focus.upper!)}.` : "."}`
    : "";
  return (
    <section className="chart-panel" aria-label="Your prediction">
      <div className="chart-toolbar">
        <span>
          {valueLabel}
          <span className="toolbar-divider">/</span>
          <span className="muted">
            {history.values.length.toLocaleString()} past numbers
          </span>
        </span>
        <div>
          {stale && (
            <span className="stale-badge">
              <i />
              Needs updating
            </span>
          )}
          {forecast && (
            <button
              className="tertiary replay"
              disabled={loading}
              onClick={() => {
                replayGeneration.current = generation;
                setSkip(false);
                setReplay((n) => n + 1);
              }}
            >
              <RotateCcw />
              Replay
            </button>
          )}
          {revealing && (
            <button
              className="tertiary"
              onClick={() => {
                setSkip(true);
                setRevealing(false);
                onReady?.();
              }}
            >
              Skip animation
            </button>
          )}
        </div>
      </div>
      <div
        ref={host}
        className={`chart-stage ${isReveal ? "initial-reveal" : ""} ${skip ? "skip-animation" : ""}`}
        tabIndex={data.length ? 0 : -1}
        role="region"
        aria-label="Interactive time series chart"
        aria-describedby={`${clipId}-help`}
        aria-keyshortcuts="ArrowLeft ArrowRight Home End Escape"
        onKeyDown={(event) => {
          if (!data.length) return;
          let next = active ?? history.values.length - 1;
          if (event.key === "ArrowLeft") next = Math.max(0, next - 1);
          else if (event.key === "ArrowRight")
            next = Math.min(data.length - 1, next + 1);
          else if (event.key === "Home") next = 0;
          else if (event.key === "End") next = data.length - 1;
          else if (event.key === "Escape") {
            setActive(null);
            return;
          } else return;
          event.preventDefault();
          setCursorY(g.y(data[next].value));
          setActive(next);
        }}
        onPointerMove={(event) => {
          if (!data.length) return;
          const box = event.currentTarget.getBoundingClientRect();
          const x = event.clientX - box.left;
          const y = event.clientY - box.top;
          if (
            x < g.margin.left ||
            x > g.right ||
            y < g.margin.top ||
            y > g.bottom
          ) {
            setActive(null);
            return;
          }
          setActive(nearest(data, Number(g.x.invert(x))));
          setCursorY(y);
        }}
        onPointerLeave={() => setActive(null)}
        onBlur={() => setActive(null)}
      >
        <svg
          width="100%"
          height="100%"
          viewBox={`0 0 ${size.width} ${size.height}`}
          aria-hidden="true"
        >
          <defs>
            <clipPath id={`${clipId}-plot`}>
              <rect
                x={g.margin.left}
                y={g.margin.top - 16}
                width={g.right - g.margin.left}
                height={g.bottom - g.margin.top + 20}
              />
            </clipPath>
            <clipPath id={`${clipId}-band`}>
              <rect
                key={`clip-${generation}-${replay}`}
                className="band-clip"
                x={boundaryX}
                y={0}
                width={Math.max(0, g.right - boundaryX)}
                height={size.height}
              />
            </clipPath>
          </defs>
          {g.yTicks.map((t) => (
            <g key={t}>
              <line
                className="gridline"
                x1={g.margin.left}
                x2={g.right}
                y1={g.y(t)}
                y2={g.y(t)}
              />
              <text
                className="axis-label"
                x={g.margin.left - 12}
                y={g.y(t) + 4}
                textAnchor="end"
              >
                {new Intl.NumberFormat("en", {
                  notation: "compact",
                  maximumFractionDigits: 1,
                }).format(t)}
              </text>
            </g>
          ))}
          {g.ticks.map((t) => (
            <text
              className="axis-label"
              key={+t}
              x={g.x(t)}
              y={size.height - 12}
              textAnchor="middle"
            >
              {tickDate(t, (data.at(-1)?.time ?? 0) - (data[0]?.time ?? 0))}
            </text>
          ))}
          <g clipPath={`url(#${clipId}-plot)`}>
            {forecast && (
              <rect
                className="future-tint reveal-detail"
                x={boundaryX}
                y={g.margin.top}
                width={Math.max(0, g.right - boundaryX)}
                height={g.bottom - g.margin.top}
              />
            )}
            <g clipPath={`url(#${clipId}-band)`}>
              <path
                ref={bandRef}
                d={g.bandPath}
                className="range-band"
                key={`band-${replay}`}
              />
            </g>
            <path
              ref={historyRef}
              d={g.historyPath}
              className={`history-line ${generation <= 1 || isReplay ? "history-draw" : ""}`}
              pathLength={1}
              key={`history-${replay}`}
            />
            <path
              ref={forecastRef}
              d={g.forecastPath}
              className="forecast-line"
              pathLength={1}
              key={`line-${replay}`}
            />
            {isReveal && (
              <circle
                key={`dot-${generation}-${replay}`}
                r={3}
                className="leading-dot"
              >
                <animateMotion
                  ref={motion}
                  dur="0.9s"
                  begin="indefinite"
                  path={g.forecastPath}
                  fill="freeze"
                  calcMode="spline"
                  keyTimes="0;1"
                  keySplines="0.22 1 0.36 1"
                />
              </circle>
            )}
          </g>
          {forecast && (
            <g className="reveal-detail" key={`detail-${generation}-${replay}`}>
              <line
                className="boundary-line"
                x1={boundaryX}
                x2={boundaryX}
                y1={g.margin.top}
                y2={g.bottom}
              />
              <text
                className="boundary-label"
                x={boundaryX - 8}
                y={g.margin.top - 12}
                textAnchor="end"
              >
                LAST KNOWN DATE
              </text>
              {!g.mobile && (
                <>
                  <text
                    className="direct-label forecast-label"
                    x={g.right + 12}
                    y={g.y(data.at(-1)!.value) + 4}
                  >
                    Prediction
                  </text>
                  <text
                    className="direct-label history-label"
                    x={boundaryX - 8}
                    y={g.y(g.boundary!.value) + 20}
                    textAnchor="end"
                  >
                    Your data
                  </text>
                </>
              )}
            </g>
          )}
          {focus && (
            <g>
              <line
                className="crosshair"
                x1={g.x(focus.time)}
                x2={g.x(focus.time)}
                y1={g.margin.top}
                y2={g.bottom}
              />
              <circle
                className={focus.future ? "focus-dot future" : "focus-dot"}
                cx={g.x(focus.time)}
                cy={g.y(focus.value)}
                r={4}
              />
            </g>
          )}
        </svg>
        {loading && (
          <div
            className="scan-region"
            aria-hidden="true"
            style={{
              left: g.margin.left,
              right: size.width - g.right,
              top: g.margin.top,
              bottom: size.height - g.bottom,
            }}
          >
            <div className="scanline" />
          </div>
        )}
        {!data.length && (
          <p className="no-history">
            Choose date and value columns to see your history.
          </p>
        )}
        {focus && (
          <div
            className="chart-tooltip"
            style={{
              width: tooltipWidth,
              transform: `translate(${tooltipX}px,${tooltipY}px)`,
            }}
          >
            <span>{fullDate(focus.date)}</span>
            <strong className={focus.future ? "prediction" : ""}>
              {focus.future ? "Expected" : "Actual"} {number(focus.value)}
            </strong>
            {focus.future && (
              <span>
                likely {number(focus.lower!)}–{number(focus.upper!)}
              </span>
            )}
          </div>
        )}
      </div>
      <div className="chart-under">
        <span id={`${clipId}-help`}>
          Hover to inspect
          <span className="desktop-hint"> · ← → keys to move</span>
        </span>
        <div className="mobile-legend">
          <span>Your data</span>
          <span>Prediction</span>
          <span>Possible range</span>
        </div>
        <span>UTC</span>
      </div>
      <span className="sr-only" aria-live="polite" aria-atomic="true">
        {announcement}
      </span>
      <div className="sr-only">
        <table>
          <caption>Time series data and forecast. {valueLabel}.</caption>
          <thead>
            <tr>
              <th>Date</th>
              <th>Series</th>
              <th>Value</th>
              <th>Lower estimate</th>
              <th>Upper estimate</th>
            </tr>
          </thead>
          <tbody>
            {data.map((p, i) => (
              <tr key={i}>
                <td>{p.date}</td>
                <td>{p.future ? "Prediction" : "Your data"}</td>
                <td>{p.value}</td>
                <td>{p.lower ?? ""}</td>
                <td>{p.upper ?? ""}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
