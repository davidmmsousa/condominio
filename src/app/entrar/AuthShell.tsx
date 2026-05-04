import type { ReactNode } from "react";

export function AuthShell({
  eyebrow,
  title,
  lead,
  children,
}: {
  eyebrow?: string;
  title: string;
  lead?: string | ReactNode;
  children: ReactNode;
}) {
  return (
    <div className="auth-shell">
      <div className="auth-shell__card">
        <div style={{ textAlign: "left" }}>
          {eyebrow ? <div className="auth-shell__brand">{eyebrow}</div> : null}
          <h1 className="auth-shell__title">{title}</h1>
          {lead ? <p className="auth-shell__lead">{lead}</p> : null}
        </div>
        {children}
      </div>
    </div>
  );
}
