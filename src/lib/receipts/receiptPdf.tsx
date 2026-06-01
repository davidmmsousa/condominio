import React from "react";
import { arrayBuffer } from "node:stream/consumers";
import { Document, Page, StyleSheet, Text, View, pdf } from "@react-pdf/renderer";

export type ReceiptPdfInput = {
  /** Texto cinzento logo abaixo de "Recibo" (morada / identificação do prédio). */
  condominiumHeaderSubline?: string | null;
  /** NIF do condomínio (emitente). */
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
  /** Resumo dos meses / quotas cobertos por esta transferência */
  periodSummary?: string | null;
  paymentMethod?: string | null;
  paymentNote?: string | null;
};

const styles = StyleSheet.create({
  page: { padding: 32, fontSize: 11, fontFamily: "Helvetica" },
  h1: { fontSize: 18, marginBottom: 6 },
  muted: { color: "#444" },
  section: { marginTop: 14 },
  row: { flexDirection: "row", justifyContent: "space-between", marginTop: 4 },
  tableHeader: { marginTop: 10, paddingTop: 8, borderTop: "1 solid #999" },
  total: { marginTop: 10, paddingTop: 8, borderTop: "1 solid #999", fontSize: 12 }
});

function euros(cents: number) {
  return (cents / 100).toFixed(2).replace(".", ",") + " €";
}

function ReceiptDoc(input: ReceiptPdfInput) {
  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <Text style={styles.h1}>Recibo</Text>
        <Text style={styles.muted}>
          {input.condominiumHeaderSubline?.trim() || input.condominiumName}
        </Text>
        {input.condominiumTaxId?.trim() ? (
          <Text style={styles.muted}>Contribuinte: {input.condominiumTaxId.trim()}</Text>
        ) : null}

        <View style={styles.section}>
          <Text>Recibo nº: {input.receiptNumber}</Text>
          <Text>Data: {new Date(input.issuedAtIso).toLocaleDateString("pt-PT")}</Text>
        </View>

        <View style={styles.section}>
          <Text>Fração: {input.unitCode}</Text>
          <Text>Pagador: {input.payerName}</Text>
          {input.payerTaxId ? <Text>NIF: {input.payerTaxId}</Text> : null}
          {input.payerEmail ? <Text>Email: {input.payerEmail}</Text> : null}
          {input.paymentMethod ? <Text>Meio: {input.paymentMethod}</Text> : null}
          {input.paymentNote ? <Text>Nota registo: {input.paymentNote}</Text> : null}
        </View>

        {input.periodSummary ? (
          <View style={styles.section}>
            <Text style={{ fontSize: 10, color: "#333" }}>{input.periodSummary}</Text>
          </View>
        ) : null}

        <View style={[styles.section, styles.tableHeader]}>
          <Text>Detalhe</Text>
          {input.lines.map((l, idx) => (
            <View key={idx} style={styles.row}>
              <Text>{l.label}</Text>
              <Text>{euros(l.amountCents)}</Text>
            </View>
          ))}
        </View>

        <View style={[styles.section, styles.total]}>
          <View style={styles.row}>
            <Text>Total recebido</Text>
            <Text>{euros(input.amountCents)}</Text>
          </View>
        </View>
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
