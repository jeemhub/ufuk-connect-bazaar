// Edge function: import-products
// Applies a bulk Excel-driven update to the products table. UPDATE ONLY -
// rows whose id doesn't exist are reported as skipped, never inserted.
// Runs with the service_role key (available automatically inside Supabase
// edge functions) so the admin never needs to handle that key themselves.
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

declare const Deno: any;

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Fixed, non-localized schema contract shared with the export feature.
const EXPECTED_HEADER = [
  "id",
  "name_ar",
  "name_en",
  "data_name",
  "description_ar",
  "description_en",
  "category",
  "brand",
  "price_single",
  "price_wholesale",
  "price_agency",
  "stock",
];

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const BATCH_SIZE = 200;
const MAX_ROWS = 20000;

type Item = { id: string; [column: string]: unknown };
type ValidationError = { row: number; id?: string; reason: string };

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

function isBlank(v: unknown): boolean {
  return v === null || v === undefined || String(v).trim() === "";
}

// Prices/stock are whole IQD amounts (bigint/int columns) - round to int.
function parseNonNegativeInt(v: unknown): number | null {
  const n = Number(String(v).replace(/,/g, "").trim());
  if (!Number.isFinite(n) || n < 0) return null;
  return Math.round(n);
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
    const SERVICE_ROLE = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY")!;

    // ===== AUTH CHECK =====
    // Never trust the frontend: re-verify the caller is an authenticated
    // admin here, using their own JWT, before touching any data.
    const authHeader = req.headers.get("Authorization") ?? "";
    const token = authHeader.replace(/^Bearer\s+/i, "").trim();
    if (!token) {
      return json({ error: "Unauthorized" }, 401);
    }
    const userClient = createClient(SUPABASE_URL, ANON_KEY, {
      global: { headers: { Authorization: `Bearer ${token}` } },
    });
    const { data: userData, error: userErr } = await userClient.auth.getUser(token);
    if (userErr || !userData?.user) {
      return json({ error: "Unauthorized" }, 401);
    }
    const { data: isAdmin, error: roleErr } = await userClient.rpc("has_role", {
      _user_id: userData.user.id,
      _role: "admin",
    });
    if (roleErr || !isAdmin) {
      return json({ error: "Forbidden: admin role required" }, 403);
    }

    // ===== PARSE + VALIDATE REQUEST SHAPE =====
    const body = await req.json().catch(() => null);
    if (!body || !Array.isArray(body.header) || !Array.isArray(body.rows)) {
      return json({ error: "Expected { header: string[], rows: object[] }" }, 400);
    }
    const header: unknown[] = body.header;
    const rows: Record<string, unknown>[] = body.rows;

    const headerOk =
      header.length === EXPECTED_HEADER.length &&
      EXPECTED_HEADER.every((col, i) => String(header[i] ?? "").trim() === col);
    if (!headerOk) {
      return json(
        {
          error:
            "Column headers don't match the expected template. Re-download the export to get the correct columns.",
          expected: EXPECTED_HEADER,
          received: header,
        },
        400
      );
    }

    if (rows.length === 0) {
      return json({ updated: 0, skipped: [], errors: [] });
    }
    if (rows.length > MAX_ROWS) {
      return json({ error: `Too many rows in one file (max ${MAX_ROWS}).` }, 400);
    }

    const supabase = createClient(SUPABASE_URL, SERVICE_ROLE);

    const { data: catRows, error: catErr } = await supabase.from("categories").select("id,key");
    if (catErr) throw catErr;
    const categoryByKey = new Map<string, string>();
    for (const c of (catRows ?? []) as { id: string; key: string }[]) {
      categoryByKey.set(String(c.key).trim().toLowerCase(), c.id);
    }

    // ===== PER-ROW VALIDATION / TRANSFORM =====
    // data_name is read from nowhere here on purpose - it is never written.
    const toApply: Item[] = [];
    const validationErrors: ValidationError[] = [];

    rows.forEach((r, idx) => {
      const rowNum = idx + 2; // +1 for 1-indexing, +1 because row 1 is the header
      const allBlank = EXPECTED_HEADER.every((k) => isBlank(r[k]));
      if (allBlank) return; // silently ignore fully empty rows

      const rawId = r["id"];
      if (isBlank(rawId)) {
        validationErrors.push({ row: rowNum, reason: "Missing id" });
        return;
      }
      const id = String(rawId).trim();
      if (!UUID_RE.test(id)) {
        validationErrors.push({ row: rowNum, id, reason: "id is not a valid UUID" });
        return;
      }

      const item: Item = { id };

      if (!isBlank(r["name_ar"])) item.name_ar = String(r["name_ar"]).trim();
      if (!isBlank(r["name_en"])) item.name_en = String(r["name_en"]).trim();
      if (!isBlank(r["description_ar"])) item.desc_ar = String(r["description_ar"]).trim();
      if (!isBlank(r["description_en"])) item.desc_en = String(r["description_en"]).trim();
      if (!isBlank(r["brand"])) item.brand = String(r["brand"]).trim();

      if (!isBlank(r["category"])) {
        const key = String(r["category"]).trim().toLowerCase();
        const catId = categoryByKey.get(key);
        if (!catId) {
          validationErrors.push({ row: rowNum, id, reason: `Unknown category "${r["category"]}"` });
          return;
        }
        item.category_id = catId;
      }

      const priceFields: [string, string][] = [
        ["price_single", "price_iqd"],
        ["price_wholesale", "price_wholesale_iqd"],
        ["price_agency", "price_dealer_iqd"],
      ];
      for (const [col, dbCol] of priceFields) {
        if (isBlank(r[col])) continue;
        const n = parseNonNegativeInt(r[col]);
        if (n === null) {
          validationErrors.push({ row: rowNum, id, reason: `Invalid ${col} value "${r[col]}"` });
          return;
        }
        item[dbCol] = n;
      }

      if (!isBlank(r["stock"])) {
        const n = parseNonNegativeInt(r["stock"]);
        if (n === null) {
          validationErrors.push({ row: rowNum, id, reason: `Invalid stock value "${r["stock"]}"` });
          return;
        }
        item.stock = n;
      }

      toApply.push(item);
    });

    // ===== APPLY IN BATCHES, EACH BATCH ONE TRANSACTION =====
    let updatedCount = 0;
    const notFound = new Map<string, string>();
    const applyErrors: { id?: string; reason: string }[] = [];

    for (let i = 0; i < toApply.length; i += BATCH_SIZE) {
      const batch = toApply.slice(i, i + BATCH_SIZE);
      const { data, error } = await supabase.rpc("import_products_apply", { p_items: batch });
      if (error) {
        for (const it of batch) applyErrors.push({ id: it.id, reason: error.message });
        continue;
      }
      const result = data as {
        updated_ids: string[];
        not_found_ids: string[];
        errors: { id: string; reason: string }[];
      };
      updatedCount += (result.updated_ids ?? []).length;
      for (const id of result.not_found_ids ?? []) notFound.set(id, "id not found in database");
      for (const e of result.errors ?? []) applyErrors.push(e);
    }

    return json({
      updated: updatedCount,
      skipped: Array.from(notFound, ([id, reason]) => ({ id, reason })),
      errors: [...validationErrors, ...applyErrors.map((e) => ({ id: e.id, reason: e.reason }))],
    });
  } catch (e) {
    console.error("import-products failed", e);
    return json({ error: String(e) }, 500);
  }
});
