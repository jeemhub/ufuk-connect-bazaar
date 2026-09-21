import { handleMcpRequest } from "../../mcp-shared/http.js";

/**
 * MCP endpoint: https://<site>/api/mcp
 *
 * Authenticate with a header: `Authorization: Bearer <MCP_SECRET>`. Clients that
 * cannot set headers use /api/mcp/<secret> instead.
 */
export default async function handler(req, res) {
  await handleMcpRequest(req, res);
}
