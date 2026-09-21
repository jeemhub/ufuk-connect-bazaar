import { defineTool, ToolError } from "@lovable.dev/mcp-js";
import { z } from "zod";
import { jsonResult, requireAdmin } from "../admin";
import { PRODUCT_COLUMNS, toProduct } from "../products";

export default defineTool({
  name: "list_all_products",
  title: "List all products (admin)",
  description:
    "Admin only. List products including hidden (inactive) ones, newest first. Filter by text, brand, category or active state.",
  inputSchema: {
    query: z.string().trim().nullable().describe("Free text to match against names, SKU or brand, or null."),
    brand: z.string().trim().nullable().describe("Exact brand name filter, or null."),
    category_id: z.string().uuid().nullable().describe("Category id filter, or null."),
    is_active: z.boolean().nullable().describe("true = only visible, false = only hidden, null = both."),
    limit: z.number().int().min(1).max(200).nullable().describe("Maximum rows to return (default 50)."),
  },
  annotations: { readOnlyHint: true, openWorldHint: false },
  handler: async ({ query, brand, category_id, is_active, limit }, ctx) => {
    const { supabase } = await requireAdmin(ctx);
    let q = supabase
      .from("products")
      .select(PRODUCT_COLUMNS)
      .order("created_at", { ascending: false })
      .limit(limit ?? 50);
    if (query) {
      const like = `%${query}%`;
      q = q.or(`name_ar.ilike.${like},name_en.ilike.${like},name_data.ilike.${like},sku.ilike.${like},brand.ilike.${like}`);
    }
    if (brand) q = q.eq("brand", brand);
    if (category_id) q = q.eq("category_id", category_id);
    if (is_active !== null) q = q.eq("is_active", is_active);
    const { data, error } = await q;
    if (error) throw new ToolError(error.message);
    const products = (data ?? []).map(toProduct);
    return jsonResult(`${products.length} product(s).`, { products });
  },
});
