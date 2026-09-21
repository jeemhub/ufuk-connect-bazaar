import { ToolError } from "@lovable.dev/mcp-js";

// Same bucket and 10 MB limit the admin Products page uses.
export const DATASHEET_BUCKET = "product-images";
export const DATASHEET_FOLDER = "datasheets";
export const DATASHEET_MAX_BYTES = 10 * 1024 * 1024;
const FETCH_TIMEOUT_MS = 20_000;

/** A storage path inside the datasheets folder: no "..", no leading slash, ends in .pdf. */
export const DATASHEET_PATH_PATTERN = /^datasheets\/(?!.*\.\.)[A-Za-z0-9._\-/]+\.pdf$/;

export function isPdf(bytes: Uint8Array) {
  // Every PDF starts with "%PDF-".
  return bytes.length > 5 && String.fromCharCode(...bytes.subarray(0, 5)) === "%PDF-";
}

export function decodeBase64(input: string) {
  const clean = input.replace(/^data:application\/pdf;base64,/, "").replace(/\s+/g, "");
  let binary: string;
  try {
    binary = atob(clean);
  } catch {
    throw new ToolError("pdf_base64 is not valid base64");
  }
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return bytes;
}

/** Downloads a PDF over https, refusing anything above the 10 MB limit. */
export async function downloadPdf(url: string, notFoundMessage?: string) {
  const res = await fetch(url, { signal: AbortSignal.timeout(FETCH_TIMEOUT_MS) }).catch((e: Error) => {
    throw new ToolError(`Could not download the PDF: ${e.message}`);
  });
  if (notFoundMessage && (res.status === 400 || res.status === 404)) throw new ToolError(notFoundMessage);
  if (!res.ok || !res.body) throw new ToolError(`Could not download the PDF (HTTP ${res.status})`);
  const declared = Number(res.headers.get("content-length") ?? 0);
  if (declared > DATASHEET_MAX_BYTES) throw new ToolError("PDF is larger than 10 MB");

  const chunks: Uint8Array[] = [];
  let total = 0;
  const reader = res.body.getReader();
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    total += value.length;
    if (total > DATASHEET_MAX_BYTES) {
      await reader.cancel();
      throw new ToolError("PDF is larger than 10 MB");
    }
    chunks.push(value);
  }
  const bytes = new Uint8Array(total);
  let offset = 0;
  for (const c of chunks) {
    bytes.set(c, offset);
    offset += c.length;
  }
  return bytes;
}

export function fileNameFromPath(pathOrUrl: string) {
  const last = decodeURIComponent(pathOrUrl.split("?")[0].split("/").pop() ?? "");
  return last.toLowerCase().endsWith(".pdf") ? last : "datasheet.pdf";
}

/** Storage-safe version of a file name: lowercase ASCII, digits, dots and dashes, ending in .pdf. */
export function safePdfName(fileName: string) {
  const base = fileName
    .trim()
    .replace(/\.pdf$/i, "")
    .toLowerCase()
    .replace(/[^a-z0-9.-]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^[-.]+|[-.]+$/g, "")
    .slice(0, 120);
  return `${base || "datasheet"}.pdf`;
}

/** Storage path of a datasheet stored by these tools, or null for external/legacy links. */
export function ownStoragePath(url: string | null) {
  if (!url) return null;
  const marker = `/storage/v1/object/public/${DATASHEET_BUCKET}/`;
  const i = url.indexOf(marker);
  if (i === -1) return null;
  const path = decodeURIComponent(url.slice(i + marker.length).split("?")[0]);
  return path.startsWith(`${DATASHEET_FOLDER}/`) ? path : null;
}
