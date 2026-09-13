# Customer Balances Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add an authorization-protected admin section that atomically imports XLS/XLSX customer balances and provides server-side Arabic-friendly search, filtering, and pagination.

**Architecture:** A Supabase Edge Function validates and parses the complete workbook on the server, then calls one PostgreSQL transaction to replace the dataset. PostgreSQL stores exact `numeric` amounts, enforces the existing admin/sales-permission model, and exposes one paginated search RPC. The React dashboard consumes those APIs through React Query and existing UI components.

**Tech Stack:** React 18, TypeScript, Vite, Vitest, Testing Library, Supabase Auth/PostgreSQL/RLS/Edge Functions, Deno, SheetJS `xlsx`, Tailwind, shadcn-style components.

**Spec:** `docs/superpowers/specs/2026-09-13-customer-balances-design.md`

## Global Constraints

- The section route is `/admin/customer-balances` and its Arabic label is exactly `أرصدة العملاء`.
- An admin always has access; a sales user requires `can_manage_customer_balances`.
- XLS and XLSX are parsed on the server. No browser-side workbook parsing is permitted for this feature.
- Maximum file size is 5 MiB and maximum record count is 50,000.
- Required headers are exactly `الرقم`, `الاسم`, `مدين دولار`, `دائن دولار`, `مدين دينار`, `دائن دينار` after header-only trimming.
- Customer names and numbers are preserved; only separate search values are normalized.
- PostgreSQL `numeric` stores amounts and the API returns them as decimal strings.
- A failed import must leave both existing balances and import metadata unchanged.
- The supplied `/Users/JeemHome/Downloads/1111.xls` is a verification fixture, not application source data.
- Do not modify unrelated files or include the existing `package-lock.json` and `.claude/` changes in feature commits.

---

### Task 1: Exact decimal, search, and filter domain helpers

**Files:**
- Create: `src/features/customer-balances/model.ts`
- Test: `src/features/customer-balances/model.test.ts`

**Interfaces:**
- Produces: `normalizeBalanceSearch(value: string): string`
- Produces: `formatBalanceAmount(value: string): string`
- Produces: `getPageCount(total: number, pageSize: number): number`
- Produces: `BalanceType`, `BalanceCurrency`, `CustomerBalanceRow`, `CustomerBalanceSearchResponse`, and `CustomerBalanceImportState`.

- [ ] **Step 1: Write failing helper tests**

```ts
expect(normalizeBalanceSearch("  Ecolog   شركة ")).toBe("ecolog شركة");
expect(formatBalanceAmount("1234567.125")).toBe("1,234,567.125");
expect(formatBalanceAmount("0.000")).toBe("—");
expect(getPageCount(101, 50)).toBe(3);
```

- [ ] **Step 2: Verify RED**

Run: `npm test -- src/features/customer-balances/model.test.ts`

Expected: FAIL because the module does not exist.

- [ ] **Step 3: Implement minimal helpers and types**

```ts
export type BalanceType = "all" | "debit" | "credit";
export type BalanceCurrency = "all" | "usd" | "iqd";

export function normalizeBalanceSearch(value: string) {
  return value.trim().replace(/\s+/gu, " ").toLocaleLowerCase("en");
}

export function formatBalanceAmount(value: string) {
  const normalized = value.trim();
  if (!normalized || /^[-+]?0+(?:\.0+)?$/.test(normalized)) return "—";
  const [integer, fraction] = normalized.split(".");
  const formatted = BigInt(integer).toLocaleString("en-US");
  return fraction === undefined ? formatted : `${formatted}.${fraction}`;
}
```

Define API row values as strings, never numbers.

- [ ] **Step 4: Verify GREEN**

