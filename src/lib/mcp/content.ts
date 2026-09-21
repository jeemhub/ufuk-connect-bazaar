import { z } from "zod";

const text = z.string().trim();

export const slugField = text
  .min(1)
  .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Use lowercase letters, digits and dashes only")
  .describe("Unique URL slug (lowercase letters, digits, dashes).");

export const blogFields = {
  title_ar: text.min(1).describe("Arabic title."),
  title_en: text.min(1).describe("English title."),
  excerpt_ar: text.nullable().optional().describe("Arabic excerpt, or null."),
  excerpt_en: text.nullable().optional().describe("English excerpt, or null."),
  body_ar: text.nullable().optional().describe("Arabic body (HTML/Markdown as used on the site), or null."),
  body_en: text.nullable().optional().describe("English body (HTML/Markdown as used on the site), or null."),
  cover_url: z.string().url().nullable().optional().describe("Cover image URL, or null."),
  is_featured: z.boolean().optional().describe("Feature on the home page."),
  featured_sort: z.number().int().min(0).optional().describe("Order among featured posts."),
};

export const BLOG_COLUMNS =
  "id, slug, title_ar, title_en, excerpt_ar, excerpt_en, cover_url, status, is_featured, featured_sort, published_at, created_at, updated_at";

export function toBlogPost(p: {
  id: string;
  slug: string;
  title_ar: string;
  title_en: string;
  excerpt_ar: string | null;
  excerpt_en: string | null;
  cover_url: string | null;
  status: string;
  is_featured: boolean;
  featured_sort: number;
  published_at: string | null;
  created_at: string;
  updated_at: string;
}) {
  return {
    id: p.id,
    slug: p.slug,
    titleAr: p.title_ar,
    titleEn: p.title_en,
    excerptAr: p.excerpt_ar ?? null,
    excerptEn: p.excerpt_en ?? null,
    coverUrl: p.cover_url ?? null,
    status: p.status,
    isFeatured: p.is_featured,
    featuredSort: p.featured_sort,
    publishedAt: p.published_at ?? null,
    createdAt: p.created_at,
    updatedAt: p.updated_at,
  };
}

export const projectFields = {
  title_ar: text.min(1).describe("Arabic title."),
  title_en: text.min(1).describe("English title."),
  summary_ar: text.nullable().optional().describe("Arabic summary, or null."),
  summary_en: text.nullable().optional().describe("English summary, or null."),
  body_ar: text.nullable().optional().describe("Arabic body, or null."),
  body_en: text.nullable().optional().describe("English body, or null."),
  cover_url: z.string().url().nullable().optional().describe("Cover image URL, or null."),
  gallery: z.array(z.string().url()).optional().describe("Gallery image URLs."),
  client: text.nullable().optional().describe("Client name, or null."),
  location: text.nullable().optional().describe("Location, or null."),
  completed_at: z.string().date().nullable().optional().describe("Completion date (YYYY-MM-DD), or null."),
  sort: z.number().int().min(0).optional().describe("Display order."),
};

export const PROJECT_COLUMNS =
  "id, slug, title_ar, title_en, summary_ar, summary_en, cover_url, gallery, client, location, completed_at, is_published, sort, created_at, updated_at";

export function toProject(p: {
  id: string;
  slug: string;
  title_ar: string;
  title_en: string;
  summary_ar: string | null;
  summary_en: string | null;
  cover_url: string | null;
  gallery: string[];
  client: string | null;
  location: string | null;
  completed_at: string | null;
  is_published: boolean;
  sort: number;
  created_at: string;
  updated_at: string;
}) {
  return {
    id: p.id,
    slug: p.slug,
    titleAr: p.title_ar,
    titleEn: p.title_en,
    summaryAr: p.summary_ar ?? null,
    summaryEn: p.summary_en ?? null,
    coverUrl: p.cover_url ?? null,
    gallery: p.gallery ?? [],
    client: p.client ?? null,
    location: p.location ?? null,
    completedAt: p.completed_at ?? null,
    isPublished: p.is_published,
    sort: p.sort,
    createdAt: p.created_at,
    updatedAt: p.updated_at,
  };
}
