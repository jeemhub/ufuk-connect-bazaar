import { handleMcpRequest } from "../../mcp-shared/http.js";

/**
 * The same MCP endpoint with the secret as a path segment:
 * https://<site>/api/mcp/<MCP_SECRET>
 *
 * For clients whose connector dialog accepts only a URL (claude.ai without the
 * request-header option, ChatGPT). It is weaker than the header form — a URL
 * ends up in request logs and history — so prefer the header wherever possible.
 */
export default async function handler(req, res) {
  await handleMcpRequest(req, res, { pathSecret: req.query?.secret });
}
