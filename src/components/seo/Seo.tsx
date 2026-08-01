import { Helmet } from "react-helmet-async";

export const SITE_URL = "https://ufukalbasra.com";
export const SITE_NAME = "UFUK AL-Basra";

export function absoluteUrl(path: string) {
  if (!path) return SITE_URL;
  if (/^https?:\/\//i.test(path)) return path;
  return `${SITE_URL}${path.startsWith("/") ? path : `/${path}`}`;
}

export function clamp(text: string | undefined | null, max = 158) {
  const clean = (text ?? "").replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim();
  if (clean.length <= max) return clean;
  return `${clean.slice(0, max - 1).trimEnd()}…`;
}

type SeoProps = {
  title: string;
  description: string;
  path: string;
  image?: string;
  type?: "website" | "article" | "product";
  lang?: string;
  jsonLd?: Record<string, unknown> | Record<string, unknown>[];
  noindex?: boolean;
};

export function Seo({ title, description, path, image, type = "website", lang, jsonLd, noindex }: SeoProps) {
  const url = absoluteUrl(path);
  const desc = clamp(description);
  const img = image ? absoluteUrl(image) : undefined;

  return (
    <Helmet>
      {lang ? <html lang={lang} /> : null}
      <title>{title}</title>
      <meta name="description" content={desc} />
      <link rel="canonical" href={url} />
      {noindex ? <meta name="robots" content="noindex,nofollow" /> : null}

      <meta property="og:site_name" content={SITE_NAME} />
      <meta property="og:type" content={type} />
      <meta property="og:title" content={title} />
      <meta property="og:description" content={desc} />
      <meta property="og:url" content={url} />
      {img ? <meta property="og:image" content={img} /> : null}

      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={title} />
      <meta name="twitter:description" content={desc} />
      {img ? <meta name="twitter:image" content={img} /> : null}

      {jsonLd ? (
        <script type="application/ld+json">
          {JSON.stringify(Array.isArray(jsonLd) ? jsonLd : jsonLd)}
        </script>
      ) : null}
    </Helmet>
  );
}

export default Seo;
