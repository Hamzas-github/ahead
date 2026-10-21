import { scaleLinear, scaleUtc } from "d3-scale";
import { line, area } from "d3-shape";
import type { Result } from "../api";
export type ChartPoint = {
  date: string;
  time: number;
  value: number;
  lower?: number;
  upper?: number;
  future: boolean;
};
export function points(
  history: Result["history"],
  forecast?: Result["forecast"],
): ChartPoint[] {
  return [
    ...history.dates.map((date, i) => ({
      date,
      time: Date.parse(date),
      value: history.values[i],
      future: false,
    })),
    ...(forecast?.dates.map((date, i) => ({
      date,
      time: Date.parse(date),
      value: forecast.point[i],
      lower: forecast.lower[i],
      upper: forecast.upper[i],
      future: true,
    })) ?? []),
  ];
}
// Preserve extrema when dense histories exceed the number of screen pixels.
function reduce(data: ChartPoint[], limit: number): ChartPoint[] {
  if (data.length <= limit) return data;
  const output: ChartPoint[] = [data[0]];
  const stride = Math.ceil(data.length / (limit / 2));
  for (let start = 1; start < data.length - 1; start += stride) {
    const bucket = data.slice(start, Math.min(start + stride, data.length - 1));
    let min = bucket[0],
      max = bucket[0];
    for (const p of bucket) {
      if (p.value < min.value) min = p;
      if (p.value > max.value) max = p;
    }
    output.push(...(min.time < max.time ? [min, max] : [max, min]));
  }
  output.push(data[data.length - 1]);
  return output;
}
export function geometry(data: ChartPoint[], width: number, height: number) {
  const mobile = width < 600;
  const margin = {
    left: mobile ? 44 : 64,
    right: mobile ? 16 : 112,
    top: 40,
    bottom: 40,
  };
  const right = Math.max(margin.left + 1, width - margin.right),
    bottom = Math.max(80, height - margin.bottom);
  const first = data[0]?.time ?? 0,
    last = data.at(-1)?.time ?? 1;
  const x = scaleUtc()
    .domain([
      new Date(first),
      new Date(last === first ? first + 86400000 : last),
    ])
    .range([margin.left, right]);
  let min = Infinity,
    max = -Infinity;
  for (const p of data) {
    min = Math.min(min, p.value, p.lower ?? p.value);
    max = Math.max(max, p.value, p.upper ?? p.value);
  }
  if (!Number.isFinite(min)) {
    min = 0;
    max = 1;
  }
  const pad = (max - min || Math.abs(max) || 1) * 0.12;
  const y = scaleLinear()
    .domain([min - pad, max + pad])
    .nice(5)
    .range([bottom, margin.top]);
  const historical = data.filter((d) => !d.future),
    future = data.filter((d) => d.future);
  const boundary = historical.at(-1);
  const predicted = boundary ? [boundary, ...future] : future;
  const path = line<ChartPoint>()
    .x((p) => x(p.time))
    .y((p) => y(p.value));
  const band = area<ChartPoint>()
    .x((p) => x(p.time))
    .y0((p) => y(p.lower ?? p.value))
    .y1((p) => y(p.upper ?? p.value));
  return {
    x,
    y,
    margin,
    right,
    bottom,
    mobile,
    boundary,
    historical,
    future,
    historyPath: path(reduce(historical, Math.max(200, width * 2))) ?? "",
    forecastPath: future.length ? (path(predicted) ?? "") : "",
    bandPath: future.length ? (band(predicted) ?? "") : "",
    ticks: x.ticks(Math.max(2, Math.floor((right - margin.left) / 112))),
    yTicks: y.ticks(5),
  };
}
export function nearest(data: ChartPoint[], time: number): number {
  let lo = 0,
    hi = data.length - 1;
  while (lo < hi) {
    const mid = Math.floor((lo + hi) / 2);
    if (data[mid].time < time) lo = mid + 1;
    else hi = mid;
  }
  return lo > 0 &&
    Math.abs(data[lo - 1].time - time) < Math.abs(data[lo].time - time)
    ? lo - 1
    : lo;
}
export function tickDate(date: Date, span: number) {
  return new Intl.DateTimeFormat(
    "en-GB",
    span < 86400000 * 3
      ? { hour: "2-digit", minute: "2-digit", timeZone: "UTC" }
      : span < 86400000 * 180
        ? { day: "numeric", month: "short", timeZone: "UTC" }
        : { month: "short", year: "2-digit", timeZone: "UTC" },
  ).format(date);
}
export const fullDate = (date: string) =>
  new Date(date).toLocaleString("en-GB", {
    dateStyle: "medium",
    timeZone: "UTC",
    ...(date.includes("T00:00:00") ? {} : { timeStyle: "short" as const }),
  });
