"use client";

import type { ExpenseOcrDraft } from "@/lib/ocr/parseExpenseInvoiceText";
import { useState } from "react";
import { CreateExpenseForm } from "./CreateExpenseForm";
import { ExpenseInvoiceOcrPanel } from "./ExpenseInvoiceOcrPanel";

export function RegisterExpenseSection({
  categories,
  units,
}: {
  categories: Array<{ id: string; name: string }>;
  units: Array<{ id: string; code: string }>;
}) {
  const [formKey, setFormKey] = useState(0);
  const [initialDraft, setInitialDraft] = useState<ExpenseOcrDraft | null>(null);

  return (
    <>
      <ExpenseInvoiceOcrPanel
        categories={categories}
        onApplyDraft={(draft) => {
          setInitialDraft(draft);
          setFormKey((k) => k + 1);
        }}
      />
      <CreateExpenseForm key={formKey} categories={categories} units={units} initialDraft={initialDraft} />
    </>
  );
}
