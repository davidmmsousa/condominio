import Link from "next/link";
import { AuthShell } from "@/app/entrar/AuthShell";
import { RedefinirPasswordForm } from "./RedefinirPasswordForm";

export default function RedefinirPasswordPage() {
  return (
    <AuthShell
      eyebrow="Segurança"
      title="Definir nova palavra-passe"
      lead="Este ecrã abre quando o link do email está correto. Usa pelo menos 8 caracteres para a nova password."
    >
      <RedefinirPasswordForm />
      <p style={{ marginTop: 20, marginBottom: 0, textAlign: "center" as const }}>
        <Link href="/entrar" style={{ color: "#64748b", fontSize: 14, fontWeight: 500, textDecoration: "none" }}>
          Ir para entrar
        </Link>
      </p>
    </AuthShell>
  );
}
