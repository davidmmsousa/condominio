"use client";

import { updateResidentAction, type ActionState } from "@/app/admin/actions";
import { useActionState } from "react";

const inp = {
  padding: "10px 12px",
  borderRadius: 8,
  border: "1px solid #ccc",
  fontSize: 15,
  width: "100%",
  maxWidth: 400,
  boxSizing: "border-box" as const,
};

export function EditResidentForm({
  resident,
  units,
}: {
  resident: {
    id: string;
    full_name: string;
    email: string | null;
    phone: string | null;
    tax_id: string | null;
    unit_id: string;
  };
  units: Array<{ id: string; code: string }>;
}) {
  const [state, action, pending] = useActionState<ActionState | null, FormData>(updateResidentAction, null);

  return (
    <form action={action} style={{ display: "grid", gap: 10, marginTop: 10 }}>
      <input type="hidden" name="id" value={resident.id} />
      <label style={{ display: "grid", gap: 6, fontSize: 14 }}>
        Nome completo
        <input name="full_name" required disabled={pending} defaultValue={resident.full_name} style={inp} />
      </label>
      <label style={{ display: "grid", gap: 6, fontSize: 14 }}>
        Email (opcional)
        <input name="email" type="email" disabled={pending} defaultValue={resident.email ?? ""} style={inp} />
      </label>
      <label style={{ display: "grid", gap: 6, fontSize: 14 }}>
        Telemóvel (opcional)
        <input name="phone" type="tel" disabled={pending} defaultValue={resident.phone ?? ""} style={inp} />
      </label>
      <label style={{ display: "grid", gap: 6, fontSize: 14 }}>
        N.º contribuinte / NIF (opcional)
        <input
          name="tax_id"
          inputMode="numeric"
          disabled={pending}
          defaultValue={resident.tax_id ?? ""}
          placeholder="9 dígitos"
          style={inp}
        />
      </label>
      <label style={{ display: "grid", gap: 6, fontSize: 14 }}>
        Fração
        <select name="unit_id" required disabled={pending || units.length === 0} defaultValue={resident.unit_id} style={inp}>
          {units.map((u) => (
            <option key={u.id} value={u.id}>
              {u.code}
            </option>
          ))}
        </select>
      </label>
      {state?.error ? <p style={{ color: "#b00020", margin: 0, fontSize: 14 }}>{state.error}</p> : null}
      {state?.ok ? <p style={{ color: "#065f46", margin: 0, fontSize: 14 }}>Morador actualizado.</p> : null}
      <button type="submit" disabled={pending} className="btn" style={{ width: "fit-content" }}>
        {pending ? "A guardar…" : "Guardar alterações"}
      </button>
    </form>
  );
}
