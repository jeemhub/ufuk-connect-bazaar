import { defineTool, ToolError } from "@lovable.dev/mcp-js";
import { z } from "zod";
import { jsonResult, notFound, requireAdmin } from "../admin";

// Same values the admin Quotes page shows.
const QUOTE_STATUSES = ["new", "contacted", "closed"] as const;

export default defineTool({
  name: "update_quote_request_status",
  title: "Update quote request status",
  description: "Admin only. Change a quote request's status.",
  inputSchema: {
    id: z.string().uuid().describe("Quote request id."),
    status: z.enum(QUOTE_STATUSES).describe("New status."),
  },
  annotations: { readOnlyHint: false, destructiveHint: false, idempotentHint: true, openWorldHint: false },
  handler: async ({ id, status }, ctx) => {
    const { supabase } = await requireAdmin(ctx);
    const { data, error } = await supabase
      .from("quote_requests")
      .update({ status })
      .eq("id", id)
      .select("id, full_name, status")
      .maybeSingle();
    if (error) throw new ToolError(error.message);
    if (!data) notFound("quote request", id);
    const quote = { id: data.id, fullName: data.full_name, status: data.status };
    return jsonResult(`Quote request ${quote.id} is now ${quote.status}.`, { quote });
  },
});
