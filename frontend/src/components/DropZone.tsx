import { useState } from "react";
import { ArrowUpFromLine } from "lucide-react";
export default function DropZone({
  busy,
  onBrowse,
  onFile,
  onSample,
}: {
  busy: boolean;
  onBrowse: () => void;
  onFile: (file: File) => void;
  onSample: () => void;
}) {
  const [drag, setDrag] = useState(false);
  return (
    <div
      className={`dropzone ${drag ? "dragging" : ""}`}
      onDragOver={(e) => {
        e.preventDefault();
        if (!busy) setDrag(true);
      }}
      onDragLeave={() => setDrag(false)}
      onDrop={(e) => {
        e.preventDefault();
        setDrag(false);
        if (!busy && e.dataTransfer.files[0]) onFile(e.dataTransfer.files[0]);
      }}
      aria-busy={busy}
    >
      {busy && (
        <div
          className="upload-progress"
          role="progressbar"
          aria-label="Reading CSV"
        />
      )}
      <svg
        className="ghost-chart"
        viewBox="0 0 800 280"
        preserveAspectRatio="none"
        aria-hidden="true"
      >
        <path d="M0 238L36 236L60 246L88 215L112 223L145 198L170 211L193 180L215 194L245 166L270 185L298 147L322 154L350 108L378 134L400 112L427 145L453 90L478 113L505 64L532 87L550 48L578 72L600 42L625 68L650 40L678 57L706 23L730 39L760 10L800 28" />
      </svg>
      <div className="drop-content">
        <ArrowUpFromLine aria-hidden="true" />
        <h1>
          {busy ? "Reading your data…" : "Drop your file here or"}{" "}
          {!busy && (
            <button className="browse-text" disabled={busy} onClick={onBrowse}>
              browse
            </button>
          )}
        </h1>
        <p>A spreadsheet saved as CSV · up to 10 MB · 30 numbers or more</p>
        <button
          className="secondary sample-button"
          disabled={busy}
          onClick={onSample}
        >
          Try an example<span aria-hidden="true">→</span>
        </button>
        <span className="sample-caption">
          Example: made-up weekly orders for a shop
        </span>
      </div>
      <div className="drop-footer">
        <span>One column for dates. One for numbers.</span>
        <span>
          <a href="/guides/prepare-your-csv">Help with your file</a> · No
          account required
        </span>
      </div>
    </div>
  );
}
