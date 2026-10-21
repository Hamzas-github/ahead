import type { ReactNode } from "react";
import { Download, Replace } from "lucide-react";
export default function AppShell({
  filename,
  rows,
  busy,
  canDownload,
  onDownload,
  onReplace,
  sidebar,
  children,
}: {
  filename?: string;
  rows?: number;
  busy: boolean;
  canDownload: boolean;
  onDownload: () => void;
  onReplace: () => void;
  sidebar: ReactNode;
  children: ReactNode;
}) {
  return (
    <div className="app-shell">
      <header className="topbar">
        <a className="wordmark" href="/" aria-label="Ahead home">
          <i aria-hidden="true" />
          Ahead<span>Workspace</span>
          <small>BETA</small>
        </a>
        <div className="dataset-title" title={filename}>
          {filename ? (
            <>
              <span>{filename}</span>
              <span className="mono">{rows?.toLocaleString()} rows</span>
            </>
          ) : (
            <span>No dataset loaded</span>
          )}
        </div>
        <div className="top-actions">
          <button
            className="secondary"
            disabled={!canDownload || busy}
            onClick={onDownload}
            title="Save the predicted numbers in a CSV file that opens in Excel or Google Sheets."
          >
            <Download aria-hidden="true" />
            <span>Download CSV</span>
          </button>
          <button
            className="tertiary"
            aria-label={filename ? "Replace data" : "Browse CSV"}
            disabled={busy}
            onClick={onReplace}
          >
            <Replace aria-hidden="true" />
            <span>{filename ? "Replace data" : "Browse CSV"}</span>
          </button>
        </div>
      </header>
      <div className="workspace">
        {sidebar}
        <main id="main" className="canvas" tabIndex={-1}>
          {children}
        </main>
      </div>
    </div>
  );
}
