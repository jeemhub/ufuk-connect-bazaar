import { defineTool, ToolError } from "@lovable.dev/mcp-js";
import { z } from "zod";
import { assertHasChanges, compact, jsonResult, notFound, requireAdmin } from "../admin";
import { PRODUCT_COLUMNS, productFields, toProduct } from "../products";

export default defineTool({
  name: "update_product",
  title: "Update product",
  description: "Admin only. Update a product. Only the fields provided are changed; pass null to clear an optional field.",
  inputSchema: {
    id: z.string().uuid().describe("Product id."),
    name_ar: z.string().trim().min(1).optional().describe("Arabic name."),
    ...productFields,
    is_active: z.boolean().optional().describe("Show (true) or hide (false) on the store."),
  },
  annotations: { readOnlyHint: false, destructiveHint: false, idempotentHint: true, openWorldHint: false },
  handler: async ({ id, ...fields }, ctx) => {
    const { supabase } = await requireAdmin(ctx);
    const patch = compact(fields);
    assertHasChanges(patch);
    const { data, error } = await supabase.from("products").update(patch).eq("id", id).select(PRODUCT_COLUMNS).maybeSingle();
    if (error) throw new ToolError(error.message);
    if (!data) notFound("product", id);
    const product = toProduct(data);
    return jsonResult(`Product updated (${product.id}).`, { product });
  },
});
