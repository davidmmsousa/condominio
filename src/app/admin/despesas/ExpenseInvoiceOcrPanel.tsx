"use client";

import { extractExpenseInvoiceTextFromFile } from "@/lib/ocr/extractExpenseInvoiceText.client";
import { parseExpenseInvoiceText, type ExpenseOcrDraft } from "@/lib/ocr/parseExpenseInvoiceText";
import { Icon } from "@/components/ui/Icon";
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
    <section className="card card--muted" style={{ marginBottom: 20 }}>
      <h3 className="card__title">Ler fatura (OCR)</h3>
      <p className="card__lead">
        Carrega PDF ou fotografia da fatura. O texto é lido no teu browser; revê os campos abaixo antes de guardar e
        escolhe a rubrica.
      </p>

      <input
        ref={inputRef}
        type="file"
        accept="application/pdf,image/jpeg,image/png,image/webp,image/heic,image/heif"
        onChange={onFileChange}
        disabled={busy}
        hidden
      />

      <div className="row">
        <button type="button" className="btn" disabled={busy} onClick={() => inputRef.current?.click()}>
          <Icon name="scan" size={17} />
          {busy ? "A ler fatura…" : "Escolher ficheiro"}
        </button>
        {fileLabel ? (
          <span className="small muted">
            Ficheiro: <strong>{fileLabel}</strong>
          </span>
        ) : null}
        {busy && progress !== null ? <span className="badge">OCR: {progress}%</span> : null}
      </div>

      {error ? (
        <p className="alert alert--error" style={{ marginTop: 12 }}>
          {error}
        </p>
      ) : null}

      {draft ? <DraftPreview draft={draft} categoryName={categoryName} onApply={() => onApplyDraft(draft)} /> : null}
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
    <div className="card" style={{ marginTop: 16, padding: 16 }}>
      <p className="list__title" style={{ margin: "0 0 10px" }}>
        Dados sugeridos
      </p>
      <dl className="kv">
        <dt className="muted">Referência</dt>
        <dd>{draft.reference ?? "—"}</dd>
        <dt className="muted">Data</dt>
        <dd>{draft.occurred_on ?? "—"}</dd>
        <dt className="muted">Valor</dt>
        <dd>{draft.amount_euros ? `${draft.amount_euros} €` : "—"}</dd>
        <dt className="muted">Fornecedor</dt>
        <dd>{draft.vendor ?? "—"}</dd>
        <dt className="muted">Rubrica sugerida</dt>
        <dd>{categoryName ?? "—"}</dd>
      </dl>
      {draft.warnings.length ? (
        <ul className="alert alert--warning" style={{ margin: "0 0 14px", paddingLeft: 30, display: "block" }}>
          {draft.warnings.map((w) => (
            <li key={w}>{w}</li>
          ))}
        </ul>
      ) : null}
      <button type="button" className="btn btn--primary" onClick={onApply}>
        Usar no formulário
      </button>
    </div>
  );
}
