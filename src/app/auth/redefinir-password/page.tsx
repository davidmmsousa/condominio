import Link from "next/link";
import { RedefinirPasswordForm } from "./RedefinirPasswordForm";

export default function RedefinirPasswordPage() {
  return (
    <main style={{ padding: 24, maxWidth: 480 }}>
      <h1 style={{ marginTop: 0 }}>Definir nova palavra-passe</h1>
      <p style={{ color: "#555" }}>Só aparece quando abres o link enviado por email pela Supabase.</p>
      <RedefinirPasswordForm />
      <p style={{ marginTop: 24 }}>
        <Link href="/entrar">Ir para entrar</Link>
      </p>
    </main>
  );
}
