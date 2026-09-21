import { defineTool, ToolError } from "@lovable.dev/mcp-js";
import { z } from "zod";
import { assertHasChanges, compact, jsonResult, notFound, requireAdmin } from "../admin";

export default defineTool({
  name: "update_subcategory",
  title: "Update subcategory",
  description: "Admin only. Rename a subcategory or move it to another category. Only the fields provided are changed.",
  inputSchema: {
    id: z.string().uuid().describe("Subcategory id."),
    category_id: z.string().uuid().optional().describe("New parent category id."),
    name_ar: z.string().trim().min(1).optional().describe("Arabic name."),
    name_en: z.string().trim().min(1).optional().describe("English name."),
  },
  annotations: { readOnlyHint: false, destructiveHint: false, idempotentHint: true, openWorldHint: false },
  handler: async ({ id, ...fields }, ctx) => {
    const { supabase } = await requireAdmin(ctx);
    const patch = compact(fields);
    assertHasChanges(patch);
    const { data, error } = await supabase
      .from("subcategories")
      .update(patch)
      .eq("id", id)
      .select("id, category_id, name_ar, name_en")
      .maybeSingle();
    if (error) throw new ToolError(error.message);
    if (!data) notFound("subcategory", id);
    const subcategory = { id: data.id, categoryId: data.category_id, nameAr: data.name_ar, nameEn: data.name_en };
    return jsonResult(`Subcategory updated (${subcategory.id}).`, { subcategory });
  },
});
