import { defineTool, ToolError } from "@lovable.dev/mcp-js";
import { z } from "zod";
import { assertHasChanges, compact, jsonResult, notFound, requireAdmin, slugify } from "../admin";
import { BRAND_COLUMNS, toBrand } from "../brands";

export default defineTool({
  name: "update_brand",
  title: "Update brand",
  description:
    "Admin only. Update a brand. Only the fields provided are changed. Renaming does not update products.brand on existing products.",
  inputSchema: {
    id: z.string().uuid().describe("Brand id."),
    name: z.string().trim().min(1).optional().describe("Brand name."),
    slug: z.string().trim().min(1).optional().describe("Unique URL slug."),
    description: z.string().trim().nullable().optional().describe("Description, or null to clear."),
    logo_url: z.string().url().nullable().optional().describe("Logo image URL, or null to clear."),
    is_active: z.boolean().optional().describe("Show (true) or hide (false) on the store."),
    sort: z.number().int().min(0).optional().describe("Display order."),
  },
  annotations: { readOnlyHint: false, destructiveHint: false, idempotentHint: true, openWorldHint: false },
  handler: async ({ id, slug, ...fields }, ctx) => {
    const { supabase } = await requireAdmin(ctx);
    const patch = compact({ ...fields, slug: slug === undefined ? undefined : slugify(slug) });
    if (patch.slug === "") throw new ToolError("slug must contain letters or digits");
    assertHasChanges(patch);
    const { data, error } = await supabase.from("brands").update(patch).eq("id", id).select(BRAND_COLUMNS).maybeSingle();
    if (error) throw new ToolError(error.message);
    if (!data) notFound("brand", id);
    const brand = toBrand(data);
    return jsonResult(`Brand updated (${brand.id}).`, { brand });
  },
});
