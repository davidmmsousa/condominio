import type { ReactNode } from "react";

const shell: React.CSSProperties = {
  minHeight: "100vh",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  padding: "32px 20px",
  background: "linear-gradient(155deg, #f0f4ff 0%, #f8fafc 42%, #eef2ff 100%)",
  boxSizing: "border-box",
};

const card: React.CSSProperties = {
  width: "100%",
  maxWidth: 420,
  padding: "32px 28px",
  borderRadius: 14,
  background: "#ffffff",
  boxShadow: "0 22px 70px rgba(15,23,42,0.1), 0 0 0 1px rgba(15,23,42,0.04)",
};

const brand: React.CSSProperties = {
  fontSize: 11,
  letterSpacing: "0.12em",
  textTransform: "uppercase",
  fontWeight: 600,
  color: "#4338ca",
  marginBottom: 6,
};

const titleStyle: React.CSSProperties = {
  fontSize: 26,
  fontWeight: 700,
  margin: "0 0 10px",
  color: "#0f172a",
  letterSpacing: "-0.02em",
};

const subtitle: React.CSSProperties = {
  margin: "0 0 24px",
  color: "#475569",
  fontSize: 14,
  lineHeight: 1.5,
};

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
    <div style={shell}>
      <div style={card}>
        <div style={{ textAlign: "left" }}>
          {eyebrow ? <div style={brand}>{eyebrow}</div> : null}
          <h1 style={titleStyle}>{title}</h1>
          {lead ? <p style={subtitle}>{lead}</p> : null}
        </div>
        {children}
      </div>
    </div>
  );
}
