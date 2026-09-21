import { defineTool, ToolError } from "@lovable.dev/mcp-js";
import { z } from "zod";
import { compact, jsonResult, requireAdmin } from "../admin";
import { PRODUCT_COLUMNS, productFields, toProduct } from "../products";

export default defineTool({
  name: "create_product",
  title: "Create product",
  description:
    "Admin only. Create a new product. New products are hidden (is_active=false) unless is_active is set, so they can be reviewed first.",
  inputSchema: {
    name_ar: z.string().trim().min(1).describe("Arabic name (required)."),
    ...productFields,
    is_active: z.boolean().optional().describe("Show on the store. Defaults to false."),
  },
  annotations: { readOnlyHint: false, destructiveHint: false, idempotentHint: false, openWorldHint: false },
  handler: async (input, ctx) => {
    const { supabase } = await requireAdmin(ctx);
    const { data, error } = await supabase
      .from("products")
      .insert({
        ...compact(input),
        name_en: input.name_en ?? input.name_ar,
        is_active: input.is_active ?? false,
      })
      .select(PRODUCT_COLUMNS)
      .single();
    if (error) throw new ToolError(error.message);
    const product = toProduct(data);
    return jsonResult(`Product created (${product.id}).`, { product });
  },
});
