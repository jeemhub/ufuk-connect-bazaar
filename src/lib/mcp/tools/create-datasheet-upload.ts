import { defineTool, ToolError } from "@lovable.dev/mcp-js";
import { z } from "zod";
import { jsonResult, requireAdmin } from "../admin";
import { DATASHEET_BUCKET, DATASHEET_FOLDER, safePdfName } from "../datasheets";

export default defineTool({
  name: "create_datasheet_upload",
  title: "Create datasheet upload URL",
  description:
    "Admin only. Reserve a storage path for a PDF datasheet and return a signed upload URL, so a local file can be sent " +
    "straight to storage (e.g. with curl) instead of through a tool call. Upload the file with an HTTP PUT to upload_url " +
    "(valid for 2 hours), then attach it with set_product_datasheet using storage_path (optionally product_ids for many products at once).",
  inputSchema: {
    file_name: z
      .string()
      .trim()
      .min(1)
      .max(200)
      .regex(/\.pdf$/i, "file_name must end in .pdf")
      .describe("Name of the PDF being uploaded, e.g. 'Indoor-Fiber-Patch-Cord.pdf'."),
  },
  annotations: { readOnlyHint: false, destructiveHint: false, idempotentHint: false, openWorldHint: false },
  handler: async ({ file_name }, ctx) => {
    const { supabase } = await requireAdmin(ctx);

    const storagePath = `${DATASHEET_FOLDER}/${crypto.randomUUID()}-${safePdfName(file_name)}`;
    const { data, error } = await supabase.storage.from(DATASHEET_BUCKET).createSignedUploadUrl(storagePath);
    if (error || !data) throw new ToolError(`Could not create upload URL: ${error?.message ?? "no data"}`);

    const publicUrl = supabase.storage.from(DATASHEET_BUCKET).getPublicUrl(storagePath).data.publicUrl;
    const curl = `curl -X PUT -H "Content-Type: application/pdf" --data-binary @"<local file>" "${data.signedUrl}"`;

    return jsonResult(`Upload URL ready for ${storagePath}. PUT the PDF to upload_url, then call set_product_datasheet with storage_path.`, {
      upload_url: data.signedUrl,
      storage_path: storagePath,
      public_url: publicUrl,
      curl,
    });
  },
});
