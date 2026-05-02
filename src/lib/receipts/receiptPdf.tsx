import React from "react";
import { arrayBuffer } from "node:stream/consumers";
import { Document, Page, StyleSheet, Text, View, pdf } from "@react-pdf/renderer";

export type ReceiptPdfInput = {
  condominiumName: string;
  receiptNumber: string;
  issuedAtIso: string;
  payerName: string;
  payerEmail?: string | null;
  unitCode: string;
  amountCents: number;
  lines: Array<{ label: string; amountCents: number }>;
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
        <Text style={styles.muted}>{input.condominiumName}</Text>

        <View style={styles.section}>
          <Text>Recibo nº: {input.receiptNumber}</Text>
          <Text>Data: {new Date(input.issuedAtIso).toLocaleDateString("pt-PT")}</Text>
        </View>

        <View style={styles.section}>
          <Text>Fraçăo: {input.unitCode}</Text>
          <Text>Pagador: {input.payerName}</Text>
          {input.payerEmail ? <Text>Email: {input.payerEmail}</Text> : null}
        </View>

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

        <View style={styles.section}>
          <Text style={styles.muted}>
            Este recibo é gerado automaticamente para registo interno do condomínio.
          </Text>
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

