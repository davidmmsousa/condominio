import "server-only";

import { env } from "@/lib/env";
import { createServiceSupabaseClient } from "@/lib/supabase/server-client";

/** Atualiza `profiles.unit_id` quando já existe `auth.users` com o mesmo email. */
export async function tryLinkAuthProfileToResident(params: {
  email: string | null | undefined;
  unitId: string;
  condominiumId: string;
}): Promise<{ linked: boolean; rpcError?: string }> {
  const email = params.email?.trim();
  if (!email) return { linked: false };
  if (!env.SUPABASE_SERVICE_ROLE_KEY) return { linked: false };
  let admin;
  try {
    admin = createServiceSupabaseClient();
  } catch {
    return { linked: false };
  }
  const { data, error } = await admin.rpc("link_resident_profile_by_email", {
    p_email: email,
    p_unit_id: params.unitId,
    p_condominium_id: params.condominiumId,
  });
  if (error) return { linked: false, rpcError: error.message };
  return { linked: Boolean(data) };
}

export type ResidentAuthBootstrapResult =
  | { status: "created" }
  | { status: "linked" }
  | { status: "failed"; message: string };

const defaultResidentPassword = "tomar2026";

function isDuplicateUserError(err: { message?: string; status?: number } | null): boolean {
  if (!err) return false;
  const m = (err.message ?? "").toLowerCase();
  if (m.includes("already") || m.includes("registered") || m.includes("exists") || m.includes("duplicate")) {
    return true;
  }
  return err.status === 422;
}

/**
 * Cria utilizador Auth (morador) com password inicial e metadados para o trigger `handle_new_user`.
 * Se o email já existir, tenta só associar o perfil à fração (RPC).
 */
export async function createResidentAuthUserOrLink(params: {
  email: string;
  unitId: string;
  condominiumId: string;
}): Promise<ResidentAuthBootstrapResult> {
  if (!env.SUPABASE_SERVICE_ROLE_KEY) {
    return { status: "failed", message: "Falta SUPABASE_SERVICE_ROLE_KEY no servidor." };
  }

  let admin;
  try {
    admin = createServiceSupabaseClient();
  } catch {
    return { status: "failed", message: "Cliente Supabase admin inválido." };
  }

  const password = env.RESIDENT_DEFAULT_PASSWORD ?? defaultResidentPassword;
  const email = params.email.trim();

  const { data, error } = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: {
      role: "resident",
      condominium_id: params.condominiumId,
      unit_id: params.unitId,
    },
  });

  if (!error && data?.user) {
    return { status: "created" };
  }

  if (isDuplicateUserError(error)) {
    const link = await tryLinkAuthProfileToResident({
      email,
      unitId: params.unitId,
      condominiumId: params.condominiumId,
    });
    if (link.linked) return { status: "linked" };
    return {
      status: "failed",
      message:
        link.rpcError ??
        "Já existe conta Auth com este email, mas o perfil não foi associado (ex.: conta não é de morador).",
    };
  }

  return {
    status: "failed",
    message: error?.message ?? "Erro ao criar utilizador Auth.",
  };
}
