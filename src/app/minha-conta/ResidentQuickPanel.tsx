"use client";

import { Icon, type IconName } from "@/components/ui/Icon";
import { useState } from "react";

const EMERGENCY_CONTACTS = [
  {
    id: "edp",
    icon: "bolt",
    label: "Eletricidade (EDP)",
    phoneDisplay: "800 506 506",
    phoneHref: "tel:+351800506506",
    note: "Gratuito",
  },
  {
    id: "agua",
    icon: "droplet",
    label: "Água (Tejo Ambiente)",
    phoneDisplay: "800 200 376",
    phoneHref: "tel:+351800200376",
    note: "Gratuito",
  },
  {
    id: "elevadores",
    icon: "elevator",
    label: "Elevadores (OTIS)",
    phoneDisplay: "219 268 200",
    phoneHref: "tel:+351219268200",
    note: "Chamada para a rede fixa nacional",
  },
] as const satisfies ReadonlyArray<{
  id: string;
  icon: IconName;
  label: string;
  phoneDisplay: string;
  phoneHref: string;
  note: string;
}>;

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
        <h2 className="resident-quick-panel__title">
          <Icon name="landmark" size={18} />
          Pagamentos
        </h2>
        <p className="resident-quick-panel__hint">IBAN do condomínio para transferências de quotas.</p>
        {iban ? (
          <button
            type="button"
            className="resident-quick-panel__action"
            aria-expanded={ibanVisible}
            onClick={() => setIbanVisible((v) => !v)}
          >
            <Icon name={ibanVisible ? "eyeOff" : "eye"} size={16} />
            {ibanVisible ? "Ocultar IBAN" : "Ver IBAN"}
          </button>
        ) : (
          <p className="resident-quick-panel__hint">
            IBAN ainda não configurado pela administração.
          </p>
        )}
        {iban && ibanVisible ? (
          <div className="resident-quick-panel__iban-block">
            <p className="resident-quick-panel__iban" id="condominio-iban">
              {iban}
            </p>
            <button type="button" className="btn resident-quick-panel__copy" onClick={copyIban}>
              <Icon name={copied ? "check" : "copy"} size={15} />
              {copied ? "Copiado" : "Copiar IBAN"}
            </button>
          </div>
        ) : null}
      </section>

      <section className="resident-quick-panel__card">
        <h2 className="resident-quick-panel__title">
          <Icon name="phone" size={18} />
          Contactos úteis (avarias)
        </h2>
        <ul className="resident-quick-panel__contacts">
          {EMERGENCY_CONTACTS.map((c) => (
            <li key={c.id}>
              <span className="contact-icon">
                <Icon name={c.icon} size={18} />
              </span>
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
