// Helper to request smaller, faster-loading variants of images served from
// our Supabase storage CDN. Uses the public render endpoint to resize/transcode
// on the fly. Falls back to the original URL for non-storage images.
export function optimizedImage(
  url: string | null | undefined,
  opts: { width: number; quality?: number } = { width: 800 },
): string | undefined {
  if (!url) return undefined;
  try {
    const u = new URL(url);
    // Only optimize images served by our Supabase storage host
    if (!u.hostname.endsWith(".supabase.co")) return url;
    // Convert /storage/v1/object/public/<bucket>/<path>
    // into  /storage/v1/render/image/public/<bucket>/<path>?width=...&quality=...
    if (u.pathname.includes("/storage/v1/object/public/")) {
      u.pathname = u.pathname.replace(
        "/storage/v1/object/public/",
        "/storage/v1/render/image/public/",
      );
    } else if (!u.pathname.includes("/storage/v1/render/image/public/")) {
      return url;
    }
    u.searchParams.set("width", String(Math.round(opts.width)));
    u.searchParams.set("quality", String(opts.quality ?? 75));
    u.searchParams.set("resize", "contain");
    return u.toString();
  } catch {
    return url;
  }
}

// Build a srcset string for responsive images.
export function optimizedSrcSet(
  url: string | null | undefined,
  widths: number[],
  quality = 75,
): string | undefined {
  if (!url) return undefined;
  return widths
    .map((w) => `${optimizedImage(url, { width: w, quality })} ${w}w`)
    .join(", ");
}
