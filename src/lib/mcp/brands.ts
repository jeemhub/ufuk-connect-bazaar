export const BRAND_COLUMNS = "id, name, slug, description, logo_url, is_active, sort";

export function toBrand(b: {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  logo_url: string | null;
  is_active: boolean;
  sort: number;
}) {
  return {
    id: b.id,
    name: b.name,
    slug: b.slug,
    description: b.description ?? null,
    logoUrl: b.logo_url ?? null,
    isActive: b.is_active,
    sort: b.sort,
  };
}
