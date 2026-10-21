import { number, type Result, type Backtest } from "./api";

export function downloadBrief(
  result: Result,
  filename: string,
  value: string,
  backtest: Backtest | null,
) {
  const f = result.forecast;
  const end = f.point.length - 1;
  const text = [
    "# Ahead — planning brief",
    "",
    `Prepared: ${new Date().toISOString()}`,
    `Dataset: ${filename}`,
    `Measure: ${value}`,
    `Method: ${result.metadata.engine?.name ?? result.metadata.model_version}`,
    `Training data: ${result.history.dates[0]} to ${result.history.dates.at(-1)}`,
    `Forecast: ${f.dates[0]} to ${f.dates[end]}`,
    "",
    "## Forecast",
    `Last observation: ${number(result.history.values.at(-1)!)}`,
    `Expected end value: ${number(f.point[end])}`,
    `End range: ${number(f.lower[end])}–${number(f.upper[end])}`,
    `Missing points filled: ${result.metadata.n_filled_points}`,
    "",
    "## Past-data check",
    backtest
      ? `${backtest.badge.label}: ${backtest.badge.reason}\nMAE: ${backtest.metrics.mae}; sMAPE: ${backtest.metrics.smape ?? "undefined"}%; MASE: ${backtest.metrics.mase ?? "undefined"}; coverage: ${number(backtest.metrics.coverage * 100)}%.\n${backtest.folds.length} test window(s), ${backtest.metadata.horizon} held-out points each.`
      : "Not checked for these settings. Validate before acting.",
    "",
    "## Before you act",
    "Review upcoming promotions, supply constraints and changes that the history cannot show. The range is an estimate, not a guarantee. A forecast is not an automatic order recommendation.",
    "",
    ...result.metadata.warnings.map((w) => `Data note: ${w}`),
  ].join("\n");
  const url = URL.createObjectURL(
    new Blob([text], { type: "text/markdown;charset=utf-8" }),
  );
  const a = document.createElement("a");
  a.href = url;
  a.download = "ahead-planning-brief.md";
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
