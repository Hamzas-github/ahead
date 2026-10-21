import { useEffect, useMemo, useState } from "react";
import Papa from "papaparse";
import {
  post,
  type Preview,
  type Result,
  type Backtest,
  type Engine,
} from "../api";

export type History = Result["history"];
export type Controls = {
  date: string;
  value: string;
  horizon: number;
  frequency: string;
  trainStart: string;
  trainEnd: string;
};
const key = (c: Controls) => JSON.stringify(c);

// Local parsing only supplies the pre-inference drawing. The unchanged server
// remains authoritative for cleaning, frequency validation and forecast history.
function parseLocal(file: File): Promise<Record<string, string>[]> {
  return new Promise((resolve, reject) =>
    Papa.parse<Record<string, string>>(file, {
      header: true,
      skipEmptyLines: true,
      complete: (r) => resolve(r.data),
      error: reject,
    }),
  );
}

export function useWorkspace() {
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<Preview | null>(null);
  const [rows, setRows] = useState<Record<string, string>[]>([]);
  const [controls, setControls] = useState<Controls>({
    date: "",
    value: "",
    horizon: 12,
    frequency: "",
    trainStart: "",
    trainEnd: "",
  });
  const [result, setResult] = useState<Result | null>(null);
  const [resultKey, setResultKey] = useState("");
  const [resultValue, setResultValue] = useState("");
  const [busy, setBusy] = useState<"upload" | "forecast" | "backtest" | null>(
    null,
  );
  const [error, setError] = useState("");
  const [datasetId, setDatasetId] = useState(0);
  const [revision, setRevision] = useState(0);
  const [backtest, setBacktest] = useState<Backtest | null>(null);
  const [backtestKey, setBacktestKey] = useState("");
  const [engine, setEngine] = useState<Engine | null>(null);
  useEffect(() => {
    fetch("/api/health")
      .then((r) => (r.ok ? r.json() : null))
      .then((r) => setEngine(r?.engine ?? null))
      .catch(() => {});
  }, []);

  async function upload(next: File) {
    if (busy) return;
    setError("");
    if (next.size > 10 * 1024 * 1024) {
      setError("This file is over 10 MB. Choose a smaller CSV.");
      return;
    }
    setBusy("upload");
    try {
      const body = new FormData();
      body.append("file", next);
      const [p, parsed] = await Promise.all([
        post<Preview>("preview", body),
        parseLocal(next),
      ]);
      setFile(next);
      setPreview(p);
      setRows(parsed);
      setResult(null);
      setResultKey("");
      setDatasetId((id) => id + 1);
      setRevision(0);
      setBacktest(null);
      setControls({
        date: p.detected_date_column ?? p.columns[0],
        value: p.detected_numeric_columns[0] ?? p.columns[1] ?? "",
        horizon: Math.min(
          p.detected_frequency?.startsWith("W") ? 12 : 30,
          Math.max(1, Math.round(p.row_count * 0.2)),
        ),
        frequency: "",
        trainStart: "",
        trainEnd: "",
      });
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(null);
    }
  }

  async function sample() {
    if (busy) return;
    setError("");
    try {
      const response = await fetch("/samples/store-demand.csv");
      if (!response.ok)
        throw new Error(
          "Sample data could not be loaded. Try uploading a CSV.",
        );
      await upload(
        new File([await response.blob()], "store-demand.csv", {
          type: "text/csv",
        }),
      );
    } catch (e) {
      setError((e as Error).message);
    }
  }

  async function run() {
    if (!file || busy) return;
    setBusy("forecast");
    setError("");
    try {
      // Existing endpoint, field names and optional frequency are unchanged.
      const body = new FormData();
      body.append("file", file);
      body.append("date_column", controls.date);
      body.append("value_column", controls.value);
      body.append("horizon", String(controls.horizon));
      if (controls.frequency) body.append("frequency", controls.frequency);
      if (controls.trainStart) body.append("train_start", controls.trainStart);
      if (controls.trainEnd) body.append("train_end", controls.trainEnd);
      const next = await post<Result>("forecast", body);
      setResult(next);
      setResultKey(key(controls));
      setResultValue(controls.value);
      setRevision((n) => n + 1);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(null);
    }
  }

  async function check(holdout: number, folds: number) {
    if (!file || busy) return;
    setBusy("backtest");
    setError("");
    try {
      const body = new FormData();
      body.append("file", file);
      body.append("date_column", controls.date);
      body.append("value_column", controls.value);
      body.append("horizon", String(holdout));
      body.append("folds", String(folds));
      if (controls.frequency) body.append("frequency", controls.frequency);
      if (controls.trainStart) body.append("train_start", controls.trainStart);
      if (controls.trainEnd) body.append("train_end", controls.trainEnd);
      const next = await post<Backtest>("backtest", body);
      setBacktest(next);
      setBacktestKey(key(controls));
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(null);
    }
  }

  const rawHistory = useMemo<History>(() => {
    const map = new Map<number, number>();
    for (const row of rows) {
      const dateString = row[controls.date]?.trim();
      const valueString = row[controls.value]?.trim();
      if (!dateString || !valueString || /^\d+(\.\d+)?$/.test(dateString))
        continue;
      const date = Date.parse(dateString);
      const value = Number(valueString);
      if (Number.isFinite(date) && Number.isFinite(value)) map.set(date, value);
    }
    const sorted = [...map].sort((a, b) => a[0] - b[0]);
    return {
      dates: sorted.map(([date]) => new Date(date).toISOString()),
      values: sorted.map(([, value]) => value),
    };
  }, [rows, controls.date, controls.value]);
  const stale = !!result && resultKey !== key(controls);
  const update = (patch: Partial<Controls>) => {
    setControls((c) => ({ ...c, ...patch }));
    setError("");
  };
  // Keep the previous result and its matching history visible until Update.
  const selectedHistory = useMemo(() => {
    const indices = rawHistory.dates
      .map((d, i) => ({ d, i }))
      .filter(
        ({ d }) =>
          (!controls.trainStart || d.slice(0, 10) >= controls.trainStart) &&
          (!controls.trainEnd || d.slice(0, 10) <= controls.trainEnd),
      );
    return {
      dates: indices.map(({ d }) => d),
      values: indices.map(({ i }) => rawHistory.values[i]),
    };
  }, [rawHistory, controls.trainStart, controls.trainEnd]);
  const history = result?.history ?? selectedHistory;
  return {
    file,
    preview,
    controls,
    result,
    busy,
    error,
    datasetId,
    revision,
    stale,
    history,
    rawHistory,
    selectedHistory,
    engine,
    backtest,
    backtestStale: !!backtest && backtestKey !== key(controls),
    check,
    resultValue,
    update,
    upload,
    sample,
    run,
  };
}