Run: `npm test -- src/features/customer-balances/model.test.ts`

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/features/customer-balances/model.ts src/features/customer-balances/model.test.ts
git commit -m "feat: add customer balance domain helpers"
```

### Task 2: Workbook validation and parsing

**Files:**
- Create: `supabase/functions/import-customer-balances/importer.ts`
- Create: `supabase/functions/import-customer-balances/deno.json`
- Test: `src/features/customer-balances/importer.test.ts`

**Interfaces:**
- Produces: `parseCustomerBalanceWorkbook(input: { bytes: Uint8Array; fileName: string; mimeType: string }): CustomerBalanceImportRow[]`
- Produces: `CustomerBalanceImportError` with stable `code` and Arabic `message`.
- Consumes: the installed `xlsx` package in Vitest and maps `xlsx` to `npm:xlsx@0.18.5` in Deno.

- [ ] **Step 1: Write failing binary-format tests**

Build in-memory workbooks with `XLSX.write` using `bookType: "xls"` and `bookType: "xlsx"`. Assert both return the same literal rows, blank amounts return `"0"`, and `12.125` returns `"12.125"`.

```ts
const rows = parseCustomerBalanceWorkbook({
  bytes: makeWorkbook("xls", VALID_ROWS),
  fileName: "balances.xls",
  mimeType: "application/vnd.ms-excel",
});
expect(rows[0]).toEqual({
  customer_number: "101",
  customer_name: " أحمد ",
  debit_usd: "12.125",
  credit_usd: "0",
  debit_iqd: "1000",
  credit_iqd: "0",
});
```

- [ ] **Step 2: Verify RED**

Run: `npm test -- src/features/customer-balances/importer.test.ts`

Expected: FAIL because the importer does not exist.

- [ ] **Step 3: Implement signature, workbook, and row validation**

Use `XLSX.read(bytes, { type: "array", cellFormula: true, cellHTML: false })`. Check OLE bytes `D0 CF 11 E0 A1 B1 1A E1` for XLS and ZIP bytes `50 4B 03 04` for XLSX before parsing. Reject any populated cell with an `f` property. Use `sheet_to_json(..., { header: 1, raw: true, defval: null, blankrows: true })`, preserve name/number text, convert finite amount cells to canonical decimal strings, ignore fully blank rows, and reject missing IDs, duplicate IDs, invalid amounts, empty datasets, or more than 50,000 records.

Configure Deno resolution:

```json
{
  "imports": {
    "xlsx": "npm:xlsx@0.18.5"
  }
}
```

- [ ] **Step 4: Add malformed-input tests**

Assert stable errors for missing/reordered headers, `.csv`, XLS bytes named `.xlsx`, files above 5 MiB, formula cells, duplicate numbers, missing names, invalid amount text, empty sheets, and 50,001 records.

- [ ] **Step 5: Verify GREEN with supplied XLS**

Run: `npm test -- src/features/customer-balances/importer.test.ts`

Then run a focused Node/Vitest fixture assertion that parses `/Users/JeemHome/Downloads/1111.xls` and confirms 1,885 records without logging customer rows.

Expected: all importer tests pass and the supplied file count is 1,885.

- [ ] **Step 6: Commit**

```bash
git add supabase/functions/import-customer-balances/importer.ts supabase/functions/import-customer-balances/deno.json src/features/customer-balances/importer.test.ts
git commit -m "feat: validate customer balance workbooks"
```

### Task 3: Database schema, permissions, atomic replacement, and search

**Files:**
- Create: `supabase/migrations/20260913090000_customer_balances.sql`
- Create: `supabase/tests/customer_balances.sql`

**Interfaces:**
- Produces: `sales_permissions.can_manage_customer_balances`.
- Produces: `public.can_manage_customer_balances(uuid): boolean`.
- Produces: `public.replace_customer_balances(text, jsonb): jsonb`.
- Produces: `public.search_customer_balances(text, text, text, integer, integer)`.
- Produces tables `customer_balances` and `customer_balance_import_state`.

- [ ] **Step 1: Write failing pgTAP tests**

Create admin, permitted-sales, unauthorized-sales, and ordinary authenticated fixtures. Use `set_config('request.jwt.claim.sub', user_id::text, true)` to switch callers. Assert:

```sql
select throws_ok(
  $$ select public.search_customer_balances('', 'all', 'all', 1, 50) $$,
  '42501', 'forbidden'
);
```

Seed one old row, invoke a replacement containing a duplicate or invalid numeric, catch the exception, and assert the old row and old metadata remain. Invoke a valid replacement and assert only new rows exist. Cover all balance/currency combinations, normalized Arabic/name/number searches, counts, page 2, unauthorized replacement, and lock conflict.

- [ ] **Step 2: Verify RED**

Run: `supabase test db supabase/tests/customer_balances.sql`

Expected: FAIL because the tables and functions do not exist. If the local Supabase stack is not running, run `supabase start` first and record any Docker prerequisite as an environment limitation.

- [ ] **Step 3: Implement migration**

The migration must:

```sql
alter table public.sales_permissions
  add column if not exists can_manage_customer_balances boolean not null default false;

