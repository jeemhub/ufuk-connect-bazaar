import { defineTool, ToolError } from "@lovable.dev/mcp-js";
import { z } from "zod";
import { assertHasChanges, compact, jsonResult, notFound, requireAdmin, slugify } from "../admin";

export default defineTool({
  name: "update_category",
  title: "Update category",
  description: "Admin only. Update a product category. Only the fields provided are changed.",
  inputSchema: {
    id: z.string().uuid().describe("Category id."),
    name_ar: z.string().trim().min(1).optional().describe("Arabic name."),
    name_en: z.string().trim().min(1).optional().describe("English name."),
    key: z.string().trim().min(1).optional().describe("Unique key (a-z, 0-9, dashes)."),
    sort: z.number().int().min(0).optional().describe("Display order."),
  },
  annotations: { readOnlyHint: false, destructiveHint: false, idempotentHint: true, openWorldHint: false },
  handler: async ({ id, key, ...fields }, ctx) => {
    const { supabase } = await requireAdmin(ctx);
    const patch = compact({ ...fields, key: key === undefined ? undefined : slugify(key) });
    if (patch.key === "") throw new ToolError("key must contain letters or digits");
    assertHasChanges(patch);
    const { data, error } = await supabase
      .from("categories")
      .update(patch)
      .eq("id", id)
      .select("id, key, name_ar, name_en, sort")
      .maybeSingle();
    if (error) throw new ToolError(error.message);
    if (!data) notFound("category", id);
    const category = { id: data.id, key: data.key, nameAr: data.name_ar, nameEn: data.name_en, sort: data.sort };
    return jsonResult(`Category updated (${category.id}).`, { category });
  },
});
