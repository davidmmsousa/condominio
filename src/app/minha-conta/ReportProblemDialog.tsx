"use client";

import { useEffect, useRef, useState } from "react";

export function ReportProblemDialog({ open, onClose }: { open: boolean; onClose: () => void }) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    const el = dialogRef.current;
    if (!el) return;
    if (open && !el.open) el.showModal();
    if (!open && el.open) el.close();
  }, [open]);

  function reset() {
    setTitle("");
    setDescription("");
    setError(null);
    setSuccess(false);
    setBusy(false);
  }

  function handleClose() {
    if (busy) return;
    reset();
    onClose();
  }

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setBusy(true);
    try {
      const form = e.currentTarget;
      const fd = new FormData(form);
      fd.set("title", title.trim());
      fd.set("description", description.trim());
      const res = await fetch("/api/portal/reports", { method: "POST", body: fd });
      const json = (await res.json().catch(() => null)) as { error?: string; ok?: boolean } | null;
      if (!res.ok) {
        setError(json?.error ?? "Não foi possível enviar o reporte.");
        return;
      }
      setSuccess(true);
      form.reset();
      setTitle("");
      setDescription("");
    } catch {
      setError("Erro de rede ao enviar o reporte.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <dialog ref={dialogRef} className="resident-dialog" onCancel={handleClose}>
      <form onSubmit={onSubmit} className="resident-dialog__form">
        <div className="resident-dialog__header">
          <h2 className="resident-dialog__title">Reportar problema</h2>
          <button type="button" className="resident-dialog__close" onClick={handleClose} disabled={busy} aria-label="Fechar">
            ×
          </button>
        </div>
        <p className="resident-dialog__lead">
          Descreve o problema. A administração recebe o reporte no email do condomínio.
        </p>
        {success ? (
          <>
            <p className="resident-dialog__success" role="status">
              Reporte enviado. Obrigado.
            </p>
            <div className="resident-dialog__actions">
              <button type="button" className="btn" onClick={handleClose}>
                Fechar
              </button>
            </div>
          </>
        ) : (
          <>
            <label className="resident-dialog__label">
              Título
              <input
                name="title"
                required
                maxLength={120}
                disabled={busy}
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="resident-dialog__input"
              />
            </label>
            <label className="resident-dialog__label">
              Descrição
              <textarea
                name="description"
                required
                maxLength={2000}
                rows={5}
                disabled={busy}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="resident-dialog__textarea"
              />
            </label>
            <label className="resident-dialog__label">
              Fotografias (opcional, até 4)
              <input
                type="file"
                name="photos"
                accept="image/jpeg,image/png,image/webp,image/heic,image/heif"
                multiple
                disabled={busy}
                className="resident-dialog__file"
              />
            </label>
            {error ? (
              <p className="resident-dialog__error" role="alert">
                {error}
              </p>
            ) : null}
            <div className="resident-dialog__actions">
              <button type="button" className="btn" onClick={handleClose} disabled={busy}>
                Cancelar
              </button>
              <button type="submit" className="btn resident-dialog__submit" disabled={busy}>
                {busy ? "A enviar…" : "Enviar reporte"}
              </button>
            </div>
          </>
        )}
      </form>
    </dialog>
  );
}
