import { env } from "@/lib/env";

export function isGmailConfigured(): boolean {
  return Boolean(
    env.GMAIL_CLIENT_ID &&
      env.GMAIL_CLIENT_SECRET &&
      env.GMAIL_REFRESH_TOKEN &&
      env.GMAIL_SENDER,
  );
}

type GmailToken = {
  access_token: string;
  expires_in: number;
  token_type: string;
};

export async function getGmailAccessToken(): Promise<string> {
  const clientId = env.GMAIL_CLIENT_ID;
  const clientSecret = env.GMAIL_CLIENT_SECRET;
  const refreshToken = env.GMAIL_REFRESH_TOKEN;
  if (!clientId || !clientSecret || !refreshToken) {
    throw new Error("Missing Gmail OAuth env vars (GMAIL_CLIENT_ID/SECRET/REFRESH_TOKEN)");
  }

  const res = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "content-type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: clientId,
      client_secret: clientSecret,
      refresh_token: refreshToken,
      grant_type: "refresh_token",
    }),
  });

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Failed to refresh Gmail token: ${res.status} ${body}`);
  }

  const json = (await res.json()) as GmailToken;
  return json.access_token;
}

function toBase64Url(input: string) {
  return Buffer.from(input, "utf8")
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/g, "");
}

/** RFC 2047 encoded-word (UTF-8 Base64) for MIME headers. Raw UTF-8 in Subject often becomes mojibake. */
function encodeRfc2047HeaderValue(value: string): string {
  if (/^[\x20-\x7E]*$/.test(value)) return value;

  const prefix = "=?UTF-8?B?";
  const suffix = "?=";
  const maxWordLen = 75;
  const maxB64Chunk = maxWordLen - prefix.length - suffix.length;
  const b64 = Buffer.from(value, "utf8").toString("base64");
  const chunks: string[] = [];
  for (let i = 0; i < b64.length; i += maxB64Chunk) {
    chunks.push(`${prefix}${b64.slice(i, i + maxB64Chunk)}${suffix}`);
  }
  return chunks.join(" ");
}

export type GmailBinaryAttachment = {
  filename: string;
  mimeType: string;
  bytes: Uint8Array;
};

export type SendGmailMessageArgs = {
  to: string;
  subject: string;
  text: string;
  from?: string; // defaults to env.GMAIL_SENDER
  pdfFilename?: string;
  pdfBytes?: Uint8Array;
  attachments?: GmailBinaryAttachment[];
};

function appendBase64Attachment(
  raw: string,
  boundary: string,
  attachment: GmailBinaryAttachment,
): string {
  let out = raw;
  out += `--${boundary}\r\n`;
  out += `Content-Type: ${attachment.mimeType}\r\n`;
  out += `Content-Disposition: attachment; filename="${attachment.filename}"\r\n`;
  out += "Content-Transfer-Encoding: base64\r\n\r\n";
  out += Buffer.from(attachment.bytes).toString("base64").replace(/(.{76})/g, "$1\r\n") + "\r\n";
  return out;
}

export async function sendGmailMessage(args: SendGmailMessageArgs): Promise<{ id: string }> {
  const from = args.from ?? env.GMAIL_SENDER;
  if (!from) throw new Error("Missing GMAIL_SENDER");

  const boundary = "condominio_boundary_" + Math.random().toString(16).slice(2);
  const extraAttachments = args.attachments ?? [];
  const hasPdf = Boolean(args.pdfBytes?.length);
  const hasMultipart = hasPdf || extraAttachments.length > 0;

  const headers = [
    `From: ${from}`,
    `To: ${args.to}`,
    `Subject: ${encodeRfc2047HeaderValue(args.subject)}`,
    "MIME-Version: 1.0",
  ];

  let raw = "";
  if (hasMultipart) {
    headers.push(`Content-Type: multipart/mixed; boundary="${boundary}"`);
    raw += headers.join("\r\n") + "\r\n\r\n";
    raw += `--${boundary}\r\n`;
    raw += `Content-Type: text/plain; charset="UTF-8"\r\n\r\n`;
    raw += `${args.text}\r\n\r\n`;
    for (const attachment of extraAttachments) {
      raw = appendBase64Attachment(raw, boundary, attachment);
    }
    if (hasPdf && args.pdfBytes) {
      raw = appendBase64Attachment(raw, boundary, {
        filename: args.pdfFilename ?? "recibo.pdf",
        mimeType: "application/pdf",
        bytes: args.pdfBytes,
      });
    }
    raw += `--${boundary}--\r\n`;
  } else {
    headers.push(`Content-Type: text/plain; charset="UTF-8"`);
    raw = headers.join("\r\n") + "\r\n\r\n" + args.text + "\r\n";
  }

  const accessToken = await getGmailAccessToken();
  const res = await fetch("https://gmail.googleapis.com/gmail/v1/users/me/messages/send", {
    method: "POST",
    headers: {
      authorization: `Bearer ${accessToken}`,
      "content-type": "application/json",
    },
    body: JSON.stringify({ raw: toBase64Url(raw) }),
  });

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Failed to send Gmail message: ${res.status} ${body}`);
  }

  return (await res.json()) as { id: string };
}

