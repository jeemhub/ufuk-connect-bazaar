import { defineTool, ToolError } from "@lovable.dev/mcp-js";
import { z } from "zod";
import { jsonResult, requireAdmin } from "../admin";
import { PRODUCT_COLUMNS, toProduct } from "../products";
import {
  DATASHEET_BUCKET,
  DATASHEET_FOLDER,
  DATASHEET_MAX_BYTES,
  DATASHEET_PATH_PATTERN,
  decodeBase64,
  downloadPdf,
  fileNameFromPath,
  isPdf,
  ownStoragePath,
} from "../datasheets";

type ProductRow = Parameters<typeof toProduct>[0];

export default defineTool({
  name: "set_product_datasheet",
  title: "Set product datasheet (PDF)",
  description:
    "Admin only. Attach a PDF datasheet to one product (id) or up to 100 products at once (product_ids), replacing any existing one, or remove it. " +
    "Provide exactly one source: storage_path (a file already uploaded via create_datasheet_upload; preferred for local files), " +
    "pdf_url (an https link to a PDF; it is downloaded and stored on the site), pdf_base64 (the PDF file content), or remove=true. Max 10 MB. " +
    "A previously attached file is deleted only once no product uses it any more.",
  inputSchema: {
    id: z.string().uuid().optional().describe("Product id (use this or product_ids)."),
    product_ids: z
      .array(z.string().uuid())
      .min(1)
      .max(100)
      .optional()
      .describe("Up to 100 product ids that all get the same datasheet (use this or id)."),
    storage_path: z
      .string()
      .regex(DATASHEET_PATH_PATTERN, "storage_path must be a .pdf path inside datasheets/")
      .optional()
      .describe("storage_path returned by create_datasheet_upload. The file must already be uploaded."),
    pdf_url: z.string().url().startsWith("https://").optional().describe("https URL of the PDF to download and attach."),
    pdf_base64: z.string().min(1).optional().describe("Base64-encoded PDF file content."),
    file_name: z.string().trim().min(1).max(200).optional().describe("Name shown to customers, e.g. 'TL-SG1008D.pdf'."),
    remove: z.boolean().optional().describe("true to remove the datasheet."),
  },
  annotations: { readOnlyHint: false, destructiveHint: false, idempotentHint: false, openWorldHint: true },
  handler: async ({ id, product_ids, storage_path, pdf_url, pdf_base64, file_name, remove }, ctx) => {
    if ((id === undefined) === (product_ids === undefined)) throw new ToolError("Provide exactly one of id or product_ids");
    const sources = [storage_path, pdf_url, pdf_base64, remove ? true : undefined].filter((v) => v !== undefined);
    if (sources.length !== 1) throw new ToolError("Provide exactly one of storage_path, pdf_url, pdf_base64, or remove=true");
    const ids = [...new Set(product_ids ?? [id!])];
    const { supabase } = await requireAdmin(ctx);
    const bucket = supabase.storage.from(DATASHEET_BUCKET);

    const { data: current, error: readError } = await supabase.from("products").select("id, datasheet_url").in("id", ids);
    if (readError) throw new ToolError(readError.message);
    const found = (current ?? []) as { id: string; datasheet_url: string | null }[];
    const missing = ids.filter((pid) => !found.some((row) => row.id === pid));
    if (missing.length) throw new ToolError(`No product found with id ${missing.join(", ")}`);

    let datasheetUrl: string | null = null;
    let datasheetName: string | null = null;
    let newPath: string | null = null;
    let uploadedPath: string | null = null;

    if (storage_path) {
      // Uploaded earlier through create_datasheet_upload: read it back from its public link to verify it.
      newPath = storage_path;
      datasheetUrl = bucket.getPublicUrl(storage_path).data.publicUrl;
      const bytes = await downloadPdf(datasheetUrl, `No uploaded file found at ${storage_path}`);
      if (!isPdf(bytes)) throw new ToolError("The file at storage_path is not a PDF");
      datasheetName = file_name ?? fileNameFromPath(storage_path);
    } else if (!remove) {
      const bytes = pdf_url ? await downloadPdf(pdf_url) : decodeBase64(pdf_base64!);
      if (bytes.length > DATASHEET_MAX_BYTES) throw new ToolError("PDF is larger than 10 MB");
      if (!isPdf(bytes)) throw new ToolError("The file is not a PDF");

      uploadedPath = newPath = `${DATASHEET_FOLDER}/${crypto.randomUUID()}.pdf`;
      const { error: uploadError } = await bucket.upload(uploadedPath, bytes, {
        contentType: "application/pdf",
        upsert: false,
        cacheControl: "31536000",
      });
      if (uploadError) throw new ToolError(`Upload failed: ${uploadError.message}`);
      datasheetUrl = bucket.getPublicUrl(uploadedPath).data.publicUrl;
      datasheetName = file_name ?? (pdf_url ? fileNameFromPath(new URL(pdf_url).pathname) : "datasheet.pdf");
    }

    const { data, error } = await supabase
      .from("products")
      .update({ datasheet_url: datasheetUrl, datasheet_name: datasheetName })
      .in("id", ids)
      .select(PRODUCT_COLUMNS);
    const updated = (data ?? []) as ProductRow[];
    if (error || updated.length !== ids.length) {
      if (uploadedPath) await bucket.remove([uploadedPath]);
      throw new ToolError(error?.message ?? `Updated ${updated.length} of ${ids.length} products`);
    }

    // Best effort: drop files these tools stored earlier, but only once no product links to them any more,
    // since one datasheet is often shared by many products. A leftover file is harmless.
    const previous = new Map<string, string>();
    for (const row of found) {
      const path = ownStoragePath(row.datasheet_url);
      if (path && path !== newPath) previous.set(path, row.datasheet_url!);
    }
    for (const [path, url] of previous) {
      const { count, error: countError } = await supabase
        .from("products")
        .select("id", { count: "exact", head: true })
        .eq("datasheet_url", url);
      if (!countError && count === 0) await bucket.remove([path]);
    }

    const products = updated.map(toProduct);
    const summary = remove
      ? `Datasheet removed from ${products.length} product(s).`
      : `Datasheet attached to ${products.length} product(s): ${datasheetName}.`;
    return id !== undefined
      ? jsonResult(summary, { product: products[0] })
      : jsonResult(summary, { count: products.length, products });
  },
});
