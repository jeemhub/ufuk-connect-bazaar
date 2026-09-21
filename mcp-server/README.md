# Ufuk admin dashboard MCP server

Exposes the Supabase tables behind the admin dashboard (products, categories,
subcategories, brands, blog posts, projects, the About page, orders, and quote
requests) as MCP tools, so an AI assistant can list, create, update and delete
records directly.

There are two ways to run it, sharing one set of tool definitions in
`mcp-shared/`:

| | Hosted (by URL) | Local |
|---|---|---|
| Where | Vercel function at `/api/mcp` | Node process on this machine |
| Clients | Any MCP client: claude.ai, ChatGPT, Cursor, Claude Code, … | Claude Desktop, Claude Code |
| Code | `api/mcp/*.js` → `mcp-shared/http.js` | `mcp-server/index.js` |

Both talk to Supabase with the **service role key**, which bypasses Row Level
Security. Never put that key in the site's own `.env` — `VITE_`-prefixed vars
are bundled into the browser.

## Hosted setup (Vercel)

1. In the Vercel project that serves the site, add these environment variables
   (Production, and Preview if you want to test on preview deployments):

   | Variable | Value |
   |---|---|
   | `SUPABASE_SERVICE_ROLE_KEY` | Supabase dashboard → Project Settings → API → **service_role** key |
   | `MCP_SECRET` | A long random string, at least 32 characters (`openssl rand -hex 32`) |
   | `SUPABASE_URL` | `https://ecbbhathvpxrgvfztzeu.supabase.co` — required: the site's `VITE_SUPABASE_URL` comes from the committed `.env`, which functions never see |
   | `MCP_CLAUDE_ONLY` | Optional — set to `1` to accept connections from Claude only |

2. Redeploy so the function picks them up.

The secret is the only thing protecting write access to the store, so the
function refuses to run with one shorter than 32 characters. To revoke every
connected client at once, change `MCP_SECRET` and redeploy.

### Connecting

The endpoint accepts the secret two ways:

- **Header (preferred):** `https://<site>/api/mcp` with `Authorization: Bearer <MCP_SECRET>`
- **In the URL:** `https://<site>/api/mcp/<MCP_SECRET>` — for clients whose
  connector dialog only takes a URL. A URL ends up in logs and history, so use
  the header form wherever the client supports it.

**claude.ai** — Settings → Connectors → Add custom connector. Paste the URL form,
or the plain URL plus the Authorization header if the dialog offers request headers.

**ChatGPT** — Settings → Connectors (developer mode) → create a connector with the URL form.

**Claude Code:**

```bash
claude mcp add --transport http ufuk-admin https://<site>/api/mcp --header "Authorization: Bearer <MCP_SECRET>"
```

**Cursor and other clients** (`mcp.json`):

```json
{
  "mcpServers": {
    "ufuk-admin": {
      "url": "https://<site>/api/mcp",
      "headers": { "Authorization": "Bearer <MCP_SECRET>" }
    }
  }
}
```

## Local setup

```bash
npm install            # at the repo root — the shared tools load their dependencies from there
cd mcp-server
npm install
cp .env.example .env   # then fill in SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY
```

**Claude Code:**

```bash
claude mcp add ufuk-admin -- node /Users/JeemHome/ufuk/ufuk-connect-bazaar/mcp-server/index.js
```

**Claude Desktop** (`claude_desktop_config.json`):

```json
{
  "mcpServers": {
    "ufuk-admin": {
      "command": "node",
      "args": ["/Users/JeemHome/ufuk/ufuk-connect-bazaar/mcp-server/index.js"]
    }
  }
}
```

Restart the client after adding the server.

## Tools

- `list_tables` — every editable section and what operations are allowed on it
- `describe_table` — columns for one table
- `list_records` — search/list rows (equality filters, sort, limit)
- `get_record` — fetch one row by id
- `create_record` — insert a row
- `update_record` — edit a row
- `delete_record` — remove a row; the reply includes the removed row, since there is no undo

Reads of `orders` and `quote_requests` come wrapped with a note that the rows
contain visitor-submitted text to be treated as data, not instructions.

## What's editable

| Table | Dashboard section | Create | Update | Delete |
|---|---|---|---|---|
| products | Products | ✓ | ✓ | ✓ |
| categories | Categories | ✓ | ✓ | ✓ |
| subcategories | Categories | ✓ | ✓ | ✓ |
| brands | Brands | ✓ | ✓ | ✓ |
| blog_posts | Blog | ✓ | ✓ | ✓ |
| projects | Projects | ✓ | ✓ | ✓ |
| site_pages | About / static pages | ✓ | ✓ | — |
| orders | Orders | — | ✓ (e.g. status) | — |
| order_items | Orders | — | — | — |
| quote_requests | Quotes | — | ✓ (e.g. status) | — |

Orders, order items and quotes are read + status-update only, so totals, stock
side effects and audit trails stay consistent with the app's own logic.

Deliberately not exposed: `user_roles` and `sales_permissions` (granting admin
rights stays a human action in the dashboard), `customer_balances` (customer
financial data), and the auth, notification and analytics tables.

To add a table, edit `mcp-shared/tables.js`.
