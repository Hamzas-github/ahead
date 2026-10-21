export interface Preview {
  schema_version: 1;
  columns: string[];
  detected_date_column: string | null;
  detected_numeric_columns: string[];
  rows: Record<string, string | number | null>[];
  row_count: number;
  detected_frequency: string | null;
  warnings: string[];
}
export interface Result {
  schema_version: 1;
  history: { dates: string[]; values: number[] };
  forecast: {
    dates: string[];
    point: number[];
    lower: number[];
    upper: number[];
  };
  metadata: {
    frequency: string;
    n_history_points: number;
    n_filled_points: number;
    model_version: string;
    runtime_ms: number;
    warnings: string[];
    engine?: Engine;
    train_start?: string;
    train_end?: string;
  };
}
export interface Engine {
  id: string;
  name: string;
  commercial_use: boolean;
  interval_label: string;
}
export interface Metrics {
  mae: number;
  smape: number | null;
  mase: number | null;
  coverage: number;
}
export interface Backtest {
  schema_version: 1;
  metrics: Metrics;
  badge: { label: string; tone: string; reason: string };
  folds: {
    train_start: string;
    train_end: string;
    dates: string[];
    actual: number[];
    point: number[];
    lower: number[];
    upper: number[];
    metrics: Metrics;
  }[];
  metadata: {
    engine: Engine;
    frequency: string;
    horizon: number;
    folds: number;
    warnings: string[];
  };
}
export async function post<T>(path: string, body: FormData): Promise<T> {
  let response: Response;
  try {
    response = await fetch(`/api/${path}`, {
      method: "POST",
      body,
      signal: AbortSignal.timeout(180000),
    });
  } catch {
    throw new Error(
      "We couldn’t reach the forecast server. Check that the backend is running and try again.",
    );
  }
  const json = await response
    .json()
    .catch(() => ({
      detail:
        "The server returned an unreadable response. Retry, or check the server connection.",
    }));
  if (!response.ok)
    throw new Error(
      typeof json.detail === "string"
        ? json.detail
        : "Something went wrong. Please check your file and try again.",
    );
  return json as T;
}
export const number = (n: number) =>
  new Intl.NumberFormat("en", { maximumFractionDigits: 1 }).format(n);
export function unit(freq: string) {
  const f = freq.toUpperCase();
  if (/^\d/.test(f)) return `steps (${freq} each)`;
  return f.includes("MIN")
    ? "minutes"
    : f.startsWith("M")
      ? "months"
      : f.startsWith("Q")
        ? "quarters"
        : f.startsWith("Y")
          ? "years"
          : f.includes("W")
            ? "weeks"
            : f === "H"
              ? "hours"
              : f === "D"
                ? "days"
                : "periods";
}
export function download(result: Result) {
  const f = result.forecast;
  const csv = [
    "date,point,lower_10th,upper_90th",
    ...f.dates.map((d, i) => `${d},${f.point[i]},${f.lower[i]},${f.upper[i]}`),
  ].join("\r\n");
  const url = URL.createObjectURL(
    new Blob([csv], { type: "text/csv;charset=utf-8;" }),
  );
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = "forecast.csv";
  anchor.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
