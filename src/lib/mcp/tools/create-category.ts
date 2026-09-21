import { defineTool, ToolError } from "@lovable.dev/mcp-js";
import { z } from "zod";
import { jsonResult, requireAdmin, slugify } from "../admin";

export default defineTool({
  name: "create_category",
  title: "Create category",
  description: "Admin only. Create a product category.",
  inputSchema: {
    name_ar: z.string().trim().min(1).describe("Arabic name."),
    name_en: z.string().trim().min(1).describe("English name."),
    key: z.string().trim().min(1).optional().describe("Unique key (a-z, 0-9, dashes). Defaults to a slug of name_en."),
    sort: z.number().int().min(0).optional().describe("Display order. Defaults to last."),
  },
  annotations: { readOnlyHint: false, destructiveHint: false, idempotentHint: false, openWorldHint: false },
  handler: async ({ name_ar, name_en, key, sort }, ctx) => {
    const { supabase } = await requireAdmin(ctx);
    const finalKey = slugify(key ?? name_en);
    if (!finalKey) throw new ToolError("Could not derive a key from name_en; provide key explicitly");
    let finalSort = sort;
    if (finalSort === undefined) {
      const { count, error } = await supabase.from("categories").select("id", { count: "exact", head: true });
      if (error) throw new ToolError(error.message);
      finalSort = count ?? 0;
    }
    const { data, error } = await supabase
      .from("categories")
      .insert({ name_ar, name_en, key: finalKey, sort: finalSort })
      .select("id, key, name_ar, name_en, sort")
      .single();
    if (error) throw new ToolError(error.message);
    const category = { id: data.id, key: data.key, nameAr: data.name_ar, nameEn: data.name_en, sort: data.sort };
    return jsonResult(`Category created (${category.id}).`, { category });
  },
});
