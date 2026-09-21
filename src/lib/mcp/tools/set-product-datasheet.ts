import { defineTool, ToolError } from "@lovable.dev/mcp-js";
import { z } from "zod";
import { jsonResult, notFound, requireAdmin } from "../admin";
import { PRODUCT_COLUMNS, toProduct } from "../products";

// Same bucket and 10 MB limit the admin Products page uses.
const BUCKET = "product-images";
const FOLDER = "datasheets";
const MAX_BYTES = 10 * 1024 * 1024;
const FETCH_TIMEOUT_MS = 20_000;

function isPdf(bytes: Uint8Array) {
  // Every PDF starts with "%PDF-".
  return bytes.length > 5 && String.fromCharCode(...bytes.subarray(0, 5)) === "%PDF-";
}

function decodeBase64(input: string) {
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

async function download(url: string) {
  const res = await fetch(url, { signal: AbortSignal.timeout(FETCH_TIMEOUT_MS) }).catch((e: Error) => {
    throw new ToolError(`Could not download the PDF: ${e.message}`);
  });
  if (!res.ok || !res.body) throw new ToolError(`Could not download the PDF (HTTP ${res.status})`);
  const declared = Number(res.headers.get("content-length") ?? 0);
  if (declared > MAX_BYTES) throw new ToolError("PDF is larger than 10 MB");

  const chunks: Uint8Array[] = [];
  let total = 0;
  const reader = res.body.getReader();
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    total += value.length;
    if (total > MAX_BYTES) {
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

function fileNameFromUrl(url: string) {
  const last = decodeURIComponent(new URL(url).pathname.split("/").pop() ?? "");
  return last.toLowerCase().endsWith(".pdf") ? last : "datasheet.pdf";
}

/** Storage path of a datasheet this tool uploaded earlier, or null for external/legacy links. */
function ownStoragePath(url: string | null) {
  if (!url) return null;
  const marker = `/storage/v1/object/public/${BUCKET}/`;
  const i = url.indexOf(marker);
  if (i === -1) return null;
  const path = url.slice(i + marker.length);
  return path.startsWith(`${FOLDER}/`) ? path : null;
}

export default defineTool({
  name: "set_product_datasheet",
  title: "Set product datasheet (PDF)",
  description:
    "Admin only. Attach a PDF datasheet to a product (the 'ورقة البيانات (PDF)' field), replacing any existing one, or remove it. " +
    "Provide exactly one of: pdf_url (an https link to a PDF; it is downloaded and stored on the site), pdf_base64 (the PDF file content), or remove=true. Max 10 MB.",
  inputSchema: {
    id: z.string().uuid().describe("Product id."),
    pdf_url: z.string().url().startsWith("https://").optional().describe("https URL of the PDF to download and attach."),
    pdf_base64: z.string().min(1).optional().describe("Base64-encoded PDF file content."),
    file_name: z.string().trim().min(1).max(200).optional().describe("Name shown to customers, e.g. 'TL-SG1008D.pdf'."),
    remove: z.boolean().optional().describe("true to remove the product's datasheet."),
  },
  annotations: { readOnlyHint: false, destructiveHint: false, idempotentHint: false, openWorldHint: true },
  handler: async ({ id, pdf_url, pdf_base64, file_name, remove }, ctx) => {
    const sources = [pdf_url, pdf_base64, remove ? true : undefined].filter((v) => v !== undefined);
    if (sources.length !== 1) throw new ToolError("Provide exactly one of pdf_url, pdf_base64, or remove=true");
    const { supabase } = await requireAdmin(ctx);

    const { data: current, error: readError } = await supabase
      .from("products")
      .select("id, datasheet_url")
      .eq("id", id)
      .maybeSingle();
    if (readError) throw new ToolError(readError.message);
    if (!current) notFound("product", id);
    const previousPath = ownStoragePath(current.datasheet_url);

    let datasheetUrl: string | null = null;
    let datasheetName: string | null = null;
    let uploadedPath: string | null = null;

    if (!remove) {
      const bytes = pdf_url ? await download(pdf_url) : decodeBase64(pdf_base64!);
      if (bytes.length > MAX_BYTES) throw new ToolError("PDF is larger than 10 MB");
      if (!isPdf(bytes)) throw new ToolError("The file is not a PDF");

      uploadedPath = `${FOLDER}/${id}-${crypto.randomUUID()}.pdf`;
      const { error: uploadError } = await supabase.storage.from(BUCKET).upload(uploadedPath, bytes, {
        contentType: "application/pdf",
        upsert: false,
        cacheControl: "31536000",
      });
      if (uploadError) throw new ToolError(`Upload failed: ${uploadError.message}`);
      datasheetUrl = supabase.storage.from(BUCKET).getPublicUrl(uploadedPath).data.publicUrl;
      datasheetName = file_name ?? (pdf_url ? fileNameFromUrl(pdf_url) : "datasheet.pdf");
    }

    const { data, error } = await supabase
      .from("products")
      .update({ datasheet_url: datasheetUrl, datasheet_name: datasheetName })
      .eq("id", id)
      .select(PRODUCT_COLUMNS)
      .maybeSingle();
    if (error || !data) {
      if (uploadedPath) await supabase.storage.from(BUCKET).remove([uploadedPath]);
      if (error) throw new ToolError(error.message);
      notFound("product", id);
    }

    // Best effort: drop the file this tool stored previously; a leftover file is harmless.
    if (previousPath && previousPath !== uploadedPath) await supabase.storage.from(BUCKET).remove([previousPath]);

    const product = toProduct(data);
    return jsonResult(remove ? "Datasheet removed." : `Datasheet attached: ${product.datasheetName}.`, { product });
  },
});
