import Link from "next/link";
import { RecuperarForm } from "./RecuperarForm";

export default function RecuperarPage() {
  return (
    <main style={{ padding: 24, maxWidth: 480 }}>
      <h1 style={{ marginTop: 0 }}>Recuperar palavra-passe</h1>
      <p style={{ color: "#555" }}>
        Indica o email registado na conta — recebes um link (Supabase Auth) para definires uma nova password.
      </p>
      <RecuperarForm />
      <p style={{ marginTop: 24 }}>
        <Link href="/entrar">← Voltar ao login</Link>
      </p>
    </main>
  );
}
