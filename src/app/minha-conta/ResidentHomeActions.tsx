"use client";

import Link from "next/link";
import { useState } from "react";
import { ReportProblemDialog } from "./ReportProblemDialog";

export function ResidentHomeActions() {
  const [reportOpen, setReportOpen] = useState(false);

  return (
    <>
      <div className="resident-hub-grid">
        <Link href="/minha-conta/recibos" className="resident-hub-action">
          <strong>Ver recibos</strong>
          <span>Descarregar recibos dos pagamentos registados</span>
        </Link>
        <Link href="/minha-conta/saldos" className="resident-hub-action">
          <strong>Ver saldos</strong>
          <span>Conta corrente — cobranças e saldo em aberto</span>
        </Link>
        <button type="button" className="resident-hub-action resident-hub-action--button" onClick={() => setReportOpen(true)}>
          <strong>Reportar problema</strong>
          <span>Enviar título, descrição e fotografias à administração</span>
        </button>
      </div>
      <ReportProblemDialog open={reportOpen} onClose={() => setReportOpen(false)} />
    </>
  );
}