create extension if not exists pg_trgm with schema extensions;
```

Update `has_sales_perm`, `get_my_sales_permissions`, `admin_set_sales_permissions`, and `admin_list_users` without dropping existing behavior. Create both tables with RLS and policies using:

```sql
public.has_role(auth.uid(), 'admin'::public.app_role)
or public.has_sales_perm(auth.uid(), 'can_manage_customer_balances')
```

`replace_customer_balances` must be `security definer`, set `search_path = public, pg_temp`, call `pg_try_advisory_xact_lock(hashtext('replace_customer_balances'))`, stage with `jsonb_to_recordset`, validate counts and duplicates, delete only after staging succeeds, insert staged rows, and update metadata before returning `jsonb_build_object('imported', count)`.

`search_customer_balances` must validate enum-like parameters and bounded pages, apply static SQL predicates, return `count(*) over()` as `total_count`, and cast all four numeric columns to text.

Revoke functions from `public` and `anon`; grant only the required functions to `authenticated`.

- [ ] **Step 4: Verify GREEN**

Run: `supabase db reset` followed by `supabase test db supabase/tests/customer_balances.sql`.

Expected: migration succeeds and every pgTAP assertion passes.

- [ ] **Step 5: Commit**

```bash
git add supabase/migrations/20260913090000_customer_balances.sql supabase/tests/customer_balances.sql
git commit -m "feat: add atomic customer balance storage"
```

### Task 4: Authorized Edge Function upload endpoint

**Files:**
- Create: `supabase/functions/import-customer-balances/handler.ts`
- Create: `supabase/functions/import-customer-balances/index.ts`
- Modify: `supabase/config.toml`
- Test: `src/features/customer-balances/upload-handler.test.ts`

**Interfaces:**
- Consumes: `parseCustomerBalanceWorkbook` from Task 2.
- Consumes: `replace_customer_balances` from Task 3.
- Produces: `handleImportCustomerBalances(req: Request, deps: HandlerDependencies): Promise<Response>`.

- [ ] **Step 1: Write failing endpoint tests**

Use dependency injection for authentication, permission lookup, parser, and RPC. Test 401 without a bearer token, 403 without permission, 400 without one `file`, 409 for import lock conflict, and 200 with `{ imported: 1885 }`. Assert unauthorized requests never call the parser and failed parsing never calls the replacement RPC.

- [ ] **Step 2: Verify RED**

Run: `npm test -- src/features/customer-balances/upload-handler.test.ts`

Expected: FAIL because the handler does not exist.

- [ ] **Step 3: Implement handler and Deno entry point**

The handler reads `FormData`, verifies exactly one `File`, checks `file.size <= 5 * 1024 * 1024`, obtains bytes once, parses all rows, and calls:

```ts
await userClient.rpc("replace_customer_balances", {
  file_name: sanitizeBaseName(file.name),
  rows,
});
```

The entry point creates the Supabase user client from `SUPABASE_URL`, `SUPABASE_ANON_KEY`, and the caller's authorization header. It verifies `auth.getUser()` and calls `has_role`/`has_sales_perm` through a dedicated authorization RPC or `can_manage_customer_balances(auth.uid())`. Return JSON with Arabic-safe stable errors and CORS headers. Add:

```toml
[functions.import-customer-balances]
verify_jwt = true
```

- [ ] **Step 4: Verify GREEN**

Run: `npm test -- src/features/customer-balances/upload-handler.test.ts src/features/customer-balances/importer.test.ts`

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add supabase/functions/import-customer-balances supabase/config.toml src/features/customer-balances/upload-handler.test.ts
git commit -m "feat: add protected balance upload endpoint"
```

