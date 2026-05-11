"use client";

const MAX_BYTES = 12 * 1024 * 1024;
const MIN_TEXT_CHARS = 40;

async function ocrImageBlob(blob: Blob, onProgress?: (pct: number) => void): Promise<string> {
  const { createWorker } = await import("tesseract.js");
  const worker = await createWorker("por", undefined, {
    logger: (m) => {
      if (m.status === "recognizing text" && typeof m.progress === "number") {
        onProgress?.(Math.round(m.progress * 100));
      }
    },
  });
  try {
    const {
      data: { text },
    } = await worker.recognize(blob);
    return text ?? "";
  } finally {
    await worker.terminate();
  }
}

async function extractPdfText(file: File): Promise<string> {
  const pdfjs = await import("pdfjs-dist");
  if (typeof window !== "undefined") {
    pdfjs.GlobalWorkerOptions.workerSrc = `https://cdn.jsdelivr.net/npm/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;
  }

  const data = new Uint8Array(await file.arrayBuffer());
  const doc = await pdfjs.getDocument({ data }).promise;
  const page = await doc.getPage(1);
  const textContent = await page.getTextContent();
  const text = textContent.items
    .map((item) => ("str" in item ? item.str : ""))
    .join(" ")
    .replace(/\s+/g, " ")
    .trim();

  if (text.length >= MIN_TEXT_CHARS) return text;

  const viewport = page.getViewport({ scale: 2 });
  const canvas = document.createElement("canvas");
  canvas.width = viewport.width;
  canvas.height = viewport.height;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Não foi possível preparar a imagem do PDF para OCR.");

  await page.render({ canvas, canvasContext: ctx, viewport }).promise;
  const blob = await new Promise<Blob>((resolve, reject) => {
    canvas.toBlob((b) => (b ? resolve(b) : reject(new Error("Falha ao converter PDF em imagem."))), "image/png");
  });
  return ocrImageBlob(blob);
}

export async function extractExpenseInvoiceTextFromFile(
  file: File,
  onProgress?: (pct: number) => void,
): Promise<string> {
  if (file.size > MAX_BYTES) {
    throw new Error("Ficheiro demasiado grande (máx. 12 MB).");
  }

  const type = file.type.toLowerCase();
  if (type === "application/pdf") {
    return extractPdfText(file);
  }
  if (type.startsWith("image/")) {
    return ocrImageBlob(file, onProgress);
  }

  throw new Error("Formato não suportado. Usa PDF ou imagem (JPG, PNG, WebP).");
}
