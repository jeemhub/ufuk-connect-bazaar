# Customer balances admin section

## Objective

Add a private admin-dashboard section named «أرصدة العملاء». Authorized administrators and sales employees can upload a complete XLS or XLSX balance file, replace the existing dataset atomically, and search, filter, and page through customer balances. No balance data or related API is available to anonymous, ordinary authenticated, or unauthorized sales users.

## Existing project context

The application is a React 18 and Vite SPA deployed on Vercel. Supabase supplies authentication, PostgreSQL storage, row-level security, RPCs, and Edge Functions. The admin dashboard is routed below `/admin` and uses `ProtectedRoute`, `AuthProvider`, `AdminSidebar`, React Query, shadcn-style UI components, and Arabic/English language context.

Administrative access currently supports the `admin` role and a `sales` role with independent boolean permissions in `sales_permissions`. The new section extends that system instead of introducing a separate authorization model.

The supplied workbook contains one sheet with 1,885 data rows and these exact headers:

1. `الرقم`
2. `الاسم`
3. `مدين دولار`
4. `دائن دولار`
5. `مدين دينار`
6. `دائن دينار`

Customer numbers are unique in the supplied workbook. Amounts include blanks and decimals of up to three places. The importer must not assume future files have the same row count or decimal scale.

## Authorization

Add `can_manage_customer_balances boolean not null default false` to `sales_permissions`.

An `admin` always has access. A user with the `sales` role has access only when `can_manage_customer_balances` is true. The permission covers both reading and replacing balances. It appears as «أرصدة العملاء» in the existing sales-permissions editor.

Authorization is enforced independently at every boundary:

- The frontend route uses `ProtectedRoute requirePerm="can_manage_customer_balances"`.
- The sidebar link is hidden unless the user is an admin or has the permission.
- PostgreSQL RLS allows balance and import-metadata reads only to an admin or a sales user with the permission.
- Search and replacement RPCs verify the same permission before doing work.
- The Edge Function validates the caller's JWT and permission before reading the uploaded body.

Frontend checks are navigation aids only. Database and Edge Function checks are authoritative.

## Data model

Create `customer_balances` with:

- `customer_number text primary key`
- `customer_name text not null`
- `search_customer_number text not null`
- `search_customer_name text not null`
- `debit_usd numeric not null default 0`
- `credit_usd numeric not null default 0`
- `debit_iqd numeric not null default 0`
- `credit_iqd numeric not null default 0`
- `imported_at timestamptz not null`

Use PostgreSQL `numeric` without a fixed scale so future files retain their exact decimal representation. The query RPC casts monetary values to text before JSON serialization so JavaScript does not turn database decimals into binary floating-point amounts.

Customer names and numbers are stored without trimming or rewriting. Separate normalized search fields use lowercasing and whitespace collapsing. This allows Arabic substring search, case-insensitive English search, and tolerance of extra spaces without changing displayed data.

Create a single-row `customer_balance_import_state` table containing the last original file name, update time, uploading user ID, and row count. The original file itself is not retained after processing because the requested feature needs the processed dataset, not document storage.

Enable Supabase's supported `pg_trgm` extension and add GIN trigram indexes to the normalized customer name and number fields for substring search.

## Server-side import

Add a Supabase Edge Function named `import-customer-balances`. It accepts a multipart form containing one file and applies these limits and checks before any database mutation:

- The caller is authenticated and authorized.
- Only one file is present.
- The file name extension is `.xls` or `.xlsx`, case-insensitively.
- The declared MIME type is one of the known Excel MIME types or the generic binary type used by browsers for legacy XLS files.
- The file is no larger than 5 MiB.
- The byte signature is OLE Compound File for XLS or ZIP/OpenXML for XLSX and agrees with the extension.
- The workbook parses successfully and contains at least one worksheet.
- The first worksheet's first non-empty row has exactly the six required headers after header-only whitespace normalization.
- Formula cells are rejected. Formula text is never evaluated.
- Fully blank data rows are ignored.
- Customer number and name are present and valid scalar values.
- Customer numbers are unique within the file.
- Amounts are blank or valid finite decimal values. Blank amounts become the decimal string `0`.
- The dataset contains between 1 and 50,000 records.

The parser reads the entire workbook and produces a validated array of decimal strings before calling PostgreSQL. It never writes partial batches.

## Atomic replacement

Create a `replace_customer_balances(file_name text, rows jsonb)` security-definer RPC that:

1. Verifies the caller has the required permission.
2. Acquires a transaction-scoped advisory lock with `pg_try_advisory_xact_lock`; if another import is active, it returns a clear busy error.
3. Loads every incoming row into a temporary table, performing database-level null, duplicate, and numeric validation.
4. Confirms the staged row count equals the submitted row count and is greater than zero.
5. Deletes the old `customer_balances` rows.
6. Inserts the staged rows.
7. Updates the single import-state row with the sanitized base file name, timestamp, user, and row count.

PostgreSQL executes the function as one transaction. Any parsing, cast, validation, delete, insert, or metadata error rolls back the call and leaves the previous balances and metadata unchanged.