### Task 5: Extend frontend authorization and sales permission editor

**Files:**
- Modify: `src/auth/AuthProvider.tsx`
- Modify: `src/pages/admin/Users.tsx`
- Modify: `src/integrations/supabase/types.ts`
- Test: `src/features/customer-balances/permissions.test.tsx`

**Interfaces:**
- Adds `can_manage_customer_balances: boolean` to `SalesPermissions` and `EMPTY_PERMS`.
- Adds `_can_manage_customer_balances` to the `admin_set_sales_permissions` call.

- [ ] **Step 1: Write failing permission editor and context tests**

Render the relevant authorization consumer with admin, permitted-sales, unauthorized-sales, and ordinary-user values. Assert the new checkbox label is present in the sales dialog and its RPC payload contains the exact boolean field.

- [ ] **Step 2: Verify RED**

Run: `npm test -- src/features/customer-balances/permissions.test.tsx`

Expected: FAIL because the permission is absent.

- [ ] **Step 3: Extend existing permission paths**

Add the property to context types/defaults, add the checkbox tuple:

```ts
["can_manage_customer_balances", "أرصدة العملاء"]
```

and include `_can_manage_customer_balances: !!salesPermsForm.can_manage_customer_balances` in `saveSales`. Update generated-style Supabase types only for the new column and changed RPC signature.

- [ ] **Step 4: Verify GREEN**

Run: `npm test -- src/features/customer-balances/permissions.test.tsx`

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/auth/AuthProvider.tsx src/pages/admin/Users.tsx src/integrations/supabase/types.ts src/features/customer-balances/permissions.test.tsx
git commit -m "feat: add customer balance sales permission"
```

### Task 6: Balance API client and query state

**Files:**
- Create: `src/features/customer-balances/api.ts`
- Create: `src/features/customer-balances/useCustomerBalances.ts`
- Test: `src/features/customer-balances/api.test.ts`

**Interfaces:**
- Produces: `fetchCustomerBalances(params): Promise<CustomerBalanceSearchResponse>`.
- Produces: `fetchCustomerBalanceImportState(): Promise<CustomerBalanceImportState | null>`.
- Produces: `uploadCustomerBalances(file: File): Promise<{ imported: number }>`.
- Produces: `useCustomerBalances(filters)` and `useCustomerBalanceImportState()`.

- [ ] **Step 1: Write failing API mapping tests**

Assert the search RPC receives normalized query, filter values, page, and page size; rows retain amount strings; total count comes from the first result row; upload uses `FormData`; and an empty response returns `{ rows: [], total: 0 }`.

- [ ] **Step 2: Verify RED**

Run: `npm test -- src/features/customer-balances/api.test.ts`

Expected: FAIL because the API module does not exist.

- [ ] **Step 3: Implement minimal API and React Query hooks**

Use the existing Supabase client and `supabase.functions.invoke("import-customer-balances", { body: formData })`. Use query keys containing normalized query, balance type, currency, page, and page size. Keep the 250ms debounce in the page component so the API functions remain deterministic.

- [ ] **Step 4: Verify GREEN**

Run: `npm test -- src/features/customer-balances/api.test.ts`

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/features/customer-balances/api.ts src/features/customer-balances/useCustomerBalances.ts src/features/customer-balances/api.test.ts
git commit -m "feat: add customer balance data client"
```

### Task 7: Admin page, upload confirmation, filters, table, and pagination

**Files:**
- Create: `src/pages/admin/CustomerBalances.tsx`
- Create: `src/features/customer-balances/CustomerBalancesTable.tsx`
- Create: `src/features/customer-balances/CustomerBalanceUpload.tsx`
- Test: `src/features/customer-balances/CustomerBalances.test.tsx`

