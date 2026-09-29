/**
 * Generates public/sitemap.xml before `vite dev` and `vite build`.
 * Static routes + dynamic products / projects / blog posts pulled from the backend.
 */
import { writeFileSync } from "fs";
import { resolve } from "path";

const BASE_URL = "https://ufukalbasra.com";
const MAX_URLS = 45000;

const SUPABASE_URL = process.env.VITE_SUPABASE_URL;
const SUPABASE_KEY = process.env.VITE_SUPABASE_PUBLISHABLE_KEY;

interface SitemapEntry {
  path: string;
  changefreq?: "always" | "hourly" | "daily" | "weekly" | "monthly" | "yearly" | "never";
  priority?: string;
}

const staticEntries: SitemapEntry[] = [
  { path: "/", changefreq: "weekly", priority: "1.0" },
  { path: "/products", changefreq: "daily", priority: "0.9" },
  { path: "/brands", changefreq: "monthly", priority: "0.7" },
  { path: "/projects", changefreq: "monthly", priority: "0.7" },
  { path: "/about", changefreq: "yearly", priority: "0.5" },
  { path: "/blog", changefreq: "weekly", priority: "0.6" },
  { path: "/tools", changefreq: "monthly", priority: "0.6" },
  { path: "/quote", changefreq: "yearly", priority: "0.4" },
];

const categoryKeys = ["networking", "solar", "ups", "accessories"];

async function fetchRows(table: string, select: string, filter = ""): Promise<Record<string, string>[]> {
  if (!SUPABASE_URL || !SUPABASE_KEY) return [];
  try {
    const url = `${SUPABASE_URL}/rest/v1/${table}?select=${select}${filter}&limit=${MAX_URLS}`;
    const res = await fetch(url, {
      headers: { apikey: SUPABASE_KEY, Authorization: `Bearer ${SUPABASE_KEY}` },
    });
    if (!res.ok) return [];
    return (await res.json()) as Record<string, string>[];
  } catch {
    return [];
  }
}

function xmlEscape(s: string) {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

function generateSitemap(entries: SitemapEntry[]) {
  const urls = entries.slice(0, MAX_URLS).map((e) =>
    [
      `  <url>`,
      `    <loc>${xmlEscape(BASE_URL + e.path)}</loc>`,
      e.changefreq ? `    <changefreq>${e.changefreq}</changefreq>` : null,
      e.priority ? `    <priority>${e.priority}</priority>` : null,
      `  </url>`,
    ]
      .filter(Boolean)
      .join("\n"),
  );

  return [
    `<?xml version="1.0" encoding="UTF-8"?>`,
    `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">`,
    ...urls,
    `</urlset>`,
  ].join("\n");
}

async function main() {
  const entries: SitemapEntry[] = [...staticEntries];

  for (const key of categoryKeys) {
    entries.push({ path: `/products?category=${key}`, changefreq: "daily", priority: "0.8" });
  }

  const products = await fetchRows("products_public", "id");
  products.forEach((p) => {
    if (p.id) entries.push({ path: `/products/${p.id}`, changefreq: "weekly", priority: "0.7" });
  });

  const projects = await fetchRows("projects", "slug");
  projects.forEach((p) => {
    if (p.slug) entries.push({ path: `/projects/${p.slug}`, changefreq: "monthly", priority: "0.6" });
  });

  const posts = await fetchRows("blog_posts", "slug", "&status=eq.published");
  posts.forEach((p) => {
    if (p.slug) entries.push({ path: `/blog/${p.slug}`, changefreq: "monthly", priority: "0.6" });
  });

  writeFileSync(resolve("public/sitemap.xml"), generateSitemap(entries));
  console.log(`sitemap.xml written (${Math.min(entries.length, MAX_URLS)} entries)`);
}

main();
