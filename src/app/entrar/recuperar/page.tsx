import Link from "next/link";
import { AuthShell } from "@/app/entrar/AuthShell";
import { RecuperarForm } from "./RecuperarForm";

type Props = {
  searchParams: Promise<{ msg?: string | string[] }>;
};

function first(v: string | string[] | undefined) {
  return typeof v === "string" ? v : Array.isArray(v) ? v[0] : undefined;
}

export default async function RecuperarPage({ searchParams }: Props) {
  const msg = first((await searchParams).msg);
  const invalidLink = msg === "invalid_link";

  return (
    <AuthShell
      eyebrow="Conta"
      title="Recuperar palavra-passe"
      lead={
        invalidLink ? (
          <span style={{ color: "#92400e" }}>
            Este link já não é válido (expirou ou é antigo). Pede novo email abaixo. Confirma no Supabase que o Redirect
            URL inclui <code style={{ fontSize: "0.92em", background: "#f1f5f9", padding: "2px 6px", borderRadius: 4 }}>/auth/recovery</code>{" "}
            no teu domínio de produção.
          </span>
        ) : (
          "Indica o email registado — recebes um link da Supabase para definires nova password."
        )
      }
    >
      {!invalidLink ? null : (
        <p role="alert" style={{ margin: "-8px 0 4px", fontSize: 14, color: "#b45309", background: "#fef3c7", padding: "10px 12px", borderRadius: 8 }}>
          Ligação incompleta ou sessão perdida ao abrir o email.
        </p>
      )}
      <RecuperarForm />
      <p style={{ marginTop: 20, marginBottom: 0, textAlign: "center" as const }}>
        <Link href="/entrar" style={{ color: "#64748b", fontSize: 14, fontWeight: 500, textDecoration: "none" }}>
          ← Voltar ao login
        </Link>
      </p>
    </AuthShell>
  );
}
