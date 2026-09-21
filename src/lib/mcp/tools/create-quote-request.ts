import { defineTool, ToolError } from "@lovable.dev/mcp-js";
import { z } from "zod";
import { supabaseForUser } from "../supabase";

export default defineTool({
  name: "create_quote_request",
  title: "Create quote request",
  description: "Submit a price quote request to the sales team on behalf of the signed-in user.",
  inputSchema: {
    full_name: z.string().trim().min(1).describe("Contact full name."),
    phone: z.string().trim().min(1).describe("Contact phone number."),
    email: z.string().trim().nullable().describe("Contact email, or null."),
    company: z.string().trim().nullable().describe("Company name, or null."),
    product_id: z.string().uuid().nullable().describe("Related product id, or null."),
    product_name: z.string().trim().nullable().describe("Product name if no id is known, or null."),
    message: z.string().trim().nullable().describe("Details of what is needed, or null."),
  },
  annotations: { readOnlyHint: false, destructiveHint: false, openWorldHint: false },
  handler: async (input, ctx) => {
    if (!ctx.isAuthenticated()) throw new ToolError("Not authenticated");
    const supabase = supabaseForUser(ctx);
    const { data, error } = await supabase
      .from("quote_requests")
      .insert({
        full_name: input.full_name,
        phone: input.phone,
        email: input.email ?? null,
        company: input.company ?? null,
        product_id: input.product_id ?? null,
        product_name: input.product_name ?? null,
        message: input.message ?? null,
      })
      .select("id, full_name, phone, status, created_at")
      .single();
    if (error) throw new ToolError(error.message);
    const quote = {
      id: data.id,
      fullName: data.full_name,
      phone: data.phone,
      status: data.status,
      createdAt: data.created_at,
    };
    return {
      content: [{ type: "text", text: `Quote request created (${quote.id}).` }],
      structuredContent: { quote },
    };
  },
});
