import React from "react";
import { arrayBuffer } from "node:stream/consumers";
import { Document, Page, StyleSheet, Text, View, pdf } from "@react-pdf/renderer";

export type ReceiptPdfInput = {
  condominiumHeaderSubline?: string | null;
  condominiumTaxId?: string | null;
  condominiumName: string;
  receiptNumber: string;
  issuedAtIso: string;
  payerName: string;
  payerEmail?: string | null;
  payerTaxId?: string | null;
  unitCode: string;
  amountCents: number;
  lines: Array<{ label: string; amountCents: number }>;
  periodSummary?: string | null;
  paymentMethod?: string | null;
  paymentNote?: string | null;
};

const C = {
  ink: "#0f172a",
  inkMuted: "#475569",
  inkLight: "#64748b",
  brand: "#1e3a5f",
  brandLight: "#2d4a6f",
  border: "#cbd5e1",
  surface: "#f8fafc",
  surfaceAlt: "#f1f5f9",
  white: "#ffffff",
  accent: "#0ea5e9",
};

const styles = StyleSheet.create({
  page: {
    paddingTop: 0,
    paddingBottom: 36,
    paddingHorizontal: 40,
    fontSize: 10,
    fontFamily: "Helvetica",
    color: C.ink,
    backgroundColor: C.white,
  },
  header: {
    marginHorizontal: -40,
    marginBottom: 22,
    paddingTop: 28,
    paddingBottom: 22,
    paddingHorizontal: 40,
    backgroundColor: C.brand,
  },
  headerTitle: {
    fontSize: 22,
    fontFamily: "Helvetica-Bold",
    color: C.white,
    letterSpacing: 1.2,
    marginBottom: 8,
  },
  headerSub: {
    fontSize: 10,
    color: "#e2e8f0",
    lineHeight: 1.45,
    maxWidth: 420,
  },
  headerNif: {
    fontSize: 9,
    color: "#cbd5e1",
    marginTop: 6,
  },
  metaRow: {
    flexDirection: "row",
    gap: 12,
    marginBottom: 18,
  },
  metaBox: {
    flex: 1,
    padding: 10,
    backgroundColor: C.surface,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: C.border,
  },
  metaLabel: {
    fontSize: 8,
    color: C.inkLight,
    textTransform: "uppercase",
    letterSpacing: 0.6,
    marginBottom: 4,
    fontFamily: "Helvetica-Bold",
  },
  metaValue: {
    fontSize: 11,
    fontFamily: "Helvetica-Bold",
    color: C.ink,
  },
  sectionTitle: {
    fontSize: 9,
    fontFamily: "Helvetica-Bold",
    color: C.brand,
    textTransform: "uppercase",
    letterSpacing: 0.8,
    marginBottom: 8,
    marginTop: 4,
  },
  card: {
    padding: 12,
    marginBottom: 14,
    backgroundColor: C.surface,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: C.border,
  },
  infoRow: {
    flexDirection: "row",
    marginTop: 5,
  },
  infoLabel: {
    width: 88,
    fontSize: 9,
    color: C.inkLight,
  },
  infoValue: {
    flex: 1,
    fontSize: 10,
    color: C.ink,
  },
  periodBox: {
    padding: 12,
    marginBottom: 16,
    backgroundColor: "#eff6ff",
    borderRadius: 4,
    borderLeftWidth: 3,
    borderLeftColor: C.accent,
  },
  periodLine: {
    fontSize: 9,
    color: C.inkMuted,
    lineHeight: 1.5,
    marginTop: 3,
  },
  table: {
    marginBottom: 14,
    borderWidth: 1,
    borderColor: C.border,
    borderRadius: 4,
    overflow: "hidden",
  },
  tableHead: {
    flexDirection: "row",
    backgroundColor: C.brandLight,
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  tableHeadCell: {
    fontSize: 9,
    fontFamily: "Helvetica-Bold",
    color: C.white,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  tableHeadDesc: { flex: 1 },
  tableHeadAmt: { width: 88, textAlign: "right" },
  tableRow: {
    flexDirection: "row",
    paddingVertical: 7,
    paddingHorizontal: 12,
    borderTopWidth: 1,
    borderTopColor: C.border,
  },
  tableRowAlt: {
    backgroundColor: C.surfaceAlt,
  },
  tableCellDesc: {
    flex: 1,
    fontSize: 10,
    color: C.ink,
    paddingRight: 8,
  },
  tableCellAmt: {
    width: 88,
    fontSize: 10,
    textAlign: "right",
    fontFamily: "Helvetica-Bold",
    color: C.ink,
  },
  totalBox: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 12,
    paddingHorizontal: 14,
    backgroundColor: C.brand,
    borderRadius: 4,
    marginBottom: 20,
  },
  totalLabel: {
    fontSize: 11,
    fontFamily: "Helvetica-Bold",
    color: C.white,
    textTransform: "uppercase",
    letterSpacing: 0.6,
  },
  totalValue: {
    fontSize: 16,
    fontFamily: "Helvetica-Bold",
    color: C.white,
  },
  footer: {
    borderTopWidth: 1,
    borderTopColor: C.border,
    paddingTop: 12,
    fontSize: 8,
    color: C.inkLight,
    textAlign: "center",
    lineHeight: 1.4,
  },
});

function euros(cents: number) {
  return (cents / 100).toFixed(2).replace(".", ",") + " €";
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.infoRow}>
      <Text style={styles.infoLabel}>{label}</Text>
      <Text style={styles.infoValue}>{value}</Text>
    </View>
  );
}

