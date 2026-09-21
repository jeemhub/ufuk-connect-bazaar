import { defineTool, ToolError } from "@lovable.dev/mcp-js";
import { z } from "zod";
import { supabaseForUser } from "../supabase";

export default defineTool({
  name: "get_product",
  title: "Get product",
  description: "Fetch one product with full details (descriptions, prices, stock, datasheet) by its id.",
  inputSchema: { id: z.string().uuid().describe("Product id.") },
  annotations: { readOnlyHint: true, openWorldHint: false },
  handler: async ({ id }, ctx) => {
    if (!ctx.isAuthenticated()) throw new ToolError("Not authenticated");
    const supabase = supabaseForUser(ctx);
    const { data, error } = await supabase.from("products").select("*").eq("id", id).maybeSingle();
    if (error) throw new ToolError(error.message);
    if (!data) throw new ToolError(`No product found with id ${id}`);
    const product = {
      id: data.id,
      sku: data.sku ?? null,
      nameAr: data.name_ar,
      nameEn: data.name_en,
      nameData: data.name_data ?? null,
      descAr: data.desc_ar ?? null,
      descEn: data.desc_en ?? null,
      brand: data.brand ?? null,
      subcategory: data.subcategory ?? null,
      categoryId: data.category_id ?? null,
      priceIqd: data.price_iqd,
      priceWholesaleIqd: data.price_wholesale_iqd,
      priceDealerIqd: data.price_dealer_iqd,
      stock: data.stock,
      isActive: data.is_active,
      imageUrl: data.image_url ?? null,
      datasheetUrl: data.datasheet_url ?? null,
    };
    return {
      content: [{ type: "text", text: JSON.stringify(product, null, 2) }],
      structuredContent: { product },
    };
  },
});
