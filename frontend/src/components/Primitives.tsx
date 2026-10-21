import type { ReactNode } from "react";
import { AlertCircle, ChevronDown, Info } from "lucide-react";

export function Help({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) {
  return (
    <details className="help-tip">
      <summary aria-label={`About ${title}`} title={`About ${title}`}>
        <Info aria-hidden="true" />
      </summary>
      <p>{children}</p>
    </details>
  );
}

export function ControlGroup({
  title,
  tag,
  children,
  disabled = false,
  help,
}: {
  title: string;
  tag?: string;
  children?: ReactNode;
  disabled?: boolean;
  help?: string;
}) {
  return (
    <section
      className={`control-group ${disabled ? "reserved" : ""}`}
      aria-disabled={disabled || undefined}
    >
      <div className="group-heading">
        <h2>{title}</h2>
        {help && <Help title={title}>{help}</Help>}
        {tag && <span className="tag">{tag}</span>}
      </div>
      {children}
    </section>
  );
}
export function Field({
  label,
  tag,
  children,
  help,
}: {
  label: string;
  tag?: string;
  children: ReactNode;
  help?: string;
}) {
  return (
    <div className="field-container">
      <label className="field">
        <span className="field-label">
          {label}
          {tag && <span className="auto-tag">{tag}</span>}
        </span>
        {children}
      </label>
      {help && <Help title={label}>{help}</Help>}
    </div>
  );
}
export function Select({
  children,
  ...props
}: React.SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <span className="select-wrap">
      <select {...props}>{children}</select>
      <ChevronDown aria-hidden="true" />
    </span>
  );
}
export function InlineMessage({
  children,
  warning = false,
}: {
  children: ReactNode;
  warning?: boolean;
}) {
  return (
    <div
      className={`inline-message ${warning ? "warning" : "error"}`}
      role={warning ? "status" : "alert"}
    >
      <AlertCircle aria-hidden="true" />
      <span>{children}</span>
    </div>
  );
}
