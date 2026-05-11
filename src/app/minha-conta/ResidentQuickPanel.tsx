"use client";

import { useState } from "react";

const EMERGENCY_CONTACTS = [
  {
    id: "edp",
    label: "Eletricidade (EDP)",
    phoneDisplay: "800 506 506",
    phoneHref: "tel:+351800506506",
    note: "Gratuito",
  },
  {
    id: "agua",
    label: "Água (Tejo Ambiente)",
    phoneDisplay: "800 200 376",
    phoneHref: "tel:+351800200376",
    note: "Gratuito",
  },
  {
    id: "elevadores",
    label: "Elevadores (OTIS)",
    phoneDisplay: "219 268 200",
    phoneHref: "tel:+351219268200",
    note: "Chamada para a rede fixa nacional",
  },
] as const;

export function ResidentQuickPanel({ paymentIban }: { paymentIban: string | null }) {
  const [ibanVisible, setIbanVisible] = useState(false);
  const [copied, setCopied] = useState(false);
  const iban = paymentIban?.trim() || null;

  async function copyIban() {
    if (!iban) return;
    try {
      await navigator.clipboard.writeText(iban);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(false);
    }
  }

  return (
    <aside className="resident-quick-panel" aria-label="Pagamentos e contactos úteis">
      <section className="resident-quick-panel__card">
        <h2 className="resident-quick-panel__title">Pagamentos</h2>
        <p className="resident-quick-panel__hint">IBAN do condomínio para transferências de quotas.</p>
        {iban ? (
          <button
            type="button"
            className="resident-quick-panel__action"
            aria-expanded={ibanVisible}
            onClick={() => setIbanVisible((v) => !v)}
          >
            {ibanVisible ? "Ocultar IBAN" : "Ver IBAN"}
          </button>
        ) : (
          <p className="resident-quick-panel__hint" style={{ marginBottom: 0 }}>
            IBAN ainda não configurado pela administração.
          </p>
        )}
        {iban && ibanVisible ? (
          <div className="resident-quick-panel__iban-block">
            <p className="resident-quick-panel__iban" id="condominio-iban">
              {iban}
            </p>
            <button type="button" className="btn resident-quick-panel__copy" onClick={copyIban}>
              {copied ? "Copiado" : "Copiar IBAN"}
            </button>
          </div>
        ) : null}
      </section>

      <section className="resident-quick-panel__card">
        <h2 className="resident-quick-panel__title">Contactos úteis (avarias)</h2>
        <ul className="resident-quick-panel__contacts">
          {EMERGENCY_CONTACTS.map((c) => (
            <li key={c.id}>
              <span className="resident-quick-panel__contact-label">{c.label}</span>
              <a href={c.phoneHref} className="resident-quick-panel__phone">
                {c.phoneDisplay}
              </a>
              <span className="resident-quick-panel__contact-note">{c.note}</span>
            </li>
          ))}
        </ul>
      </section>
    </aside>
  );
}
