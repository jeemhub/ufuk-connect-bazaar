import { defineTool, ToolError } from "@lovable.dev/mcp-js";
import { z } from "zod";
import { jsonResult, requireAdmin } from "../admin";

export default defineTool({
  name: "create_subcategory",
  title: "Create subcategory",
  description: "Admin only. Create a subcategory under an existing category.",
  inputSchema: {
    category_id: z.string().uuid().describe("Parent category id."),
    name_ar: z.string().trim().min(1).describe("Arabic name."),
    name_en: z.string().trim().min(1).describe("English name."),
  },
  annotations: { readOnlyHint: false, destructiveHint: false, idempotentHint: false, openWorldHint: false },
  handler: async (input, ctx) => {
    const { supabase } = await requireAdmin(ctx);
    const { data, error } = await supabase
      .from("subcategories")
      .insert(input)
      .select("id, category_id, name_ar, name_en")
      .single();
    if (error) throw new ToolError(error.message);
    const subcategory = { id: data.id, categoryId: data.category_id, nameAr: data.name_ar, nameEn: data.name_en };
    return jsonResult(`Subcategory created (${subcategory.id}).`, { subcategory });
  },
});
