"use client";

import { Icon, type IconName } from "@/components/ui/Icon";
import Link from "next/link";
import { useState } from "react";
import { ReportProblemDialog } from "./ReportProblemDialog";

function ActionBody({ icon, title, description }: { icon: IconName; title: string; description: string }) {
  return (
    <>
      <span className="resident-hub-action__icon">
        <Icon name={icon} size={22} />
      </span>
      <span className="resident-hub-action__body">
        <strong>{title}</strong>
        <span className="resident-hub-action__desc">{description}</span>
      </span>
    </>
  );
}

export function ResidentHomeActions() {
  const [reportOpen, setReportOpen] = useState(false);

  return (
    <>
      <div className="resident-hub-grid">
        <Link href="/minha-conta/recibos" className="resident-hub-action">
          <ActionBody icon="file" title="Ver recibos" description="Descarregar recibos dos pagamentos registados" />
        </Link>
        <Link href="/minha-conta/saldos" className="resident-hub-action">
          <ActionBody icon="ledger" title="Ver saldos" description="Conta corrente — cobranças e saldo em aberto" />
        </Link>
        <button type="button" className="resident-hub-action resident-hub-action--button" onClick={() => setReportOpen(true)}>
          <ActionBody
            icon="alertCircle"
            title="Reportar problema"
            description="Enviar título, descrição e fotografias à administração"
          />
        </button>
      </div>
      <ReportProblemDialog open={reportOpen} onClose={() => setReportOpen(false)} />
    </>
  );
}
