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
      <p className="auth-shell__foot">
        <Link href="/entrar">Ir para entrar</Link>
      </p>
    </AuthShell>
  );
}
