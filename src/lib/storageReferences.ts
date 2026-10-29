export const TARGET_PROJECT = "hytdpmtahcmztezhbooc";
export const TARGET_ORIGIN = `https://${TARGET_PROJECT}.supabase.co`;
const APPROVED_HOSTS = new Set([`${TARGET_PROJECT}.supabase.co`, "ecbbhathvpxrgvfztzeu.supabase.co"]);
export const STORAGE_BUCKETS = new Set(["product-images", "brand-logos", "blog-images", "project-images", "avatars", "quote-attachments"]);
export interface StorageObject { bucket: string; path: string }

function validateObject(bucket: string, path: string): StorageObject {
  if (!STORAGE_BUCKETS.has(bucket) || !path || path.includes("\\") || /[\u0000-\u001f\u007f]/.test(path) || path.split("/").some(p => !p || p === "." || p === "..")) throw new Error("Invalid application Storage reference");
  return { bucket, path };
}

/** A stable locator, not a public-access claim. Never persist expiring signed URLs. */
export function storageReference(bucket: string, path: string): string {
  validateObject(bucket, path);
  return `${TARGET_ORIGIN}/storage/v1/object/public/${bucket}/${path.split("/").map(encodeURIComponent).join("/")}`;
}

/** Source URLs and previously signed URLs resolve to the same target object. */
export function storageObject(value?: string | null): StorageObject | null {
  if (!value) return null;
  let url: URL;
  try { url = new URL(value); } catch { return null; }
  if (!APPROVED_HOSTS.has(url.hostname)) return null;
  if (url.protocol !== "https:" || url.username || url.password || url.port) throw new Error("Invalid Storage origin");
  const rawPath = value.match(/^https:\/\/[^/?#]+([^?#]*)/i)?.[1] ?? "";
  if (rawPath.split("/").some(p => [".", ".."].includes(decodeURIComponent(p))) || /%2f|%5c/i.test(rawPath)) throw new Error("Ambiguous Storage path");
  const match = url.pathname.match(/^\/storage\/v1\/(?:object|render\/image)\/(?:public|sign|authenticated)\/([^/]+)\/(.+)$/);
  if (!match) return null;
  // Decode each segment once; encoded slashes cannot change the original folder.
  const bucket = decodeURIComponent(match[1]);
  const parts = match[2].split("/").map(p => {
    const decoded = decodeURIComponent(p);
    if (decoded.includes("/")) throw new Error("Encoded path separator");
    return decoded;
  });
  return validateObject(bucket, parts.join("/"));
}

export function isApplicationStorage(value?: string | null): boolean {
  try { return storageObject(value) !== null; } catch { return true; }
}
