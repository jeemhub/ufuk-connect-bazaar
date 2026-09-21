import { createHash, timingSafeEqual } from "node:crypto";
import { StreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/streamableHttp.js";
import { createMcpServer } from "./server.js";

/**
 * The secret is the only thing standing between the internet and write access
 * to the store, so refuse to run with one short enough to guess.
 */
const MIN_SECRET_LENGTH = 32;

/**
 * Anthropic's outbound traffic to connectors comes from one published range.
 * Set MCP_CLAUDE_ONLY=1 to refuse everything else. It is off by default because
 * this endpoint is meant to be reachable from any MCP client, not just Claude.
 * https://platform.claude.com/docs/en/api/ip-addresses
 */
const ANTHROPIC_EGRESS = "160.79.104.0/21";

/**
 * Browser-based MCP clients (inspectors, web IDEs) send a CORS preflight before
 * the real request. Allowing any origin is safe here because authorization is a
 * bearer secret, never a cookie the browser would attach on its own.
 */
const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Authorization, Content-Type, Accept, Mcp-Session-Id, Mcp-Protocol-Version",
  "Access-Control-Expose-Headers": "Mcp-Session-Id",
};

function ipToInt(ip) {
  const parts = ip.trim().split(".");
  if (parts.length !== 4) return null;
  let n = 0;
  for (const p of parts) {
    const v = Number(p);
    if (!Number.isInteger(v) || v < 0 || v > 255) return null;
    n = n * 256 + v;
  }
  return n;
}

function inCidr(ip, cidr) {
  const [base, bitsRaw] = cidr.split("/");
  const bits = Number(bitsRaw);
  const ipInt = ipToInt(ip);
  const baseInt = ipToInt(base);
  if (ipInt === null || baseInt === null) return false;
  const mask = bits === 0 ? 0 : (0xffffffff << (32 - bits)) >>> 0;
  return (ipInt & mask) === (baseInt & mask);
}

/**
 * The caller's address. Vercel overwrites `x-forwarded-for` rather than
 * appending to what the client sent, so its first entry can be trusted there;
 * on a platform without that guarantee the Claude-only check would be spoofable.
 */
function clientIp(req) {
  const fwd = req.headers["x-forwarded-for"];
  if (typeof fwd === "string" && fwd.length) return fwd.split(",")[0].trim();
  return req.socket?.remoteAddress?.replace(/^::ffff:/, "") ?? "";
}

/** Compare digests so neither the secret's content nor its length leaks through timing. */
function secretMatches(given, expected) {
  if (typeof given !== "string" || !given) return false;
  const a = createHash("sha256").update(given).digest();
  const b = createHash("sha256").update(expected).digest();
  return timingSafeEqual(a, b);
}

/**
 * Handle one MCP request over Streamable HTTP.
 *
 * The transport runs stateless: every request builds its own server and
 * transport and throws them away. A serverless function keeps no memory between
 * invocations, so a session id held by one container means nothing to the next.
 *
 * `pathSecret` is set when the secret arrived as a URL path segment rather than
 * an Authorization header.
 */
export async function handleMcpRequest(req, res, { pathSecret } = {}) {
  for (const [key, value] of Object.entries(CORS_HEADERS)) res.setHeader(key, value);
  if (req.method === "OPTIONS") {
    res.status(204).end();
    return;
  }

  // The site's own VITE_SUPABASE_URL lives in the committed .env, which Vite
  // reads at build time but a serverless function never sees — so SUPABASE_URL
  // must be set in Vercel. The fallback only helps if VITE_ is set there too.
  const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
  const { SUPABASE_SERVICE_ROLE_KEY, MCP_SECRET, MCP_CLAUDE_ONLY } = process.env;

  // Name exactly what is missing: a generic message sent the setup down the
  // wrong path once already.
  const missing = [
    !supabaseUrl && "SUPABASE_URL",
    !SUPABASE_SERVICE_ROLE_KEY && "SUPABASE_SERVICE_ROLE_KEY",
    !MCP_SECRET && "MCP_SECRET",
  ].filter(Boolean);
  if (missing.length) {
    res.status(500).json({ error: `Server is missing environment variables: ${missing.join(", ")}.` });
    return;
  }
  if (MCP_SECRET.length < MIN_SECRET_LENGTH) {
    res.status(500).json({ error: `MCP_SECRET must be at least ${MIN_SECRET_LENGTH} characters.` });
    return;
  }

  if (MCP_CLAUDE_ONLY === "1" && !inCidr(clientIp(req), ANTHROPIC_EGRESS)) {
    res.status(403).json({ error: "Forbidden." });
    return;
  }

  const auth = req.headers.authorization ?? "";
  const bearer = auth.startsWith("Bearer ") ? auth.slice(7).trim() : "";
  if (!secretMatches(bearer || pathSecret || "", MCP_SECRET)) {
    // 401 rather than 403: the request was understood but unauthenticated,
    // which is what an MCP client expects to see.
    res.status(401).json({ error: "Unauthorized." });
    return;
  }

  const server = createMcpServer({ supabaseUrl, serviceRoleKey: SUPABASE_SERVICE_ROLE_KEY });
  const transport = new StreamableHTTPServerTransport({ sessionIdGenerator: undefined });

  res.on("close", () => {
    transport.close();
    server.close();
  });

  await server.connect(transport);
  await transport.handleRequest(req, res, req.body);
}
