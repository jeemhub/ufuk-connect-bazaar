/** Prepared Resend Free adapter. No key, account or sender is created here. */
export interface OwnedEmailConfig { apiKey: string; from: string }
export interface OwnedEmail { to: unknown; subject: unknown; html?: unknown; text?: unknown; idempotency_key?: unknown; message_id?: unknown }
export class OwnedEmailError extends Error {
  constructor(public status: number, public retryAfterSeconds = 60) { super(`Email provider rejected request (${status})`); }
}
export async function sendOwnedEmail(payload: OwnedEmail, config: OwnedEmailConfig, send: typeof fetch = fetch): Promise<void> {
  if (!config.apiKey || !config.from || /[\r\n]/.test(config.from)) throw new Error("Verified owned email sender not configured");
  if (typeof payload.to !== "string" || payload.to.length > 254 || !/^[^\s,<>@]+@[^\s,<>@]+\.[^\s,<>@]+$/.test(payload.to)) throw new Error("Invalid email recipient");
  if (typeof payload.subject !== "string" || !payload.subject || payload.subject.length > 998 || /[\r\n]/.test(payload.subject)) throw new Error("Invalid email subject");
  if (typeof payload.html !== "string" && typeof payload.text !== "string") throw new Error("Email content missing");
  const id = payload.idempotency_key ?? payload.message_id;
  if (typeof id !== "string" || !/^[a-zA-Z0-9_.:-]{1,256}$/.test(id)) throw new Error("Stable email idempotency key required");
  const response = await send("https://api.resend.com/emails", {
    method: "POST",
    headers: { Authorization: `Bearer ${config.apiKey}`, "Content-Type": "application/json", "Idempotency-Key": id },
    body: JSON.stringify({ from: config.from, to: [payload.to], subject: payload.subject, ...(typeof payload.html === "string" ? { html: payload.html } : {}), ...(typeof payload.text === "string" ? { text: payload.text } : {}) }),
    redirect: "error",
  });
  if (!response.ok) {
    const retry = Number(response.headers.get("retry-after"));
    throw new OwnedEmailError(response.status, Number.isFinite(retry) && retry > 0 ? Math.min(retry, 3600) : 60);
  }
}
