# Ufuk admin dashboard MCP server

Exposes the Supabase tables behind the admin dashboard (products, categories,
subcategories, brands, blog posts, projects, the About page, orders, and
quote requests) as MCP tools, so an MCP client (Claude Desktop, Claude Code,
etc.) can list/create/update/delete records directly.

It runs as its own Node process, separate from the Vite site, and talks to
Supabase with the **service role key** (bypasses Row Level Security). Never
put that key in the site's own `.env` (`VITE_`-prefixed vars get bundled
into the browser) — it only ever belongs here.

## 1. Install

```bash
cd mcp-server
npm install
```

## 2. Configure credentials

```bash
cp .env.example .env
```

Fill in `mcp-server/.env`:

- `SUPABASE_URL` = `https://ecbbhathvpxrgvfztzeu.supabase.co` (same project as the site)
- `SUPABASE_SERVICE_ROLE_KEY` = from the Supabase dashboard → Project Settings → API → **service_role** secret key

## 3. Register with your MCP client

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
      "args": ["/Users/JeemHome/ufuk/ufuk-connect-bazaar/mcp-server/index.js"],
      "env": {
        "SUPABASE_URL": "https://ecbbhathvpxrgvfztzeu.supabase.co",
        "SUPABASE_SERVICE_ROLE_KEY": "paste-the-service-role-key-here"
      }
    }
  }
}
```

(If you already created `mcp-server/.env`, the `env` block above is
optional — the server loads it automatically via `dotenv`.)

Restart the client after adding the server.

## Tools

- `list_tables` — every editable section and what operations are allowed on it
- `describe_table` — columns for one table
- `list_records` — search/list rows (equality filters, sort, limit)
- `get_record` — fetch one row by id
- `create_record` — insert a row
- `update_record` — edit a row
- `delete_record` — remove a row

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

Orders/order-items/quotes are read + status-update only, so totals, stock
side effects, and audit trails stay consistent with the app's own logic.

To add another table, edit `tables.js`.
