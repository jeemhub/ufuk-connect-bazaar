export const APPROVED_BACKEND = "https://hytdpmtahcmztezhbooc.supabase.co";
export function assertApprovedBackend(value: string | undefined): string {
  if (value !== APPROVED_BACKEND) throw new Error("Independent backend configuration required");
  return value;
}
function equalSecret(a: string, b: string): boolean {
  if (!a || !b || a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}
/** Claims decoded from an unverified JWT never authorize a service caller. */
export function isServiceCaller(request: Request, configuredKey: string): boolean {
  const token = (request.headers.get("authorization") ?? "").replace(/^Bearer\s+/i, "").trim();
  return equalSecret(token, configuredKey) || equalSecret(request.headers.get("apikey") ?? "", configuredKey);
}
