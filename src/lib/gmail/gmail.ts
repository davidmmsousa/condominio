import { env } from "@/lib/env";

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

export type SendGmailMessageArgs = {
  to: string;
  subject: string;
  text: string;
  from?: string; // defaults to env.GMAIL_SENDER
  pdfFilename?: string;
  pdfBytes?: Uint8Array;
};

export async function sendGmailMessage(args: SendGmailMessageArgs): Promise<{ id: string }> {
  const from = args.from ?? env.GMAIL_SENDER;
  if (!from) throw new Error("Missing GMAIL_SENDER");

  const boundary = "condominio_boundary_" + Math.random().toString(16).slice(2);

  const headers = [
    `From: ${from}`,
    `To: ${args.to}`,
    `Subject: ${args.subject}`,
    "MIME-Version: 1.0",
  ];

  let raw = "";
  if (args.pdfBytes?.length) {
    headers.push(`Content-Type: multipart/mixed; boundary="${boundary}"`);
    raw += headers.join("\r\n") + "\r\n\r\n";
    raw += `--${boundary}\r\n`;
    raw += `Content-Type: text/plain; charset="UTF-8"\r\n\r\n`;
    raw += `${args.text}\r\n\r\n`;
    raw += `--${boundary}\r\n`;
    raw += `Content-Type: application/pdf\r\n`;
    raw += `Content-Disposition: attachment; filename="${args.pdfFilename ?? "recibo.pdf"}"\r\n`;
    raw += "Content-Transfer-Encoding: base64\r\n\r\n";
    raw += Buffer.from(args.pdfBytes).toString("base64").replace(/(.{76})/g, "$1\r\n") + "\r\n";
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

