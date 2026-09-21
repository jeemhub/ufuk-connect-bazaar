import path from "node:path";
import { fileURLToPath } from "node:url";
import dotenv from "dotenv";

// Load the .env sitting next to this file, not one in whatever directory the MCP
// client launched us from. Claude Desktop and Claude Code start servers with
// their own working directory, so `dotenv/config` alone finds nothing and the
// server exits on startup.
dotenv.config({ path: path.join(path.dirname(fileURLToPath(import.meta.url)), ".env") });

import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { createMcpServer } from "../mcp-shared/server.js";

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

const server = createMcpServer({ supabaseUrl: SUPABASE_URL, serviceRoleKey: SUPABASE_SERVICE_ROLE_KEY });
await server.connect(new StdioServerTransport());
console.error("Ufuk admin MCP server running on stdio.");
