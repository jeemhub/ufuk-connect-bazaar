// Allowlist of Supabase tables the MCP server may touch, mapped to the admin
// dashboard section that manages them, plus which operations are permitted.
// Transactional tables (orders, order_items, quote_requests) are read +
// status-update only — creating or deleting those stays in the app so totals,
// stock side effects and audit trails stay consistent with its own logic.
//
// Tables missing from this list are unreachable on purpose: user_roles and
// sales_permissions (granting admin rights stays a human action in the
// dashboard), customer_balances (customer financial data), and the auth,
// notification and analytics tables.
//
// `untrusted` marks tables whose rows hold text typed by site visitors.

export const TABLES = {
  products: {
    section: "Products",
    columns:
      "id(uuid,pk) sku name_ar name_en name_data desc_ar desc_en brand category_id(uuid -> categories.id) subcategory " +
      "price_iqd price_wholesale_iqd price_dealer_iqd cost_usd cost_iqd(read-only, computed as cost_usd*1500) " +
      "stock(int) image_url datasheet_url datasheet_name is_active(bool) created_at updated_at",
    permissions: { select: true, insert: true, update: true, delete: true },
  },
  categories: {
    section: "Categories",
    columns: "id(uuid,pk) key(unique) name_ar name_en sort(int) created_at",
    permissions: { select: true, insert: true, update: true, delete: true },
  },
  subcategories: {
    section: "Categories",
    columns: "id(uuid,pk) category_id(uuid -> categories.id) name_ar name_en created_at",
    permissions: { select: true, insert: true, update: true, delete: true },
  },
  brands: {
    section: "Brands",
    columns: "id(uuid,pk) name slug(unique) logo_url description is_active(bool) sort(int) created_at updated_at",
    permissions: { select: true, insert: true, update: true, delete: true },
  },
  blog_posts: {
    section: "Blog",
    columns:
      "id(uuid,pk) slug(unique) title_ar title_en excerpt_ar excerpt_en body_ar body_en cover_url author_id " +
      "status('draft'|'published') is_featured(bool) featured_sort(int) view_count(int) published_at created_at updated_at",
    permissions: { select: true, insert: true, update: true, delete: true },
  },
  projects: {
    section: "Projects",
    columns:
      "id(uuid,pk) slug(unique) title_ar title_en summary_ar summary_en body_ar body_en cover_url gallery(text[]) " +
      "client location completed_at(date) is_published(bool) sort(int) author_id created_at updated_at",
    permissions: { select: true, insert: true, update: true, delete: true },
  },
  site_pages: {
    section: "About / static pages",
    columns: "id(uuid,pk) key(unique, e.g. 'about') title_ar title_en content_ar content_en cover_url updated_by updated_at",
    permissions: { select: true, insert: true, update: true, delete: false },
  },
  orders: {
    section: "Orders",
    columns:
      "id(uuid,pk) order_no(unique) user_id customer_name customer_phone customer_city customer_address " +
      "total_iqd status(pending|...) notes created_at updated_at",
    permissions: { select: true, insert: false, update: true, delete: false },
    untrusted: true,
  },
  order_items: {
    section: "Orders",
    columns: "id(uuid,pk) order_id(uuid -> orders.id) product_id product_name quantity(int) unit_price_iqd created_at",
    permissions: { select: true, insert: false, update: false, delete: false },
  },
  quote_requests: {
    section: "Quotes",
    columns: "id(uuid,pk) full_name phone email company product_id product_name message attachments status('new'|...) created_at",
    permissions: { select: true, insert: false, update: true, delete: false },
    untrusted: true,
  },
};

export function assertAllowed(table, op) {
  const cfg = TABLES[table];
  if (!cfg) {
    const names = Object.keys(TABLES).join(", ");
    throw new Error(`Unknown or disallowed table "${table}". Allowed tables: ${names}`);
  }
  if (!cfg.permissions[op]) {
    throw new Error(`Operation "${op}" is not permitted on table "${table}".`);
  }
  return cfg;
}
