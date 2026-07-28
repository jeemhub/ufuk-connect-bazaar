import "dotenv/config";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { createClient } from "@supabase/supabase-js";
import { z } from "zod";
import { TABLES, assertAllowed } from "./tables.js";

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error(
    "Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY env vars. " +
      "Copy mcp-server/.env.example to mcp-server/.env and fill them in " +
      "(Supabase dashboard -> Project Settings -> API -> service_role key)."
  );
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: { persistSession: false },
});

const server = new McpServer({
  name: "ufuk-admin-dashboard",
  version: "1.0.0",
});

function textResult(value) {
  return {
    content: [
      {
        type: "text",
        text: typeof value === "string" ? value : JSON.stringify(value, null, 2),
      },
    ],
  };
}

function errorResult(err) {
  return {
    isError: true,
    content: [{ type: "text", text: err instanceof Error ? err.message : String(err) }],
  };
}

server.tool(
  "list_tables",
  "List every admin-dashboard section/table this server can read or edit, with the allowed operations for each.",
  {},
  async () => {
    const summary = Object.fromEntries(
      Object.entries(TABLES).map(([table, cfg]) => [
        table,
        { section: cfg.section, permissions: cfg.permissions },
      ])
    );
    return textResult(summary);
  }
);

server.tool(
  "describe_table",
  "Get the column list and allowed operations for one admin-dashboard table, before reading or writing records.",
  { table: z.string().describe("Table name, e.g. products, blog_posts, site_pages") },
  async ({ table }) => {
    try {
      const cfg = TABLES[table];
      if (!cfg) throw new Error(`Unknown table "${table}". Call list_tables to see options.`);
      return textResult({ table, section: cfg.section, columns: cfg.columns, permissions: cfg.permissions });
    } catch (err) {
      return errorResult(err);
    }
  }
);

server.tool(
  "list_records",
  "List/search rows from an admin-dashboard table, with optional equality filters, ordering, and a row limit.",
  {
    table: z.string(),
    filters: z
      .record(z.union([z.string(), z.number(), z.boolean()]))
      .optional()
      .describe("Exact-match filters, e.g. { is_active: true, category_id: '...' }"),
    order_by: z.string().optional().describe("Column to sort by, e.g. created_at"),
    ascending: z.boolean().optional().default(false),
    limit: z.number().int().min(1).max(200).optional().default(50),
  },
  async ({ table, filters, order_by, ascending, limit }) => {
    try {
      assertAllowed(table, "select");
      let query = supabase.from(table).select("*").limit(limit);
      if (filters) {
        for (const [key, value] of Object.entries(filters)) {
          query = query.eq(key, value);
        }
      }
      if (order_by) query = query.order(order_by, { ascending });
      const { data, error } = await query;
      if (error) throw error;
      return textResult(data);
    } catch (err) {
      return errorResult(err);
    }
  }
);

server.tool(
  "get_record",
  "Fetch a single row by id from an admin-dashboard table.",
  { table: z.string(), id: z.string() },
  async ({ table, id }) => {
    try {
      assertAllowed(table, "select");
      const { data, error } = await supabase.from(table).select("*").eq("id", id).maybeSingle();
      if (error) throw error;
      if (!data) return textResult({ found: false });
      return textResult(data);
    } catch (err) {
      return errorResult(err);
    }
  }
);

server.tool(
  "create_record",
  "Create a new row in an admin-dashboard table (e.g. add a product, blog post, project, category, or brand). Returns the created row.",
  {
    table: z.string(),
    data: z.record(z.any()).describe("Column values for the new row"),
  },
  async ({ table, data }) => {
    try {
      assertAllowed(table, "insert");
      const { data: created, error } = await supabase.from(table).insert(data).select().single();
      if (error) throw error;
      return textResult(created);
    } catch (err) {
      return errorResult(err);
    }
  }
);

server.tool(
  "update_record",
  "Update fields on an existing row in an admin-dashboard table (e.g. edit product price/stock, publish a blog post, edit the About page). Returns the updated row.",
  {
    table: z.string(),
    id: z.string(),
    data: z.record(z.any()).describe("Column values to change"),
  },
  async ({ table, id, data }) => {
    try {
      assertAllowed(table, "update");
      const { data: updated, error } = await supabase
        .from(table)
        .update(data)
        .eq("id", id)
        .select()
        .single();
      if (error) throw error;
      return textResult(updated);
    } catch (err) {
      return errorResult(err);
    }
  }
);

server.tool(
  "delete_record",
  "Delete a row from an admin-dashboard table. Not permitted on transactional tables (orders, order_items, quote_requests) or site_pages.",
  { table: z.string(), id: z.string() },
  async ({ table, id }) => {
    try {
      assertAllowed(table, "delete");
      const { error } = await supabase.from(table).delete().eq("id", id);
      if (error) throw error;
      return textResult({ deleted: true, table, id });
    } catch (err) {
      return errorResult(err);
    }
  }
);

const transport = new StdioServerTransport();
await server.connect(transport);
console.error("Ufuk admin MCP server running on stdio.");
