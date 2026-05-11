"use client";

import { extractExpenseInvoiceTextFromFile } from "@/lib/ocr/extractExpenseInvoiceText.client";
import { parseExpenseInvoiceText, type ExpenseOcrDraft } from "@/lib/ocr/parseExpenseInvoiceText";
import { useRef, useState } from "react";

export function ExpenseInvoiceOcrPanel({
  categories,
  onApplyDraft,
}: {
  categories: Array<{ id: string; name: string }>;
  onApplyDraft: (draft: ExpenseOcrDraft) => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [progress, setProgress] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [draft, setDraft] = useState<ExpenseOcrDraft | null>(null);
  const [fileLabel, setFileLabel] = useState<string | null>(null);

  async function onFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;

    setBusy(true);
    setProgress(0);
    setError(null);
    setDraft(null);
    setFileLabel(file.name);

    try {
      const rawText = await extractExpenseInvoiceTextFromFile(file, setProgress);
      const parsed = parseExpenseInvoiceText(rawText, categories);
      setDraft(parsed);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao ler a fatura.");
      setFileLabel(null);
    } finally {
      setBusy(false);
      setProgress(null);
    }
  }

  const categoryName = draft?.suggestedCategoryId
    ? categories.find((c) => c.id === draft.suggestedCategoryId)?.name
    : undefined;

  return (
    <section
      style={{
        marginBottom: 24,
        padding: 18,
        borderRadius: 12,
        border: "1px solid #e2e8f0",
        background: "#f8fafc",
      }}
    >
      <h3 style={{ margin: "0 0 8px", fontSize: 16 }}>Ler fatura (OCR)</h3>
      <p style={{ margin: "0 0 14px", fontSize: 14, color: "#64748b", lineHeight: 1.5 }}>
        Carrega PDF ou fotografia da fatura. O texto é lido no teu browser; revê os campos abaixo antes de guardar e
        escolhe a rubrica.
      </p>

      <input
        ref={inputRef}
        type="file"
        accept="application/pdf,image/jpeg,image/png,image/webp,image/heic,image/heif"
        onChange={onFileChange}
        disabled={busy}
        style={{ display: "none" }}
      />

      <button
        type="button"
        className="btn"
        disabled={busy}
        onClick={() => inputRef.current?.click()}
        style={{ marginBottom: 10 }}
      >
        {busy ? "A ler fatura…" : "Escolher ficheiro"}
      </button>

      {fileLabel ? (
        <p style={{ margin: "0 0 8px", fontSize: 13, color: "#475569" }}>
          Ficheiro: <strong>{fileLabel}</strong>
        </p>
      ) : null}

      {busy && progress !== null ? (
        <p style={{ margin: "0 0 8px", fontSize: 13, color: "#475569" }}>OCR: {progress}%</p>
      ) : null}

      {error ? <p style={{ margin: 0, fontSize: 14, color: "#b00020" }}>{error}</p> : null}

      {draft ? (
        <DraftPreview draft={draft} categoryName={categoryName} onApply={() => onApplyDraft(draft)} />
      ) : null}
    </section>
  );
}

function DraftPreview({
  draft,
  categoryName,
  onApply,
}: {
  draft: ExpenseOcrDraft;
  categoryName?: string;
  onApply: () => void;
}) {
  return (
    <div
      style={{
        marginTop: 14,
        padding: 14,
        borderRadius: 10,
        border: "1px solid #cbd5e1",
        background: "#fff",
      }}
    >
      <p style={{ margin: "0 0 10px", fontSize: 14, fontWeight: 600 }}>Dados sugeridos</p>
      <ul style={{ margin: "0 0 12px", paddingLeft: 18, fontSize: 14, color: "#334155" }}>
        <li>Referência: {draft.reference ?? "—"}</li>
        <li>Data: {draft.occurred_on ?? "—"}</li>
        <li>Valor: {draft.amount_euros ? `${draft.amount_euros} €` : "—"}</li>
        <li>Fornecedor: {draft.vendor ?? "—"}</li>
        <li>Rubrica sugerida: {categoryName ?? "—"}</li>
      </ul>
      {draft.warnings.length ? (
        <ul style={{ margin: "0 0 12px", paddingLeft: 18, fontSize: 13, color: "#92400e" }}>
          {draft.warnings.map((w) => (
            <li key={w}>{w}</li>
          ))}
        </ul>
      ) : null}
      <button type="button" className="btn" onClick={onApply}>
        Usar no formulário
      </button>
    </div>
  );
}
