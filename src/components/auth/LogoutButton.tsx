"use client";

import { createBrowserSupabaseClient } from "@/lib/supabase/browser-client";
import { useRouter } from "next/navigation";
import { useState } from "react";

export function LogoutButton({ label = "Sair" }: { label?: string }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  return (
    <button
      type="button"
      disabled={busy}
      onClick={async () => {
        setBusy(true);
        const supabase = createBrowserSupabaseClient();
        await supabase.auth.signOut();
        router.push("/entrar");
        router.refresh();
      }}
      style={{
        padding: "8px 14px",
        borderRadius: 8,
        border: "1px solid #ccc",
        background: "#fff",
        cursor: busy ? "not-allowed" : "pointer",
        fontSize: 14,
      }}
    >
      {busy ? "A sair…" : label}
    </button>
  );
}
