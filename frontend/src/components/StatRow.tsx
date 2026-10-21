import { useEffect, useState } from "react";
import { number } from "../api";
const statNumber = (value: number) =>
  Math.abs(value) >= 1_000_000
    ? new Intl.NumberFormat("en", {
        notation: "compact",
        maximumFractionDigits: 1,
      }).format(value)
    : number(value);
function Count({
  value,
  animate,
  percent = false,
}: {
  value: number | null;
  animate: boolean;
  percent?: boolean;
}) {
  const [shown, setShown] = useState(value ?? 0);
  useEffect(() => {
    if (value === null) return;
    if (!animate || matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setShown(value);
      return;
    }
    let frame = 0;
    let start = 0;
    const tick = (now: number) => {
      if (!start) start = now;
      const t = Math.min(1, (now - start) / 650);
      setShown(value * (1 - Math.pow(1 - t, 3)));
      if (t < 1) frame = requestAnimationFrame(tick);
    };
    const timer = setTimeout(() => {
      frame = requestAnimationFrame(tick);
    }, 1500);
    return () => {
      clearTimeout(timer);
      cancelAnimationFrame(frame);
    };
  }, [value, animate]);
  return (
    <>
      {value === null
        ? "—"
        : `${statNumber(animate ? shown : value)}${percent ? "%" : ""}`}
    </>
  );
}
export default function StatRow({
  last,
  end,
  firstReveal,
}: {
  last: number | null;
  end: number | null;
  firstReveal: boolean;
}) {
  const change =
    last !== null && end !== null && last !== 0
      ? (100 * (end - last)) / Math.abs(last)
      : null;
  return (
    <div className={`stat-row ${firstReveal ? "reveal-stats" : ""}`}>
      <div className="stat">
        <span>Last known number</span>
        <strong>
          <Count value={last} animate={false} />
        </strong>
      </div>
      <div className={`stat ${end !== null ? "forecast-stat" : ""}`}>
        <span>Last predicted number</span>
        <strong>
          <Count value={end} animate={firstReveal} />
        </strong>
      </div>
      <div className={`stat ${change !== null && change > 0 ? "up" : ""}`}>
        <span>Difference</span>
        <strong>
          {change !== null && (
            <span
              className="change-arrow"
              aria-label={
                change > 0 ? "Increase" : change < 0 ? "Decrease" : "Unchanged"
              }
            >
              {change > 0 ? "↗" : change < 0 ? "↘" : "→"}
            </span>
          )}
          <Count
            value={change === null ? null : Math.abs(change)}
            animate={firstReveal}
            percent
          />
        </strong>
      </div>
    </div>
  );
}
