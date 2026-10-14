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
    >
      <button type="submit" disabled={disabled} className="btn btn--warning">
        Iniciar novo ano operacional (+1)
      </button>
    </form>
  );
}
