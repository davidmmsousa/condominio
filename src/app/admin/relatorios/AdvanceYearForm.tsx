"use client";

import { advanceOperatingYear } from "@/app/admin/report-actions";

export function AdvanceYearForm() {
  return (
    <form
      action={advanceOperatingYear}
      onSubmit={(e) => {
        const ok = window.confirm(
          "Antes de iniciar o próximo ano operacional, é boa prática exportar os CSV/relatório deste ano para arquivo. Queres continuar e incrementar +1 no ano operacional guardado na base?",
        );
        if (!ok) e.preventDefault();
      }}
      style={{ display: "inline" }}
    >
      <button
        type="submit"
        style={{
          padding: "10px 18px",
          borderRadius: 10,
          border: "1px solid #7c3aed",
          background: "#faf5ff",
          color: "#5b21b6",
          fontWeight: 600,
          cursor: "pointer",
        }}
      >
        Iniciar novo ano operacional (+1)
      </button>
    </form>
  );
}
