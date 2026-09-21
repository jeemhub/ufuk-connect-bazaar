import { defineTool, ToolError } from "@lovable.dev/mcp-js";
import { z } from "zod";
import { jsonResult, notFound, requireAdmin } from "../admin";

// Same values the admin Orders page offers.
const ORDER_STATUSES = ["pending", "processing", "shipped", "delivered", "canceled"] as const;

export default defineTool({
  name: "update_order_status",
  title: "Update order status",
  description: "Admin only. Change an order's status.",
  inputSchema: {
    id: z.string().uuid().describe("Order id."),
    status: z.enum(ORDER_STATUSES).describe("New status."),
  },
  annotations: { readOnlyHint: false, destructiveHint: false, idempotentHint: true, openWorldHint: false },
  handler: async ({ id, status }, ctx) => {
    const { supabase } = await requireAdmin(ctx);
    const { data, error } = await supabase
      .from("orders")
      .update({ status })
      .eq("id", id)
      .select("id, order_no, status, updated_at")
      .maybeSingle();
    if (error) throw new ToolError(error.message);
    if (!data) notFound("order", id);
    const order = { id: data.id, orderNo: data.order_no, status: data.status, updatedAt: data.updated_at };
    return jsonResult(`Order ${order.orderNo} is now ${order.status}.`, { order });
  },
});