The upload button and file input remain disabled while a request is running. The server advisory lock provides the authoritative protection against concurrent double submission.

## Search and pagination API

Create `search_customer_balances(query text, balance_type text, currency text, page integer, page_size integer)` as a security-definer RPC with the same permission check.

The RPC normalizes the query and matches it against normalized name or customer number. It supports:

- Balance type: `all`, `debit`, or `credit`.
- Currency: `all`, `usd`, or `iqd`.
- Debit filters select rows whose applicable debit field is greater than zero.
- Credit filters select rows whose applicable credit field is greater than zero.
- When currency is `all`, either USD or IQD can satisfy the selected balance type.

Results are ordered consistently by customer number and name, paginated on the server, and include the total filtered count. Page size is bounded server-side; the UI uses 50 rows per page.

## Frontend experience

Add `/admin/customer-balances` and a sidebar item labeled «أرصدة العملاء» with a restrained financial/table icon.

The page follows the existing dashboard surfaces and spacing:

- Page title: «أرصدة العملاء».
- Description: «البحث واستعراض أرصدة العملاء بالدولار والدينار».
- A compact upload surface titled «تحديث ملف الأرصدة» with button «رفع ملف جديد» and last-upload metadata.
- Before submission, an alert dialog shows exactly: «سيؤدي رفع الملف الجديد إلى استبدال بيانات الأرصدة الحالية بالكامل. هل تريد المتابعة؟».
- Successful upload shows «تم تحديث ملف الأرصدة بنجاح» and refreshes metadata and results.
- A wide centered search input uses «ابحث باسم العميل أو رقمه».
- Type and currency filters sit directly below the search field, followed by «إعادة ضبط الفلاتر» and the result count.
- Search is debounced by 250 milliseconds to remain visually immediate without issuing a request for every keystroke.
- The table uses the six requested Arabic labels, right-aligns customer names, consistently aligns numeric values, and uses a tabular-number font feature.
- Exact decimal strings are formatted with thousands separators while retaining their stored fractional digits. Zero and blank amounts display as `—`.
- Debit and credit values use distinct, quiet semantic colors.
- The header remains sticky inside the table scroll area. Small screens retain the table with horizontal scrolling so no requested column is hidden.
- Empty results show «لا توجد نتائج مطابقة لبحثك».

React Query owns query caching, loading, and invalidation. Existing UI components provide inputs, selects, buttons, alerts, table styling, loading indicators, and pagination.

## Error handling

The Edge Function returns stable Arabic-facing error codes or messages for unauthorized access, unsupported extension, signature mismatch, oversized files, unreadable workbook, missing columns, formulas, empty datasets, invalid rows, duplicate customer numbers, and import-in-progress conflicts.

The frontend maps errors to clear Arabic messages, keeps the chosen file available when retrying is safe, and never reports success unless the replacement RPC completes. The existing data remains queryable after a failed upload.

No workbook text is interpreted as HTML, SQL, a command, or application instructions. React renders customer content as escaped text. SQL receives values only through typed JSON processing and static statements.

## Testing

Follow test-driven development for implementation behavior.

Vitest tests cover:

- Valid legacy XLS parsing.
- Valid XLSX parsing.
- Missing or reordered required columns.
- Unsupported extensions and mismatched signatures.
- Formula-cell rejection.
- Blank amounts converted to exact zero strings.
- Decimal preservation.
- Duplicate and missing identifiers.
- Arabic and English/whitespace search normalization.
- Debit, credit, USD, IQD, and combined-currency filter construction.
- Financial display formatting, zero placeholders, page calculations, and reset behavior.
- Route and navigation visibility for admin, permitted sales, unauthorized sales, ordinary authenticated, and anonymous users.

Database tests cover:

- Unauthorized read and replacement rejection.
- Failed staged validation retains the old rows and metadata.
- Successful replacement removes all old rows and installs all new rows.
- A concurrent replacement is rejected by the advisory lock.
- Search, each filter combination, total counts, and pagination.

Component tests cover loading, upload disabling, confirmation text, successful refresh, Arabic errors, empty state, and responsive table structure.

Final verification runs the focused tests during each red/green cycle, then the full test suite, ESLint, the production build, and available Supabase database tests. The supplied `1111.xls` is used as a runtime import fixture/check, never embedded as application data.

## Deployment and migration

Implementation produces one timestamped Supabase migration, the new Edge Function, frontend code, tests, and generated Supabase TypeScript type updates required by the schema.

After verification:

1. Apply the migration to Supabase.
2. Deploy `import-customer-balances` with JWT verification enabled.
3. Deploy the frontend through the repository's existing GitHub-to-Vercel integration.
4. Grant `can_manage_customer_balances` to selected sales employees from the existing user administration page.
5. Open `/admin/customer-balances` and upload the current workbook.

Browser access to Lovable may be used for authenticated deployment steps if the local Supabase workflow is unavailable. Source changes remain in the repository to avoid two conflicting sources of truth.
