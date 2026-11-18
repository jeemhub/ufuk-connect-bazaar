import { catalogueMedia } from "@/features/transfer-budget/client";
import { supabase } from "@/integrations/supabase/client";
import { storageObject, type StorageObject } from "./storageReferences";

type Pending = { object: StorageObject; resolve: (url: string) => void; reject: (error: Error) => void };
const pending = new Map<string, Pending[]>();
// Only storefront media gets longer-lived links. Personal files keep the original
// one-minute authorization window; no bucket policy or file visibility changes.
const CATALOG_BUCKETS = new Set(["product-images", "brand-logos", "blog-images", "project-images"]);
export function mediaTiming(value: string) {
  let catalog = false;
  try { catalog = CATALOG_BUCKETS.has(storageObject(value)?.bucket ?? ""); } catch { /* Deny in signer. */ }
  return catalog ? { ttl: 3600, stale: 50 * 60_000, refresh: 55 * 60_000 } : { ttl: 60, stale: 30_000, refresh: 45_000 };
}

async function currentScope(): Promise<string> {
  const { data, error } = await supabase.auth.getSession();
  if (error) throw new Error("Storage session unavailable");
  return data.session?.user.id ?? "anonymous";
}

async function flush(key: string, scope: string, bucket: string) {
  const work = pending.get(key) ?? [];
  pending.delete(key);
  try {
    if (await currentScope() !== scope) throw new Error("Storage session changed");
    const paths = [...new Set(work.map(x => x.object.path))];
    const urls = new Map<string, string>();
    // Coalesce media mounted in one render into bounded native signing batches.
    await Promise.all(Array.from({ length: Math.ceil(paths.length / 100) }, async (_, i) => {
      const chunk = paths.slice(i * 100, (i + 1) * 100);
      const { data, error } = await supabase.storage.from(bucket).createSignedUrls(chunk, CATALOG_BUCKETS.has(bucket) ? 3600 : 60);
      if (error) throw new Error("Storage access denied or unavailable");
      for (const item of data ?? []) if (item.path && item.signedUrl && !item.error) urls.set(item.path, item.signedUrl);
    }));
    if (await currentScope() !== scope) throw new Error("Storage session changed");
    for (const item of work) {
      const url = urls.get(item.object.path);
      if (url) item.resolve(url); else item.reject(new Error("Storage object unavailable"));
    }
  } catch {
    for (const item of work) item.reject(new Error("Storage access denied or session changed"));
  }
}

/** No source fallback, service key, public-bucket change or durable signed token. */
export function signStorageReference(value: string, scope: string): Promise<string> {
  const object = storageObject(value);
  if (!object) return Promise.resolve(value);
  if (import.meta.env.PROD && CATALOG_BUCKETS.has(object.bucket)) {
    return currentScope().then(current => {
      if (current !== scope) throw new Error("Storage session changed");
      return catalogueMedia(object.bucket, object.path);
    });
  }
  const key = `${scope}:${object.bucket}`;
  return new Promise((resolve, reject) => {
    const queue = pending.get(key);
    const item = { object, resolve, reject };
    if (queue) queue.push(item);
    else {
      pending.set(key, [item]);
      queueMicrotask(() => { void flush(key, scope, object.bucket); });
    }
  });
}

export const SIGNED_MEDIA_STALE_MS = 30_000;
export const SIGNED_MEDIA_REFRESH_MS = 45_000;