function ReceiptDoc(input: ReceiptPdfInput) {
  const issuerLine = input.condominiumHeaderSubline?.trim() || input.condominiumName;
  const issuedDate = new Date(input.issuedAtIso).toLocaleDateString("pt-PT", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>RECIBO</Text>
          <Text style={styles.headerSub}>{issuerLine}</Text>
          {input.condominiumTaxId?.trim() ? (
            <Text style={styles.headerNif}>NIF contribuinte: {input.condominiumTaxId.trim()}</Text>
          ) : null}
        </View>

        <View style={styles.metaRow}>
          <View style={styles.metaBox}>
            <Text style={styles.metaLabel}>N.º do recibo</Text>
            <Text style={styles.metaValue}>{input.receiptNumber}</Text>
          </View>
          <View style={styles.metaBox}>
            <Text style={styles.metaLabel}>Data de emissão</Text>
            <Text style={styles.metaValue}>{issuedDate}</Text>
          </View>
        </View>

        <Text style={styles.sectionTitle}>Dados do pagador</Text>
        <View style={styles.card}>
          <InfoRow label="Fração" value={input.unitCode} />
          <InfoRow label="Nome" value={input.payerName} />
          {input.payerTaxId ? <InfoRow label="NIF" value={input.payerTaxId} /> : null}
          {input.payerEmail ? <InfoRow label="Email" value={input.payerEmail} /> : null}
          {input.paymentMethod ? <InfoRow label="Meio" value={input.paymentMethod} /> : null}
          {input.paymentNote ? <InfoRow label="Referência" value={input.paymentNote} /> : null}
        </View>

        {input.periodSummary ? (
          <View style={styles.periodBox}>
            <Text style={{ fontSize: 9, fontFamily: "Helvetica-Bold", color: C.brand }}>Período coberto</Text>
            {input.periodSummary.split("\n").map((line, i) => (
              <Text key={i} style={styles.periodLine}>
                {line}
              </Text>
            ))}
          </View>
        ) : null}

        <Text style={styles.sectionTitle}>Detalhe do pagamento</Text>
        <View style={styles.table}>
          <View style={styles.tableHead}>
            <Text style={[styles.tableHeadCell, styles.tableHeadDesc]}>Descrição</Text>
            <Text style={[styles.tableHeadCell, styles.tableHeadAmt]}>Valor</Text>
          </View>
          {input.lines.map((l, idx) => (
            <View key={idx} style={[styles.tableRow, idx % 2 === 1 ? styles.tableRowAlt : {}]}>
              <Text style={styles.tableCellDesc}>{l.label}</Text>
              <Text style={styles.tableCellAmt}>{euros(l.amountCents)}</Text>
            </View>
          ))}
        </View>

        <View style={styles.totalBox}>
          <Text style={styles.totalLabel}>Total recebido</Text>
          <Text style={styles.totalValue}>{euros(input.amountCents)}</Text>
        </View>

        <Text style={styles.footer}>
          Documento emitido pela gestão do condomínio. Conserve este recibo para seu arquivo.
        </Text>
      </Page>
    </Document>
  );
}

export async function renderReceiptPdf(input: ReceiptPdfInput): Promise<Uint8Array> {
  const instance = pdf(<ReceiptDoc {...input} />);
  const stream = await instance.toBuffer();
  const ab = await arrayBuffer(stream);
  return new Uint8Array(ab);
}
