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
          <span>
            Este link já não é válido (expirou ou é antigo). Pede novo email abaixo. Confirma no Supabase que o Redirect
            URL inclui <code>/auth/recovery</code> no teu domínio de produção.
          </span>
        ) : (
          "Indica o email registado — recebes um link da Supabase para definires nova password."
        )
      }
    >
      {!invalidLink ? null : (
        <p role="alert" className="alert alert--warning" style={{ marginBottom: 16 }}>
          Ligação incompleta ou sessão perdida ao abrir o email.
        </p>
      )}
      <RecuperarForm />
      <p className="auth-shell__foot">
        <Link href="/entrar">← Voltar ao login</Link>
      </p>
    </AuthShell>
  );
}
