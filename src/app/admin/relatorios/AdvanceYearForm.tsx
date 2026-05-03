"use client";

import { advanceOperatingYear } from "@/app/admin/report-actions";

export function AdvanceYearForm({ disabled }: { disabled?: boolean }) {
  return (
    <form
      action={advanceOperatingYear}
      onSubmit={(e) => {
        if (disabled) {
          e.preventDefault();
          return;
        }
        const ok = window.confirm(
          "Antes de iniciar o próximo ano operacional, é boa prática exportar os CSV/relatório deste ano para arquivo. Queres continuar e incrementar +1 no ano operacional guardado na base?",
        );
        if (!ok) e.preventDefault();
      }}
      style={{ display: "inline" }}
    >
      <button
        type="submit"
        disabled={disabled}
        style={{
          padding: "10px 18px",
          borderRadius: 10,
          border: "1px solid #7c3aed",
          background: disabled ? "#e2e8f0" : "#faf5ff",
          color: disabled ? "#64748b" : "#5b21b6",
          fontWeight: 600,
          cursor: disabled ? "not-allowed" : "pointer",
        }}
      >
        Iniciar novo ano operacional (+1)
      </button>
    </form>
  );
}