**Interfaces:**
- Consumes: model helpers and API hooks from Tasks 1 and 6.
- Produces: the complete Arabic dashboard page.

- [ ] **Step 1: Write failing page behavior tests**

Test the exact title, description, search placeholder, filter options, reset label, six headers, result count, empty-state copy, `—` zero display, thousands/decimal formatting, page navigation, and sticky/responsive table classes. Use fake timers to prove the query updates only after 250ms.

Test upload behavior: accepts `.xls,.xlsx`, displays selected name, opens the exact confirmation sentence, disables controls during mutation, shows `تم تحديث ملف الأرصدة بنجاح`, refreshes metadata/results, and preserves the current result view on a rejected upload.

- [ ] **Step 2: Verify RED**

Run: `npm test -- src/features/customer-balances/CustomerBalances.test.tsx`

Expected: FAIL because the components do not exist.

- [ ] **Step 3: Implement upload and page controls**

Use existing `Button`, `Input`, `Select`, `AlertDialog`, `Table`, and pagination components. Keep upload state separate from search state. Reset page to 1 when the debounced query or either filter changes. Disable the upload button and file input while mutation is pending.

- [ ] **Step 4: Implement table and exact formatting**

Use `overflow-x-auto`, a bounded vertical scroll container, `sticky top-0`, `text-start` for names, and `tabular-nums` for amounts. Debit uses a muted amber tone and credit a muted emerald tone. Do not add charts, KPI cards, or hidden mobile columns.

- [ ] **Step 5: Verify GREEN**

Run: `npm test -- src/features/customer-balances/CustomerBalances.test.tsx`

Expected: PASS with no warnings.

- [ ] **Step 6: Commit**

```bash
git add src/pages/admin/CustomerBalances.tsx src/features/customer-balances/CustomerBalancesTable.tsx src/features/customer-balances/CustomerBalanceUpload.tsx src/features/customer-balances/CustomerBalances.test.tsx
git commit -m "feat: build customer balances admin page"
```

### Task 8: Protected route and conditional navigation

**Files:**
- Modify: `src/App.tsx`
- Modify: `src/components/admin/AdminSidebar.tsx`
- Test: `src/features/customer-balances/navigation.test.tsx`

**Interfaces:**
- Consumes: `can_manage_customer_balances` from Task 5.
- Produces: lazy route `/admin/customer-balances` and authorized sidebar entry.

- [ ] **Step 1: Write failing route/navigation tests**

Assert an admin and permitted sales user see the link. Assert unauthorized sales and ordinary users do not. Assert direct route access renders 403 for a signed-in unauthorized user and redirects anonymous users to `/auth`.

- [ ] **Step 2: Verify RED**

Run: `npm test -- src/features/customer-balances/navigation.test.tsx`

Expected: FAIL because the route and item do not exist.

- [ ] **Step 3: Add route and navigation item**

```tsx
const CustomerBalances = lazy(() => import("./pages/admin/CustomerBalances"));

<Route
  path="customer-balances"
  element={
    <ProtectedRoute requirePerm="can_manage_customer_balances">
      <CustomerBalances />
    </ProtectedRoute>
  }
/>
```

Add a `WalletCards` or `TableProperties` sidebar icon and show it with `can("can_manage_customer_balances")`.

- [ ] **Step 4: Verify GREEN**

