"use client";

import { Icon } from "@/components/ui/Icon";
import { createBrowserSupabaseClient } from "@/lib/supabase/browser-client";
import { useRouter } from "next/navigation";
import { useState } from "react";

export function LogoutButton({ label = "Sair" }: { label?: string }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  return (
    <button
      type="button"
      className="btn btn--sm"
      disabled={busy}
      onClick={async () => {
        setBusy(true);
        const supabase = createBrowserSupabaseClient();
        await supabase.auth.signOut();
        router.push("/entrar");
        router.refresh();
      }}
    >
      <Icon name="logout" size={15} />
      {busy ? "A sair…" : label}
    </button>
  );
}
