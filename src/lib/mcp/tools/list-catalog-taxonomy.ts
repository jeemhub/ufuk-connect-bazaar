import { defineTool, ToolError } from "@lovable.dev/mcp-js";
import { supabaseForUser } from "../supabase";

export default defineTool({
  name: "list_catalog_taxonomy",
  title: "List categories and brands",
  description: "List all store categories, subcategories and brands, useful before filtering a product search.",
  inputSchema: {},
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  handler: async (_args, ctx) => {
    if (!ctx.isAuthenticated()) throw new ToolError("Not authenticated");
    const supabase = supabaseForUser(ctx);
    const [categories, subcategories, brands] = await Promise.all([
      supabase.from("categories").select("id, key, name_ar, name_en").order("sort", { ascending: true }),
      supabase.from("subcategories").select("id, category_id, name_ar, name_en"),
      supabase.from("brands").select("id, name, logo_url"),
    ]);
    const firstError = categories.error ?? subcategories.error ?? brands.error;
    if (firstError) throw new ToolError(firstError.message);

    const taxonomy = {
      categories: (categories.data ?? []).map((c) => ({
        id: c.id,
        nameAr: c.name_ar,
        nameEn: c.name_en,
        key: c.key,
      })),
      subcategories: (subcategories.data ?? []).map((s) => ({
        id: s.id,
        categoryId: s.category_id ?? null,
        nameAr: s.name_ar,
        nameEn: s.name_en,
      })),
      brands: (brands.data ?? []).map((b) => ({
        id: b.id,
        name: b.name,
        logoUrl: (b as { logo_url?: string | null }).logo_url ?? null,
      })),
    };
    return {
      content: [{ type: "text", text: JSON.stringify(taxonomy, null, 2) }],
      structuredContent: taxonomy,
    };
  },
});