Run: `npm test -- src/features/customer-balances/navigation.test.tsx`

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/App.tsx src/components/admin/AdminSidebar.tsx src/features/customer-balances/navigation.test.tsx
git commit -m "feat: protect customer balance navigation"
```

### Task 9: Full verification and visual QA

**Files:**
- Modify only files required to fix failures found in this task.

**Interfaces:**
- Verifies all prior task deliverables together.

- [ ] **Step 1: Run all automated checks**

```bash
npm test
npm run lint
npm run build
supabase db reset
supabase test db supabase/tests/customer_balances.sql
```

Expected: all commands exit 0. If local Supabase cannot run because Docker is unavailable, record that exact limitation and still validate the migration with the available linked-project dry-run workflow before deployment.

- [ ] **Step 2: Re-run the supplied-file importer check**

Parse `/Users/JeemHome/Downloads/1111.xls` through the same production importer and assert 1,885 records, the six expected headers, no formulas, and no invalid rows. Do not log customer data.

- [ ] **Step 3: Start the application and inspect responsive layouts**

Run `npm run dev -- --host 127.0.0.1`, open the page at desktop, tablet, and phone widths, and verify title, upload surface, filters, result count, sticky header, horizontal table access, pagination, loading, error, and empty states. Use a local authorized test session or the existing authenticated browser session without weakening route protection.

- [ ] **Step 4: Fix only confirmed feature defects and re-run affected checks**

For each defect, add a failing regression test first, apply the smallest fix, run the focused test, then re-run the complete commands from Step 1.

- [ ] **Step 5: Commit verification fixes**

```bash
git add src/features/customer-balances src/pages/admin/CustomerBalances.tsx src/App.tsx src/auth/AuthProvider.tsx src/components/admin/AdminSidebar.tsx src/pages/admin/Users.tsx src/integrations/supabase/types.ts supabase/config.toml supabase/functions/import-customer-balances supabase/migrations/20260913090000_customer_balances.sql supabase/tests/customer_balances.sql
git commit -m "test: verify customer balance workflow"
```

Skip this commit when Step 4 makes no changes.

### Task 10: Apply Supabase changes and hand off deployment

**Files:**
- No source changes unless deployment exposes a reproducible configuration defect.

**Interfaces:**
- Publishes the migration and `import-customer-balances` Edge Function.

- [ ] **Step 1: Confirm the linked Supabase target**

Verify project reference `ecbbhathvpxrgvfztzeu` against the authenticated Supabase/Lovable project before applying changes. Stop if the browser project and repository project reference differ.

- [ ] **Step 2: Apply migration and deploy function**

Preferred authenticated CLI commands:

```bash
supabase db push --linked
supabase functions deploy import-customer-balances --project-ref ecbbhathvpxrgvfztzeu
```

If CLI authentication is unavailable, use the already authenticated Lovable/Safari session to apply the same checked-in migration and deploy the checked-in function. Do not paste unrelated code or edit a second divergent implementation in Lovable.

- [ ] **Step 3: Verify live authorization before importing data**

Confirm an admin can open the section, an unauthorized sales user cannot see or call it, and a sales user gains access only after the new checkbox is granted.

- [ ] **Step 4: Import the supplied workbook after authorization passes**

Use the page to upload `1111.xls`, accept the replacement dialog, confirm the success message, verify metadata shows the correct base filename/time and 1,885 records, then spot-check search, debit/credit filters, both currencies, and pagination without exposing customer rows in logs.

- [ ] **Step 5: Verify Vercel deployment state**

Push through the repository's existing GitHub workflow only when requested or already part of the active workflow. Confirm the preview deployment is READY before promoting or merging to `main`; production remains `https://ufukalbasra.com`.

---

## Acceptance checklist

- [ ] Admin and independently permitted sales users can view and upload.
- [ ] Anonymous, ordinary authenticated, and unauthorized sales users are rejected at UI, Edge Function, RPC, and RLS boundaries.
- [ ] Valid XLS and XLSX replace all old rows atomically.
- [ ] Invalid structure, format, content, or concurrent upload leaves old rows and metadata intact.
- [ ] Search handles Arabic, customer numbers, whitespace, and English case.
- [ ] Debit/credit and USD/IQD/all filters match the specified greater-than-zero rules.
- [ ] Amounts retain exact decimals, use thousands separators, and show zero as `—`.
- [ ] Result count, empty state, 50-row pagination, sticky header, and responsive horizontal access work.
- [ ] Last filename and update timestamp display after successful import.
- [ ] Full Vitest, lint, build, database tests, supplied-file check, and visual QA have fresh passing evidence or an explicitly reported environment limitation.
