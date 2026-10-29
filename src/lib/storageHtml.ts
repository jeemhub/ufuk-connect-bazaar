import { storageObject, storageReference } from "./storageReferences";
import { signStorageReference } from "./storageSigning";
import { sanitizeRichHtml } from "./safeRichHtml";
const REF = "data-ufuk-storage-reference";
const ATTR = "data-ufuk-storage-attribute";
const SCOPE = "data-ufuk-storage-scope";
const TIME = "data-ufuk-storage-time";

function stage(root: ParentNode) {
  for (const node of root.querySelectorAll<HTMLElement>("img[src],a[href]")) {
    const attr = node.tagName === "IMG" ? "src" : "href";
    const raw = node.getAttribute(attr);
    try {
      const object = storageObject(raw);
      if (!object) continue;
      const canonical = storageReference(object.bucket, object.path);
      if (node.getAttribute(REF) === canonical && node.hasAttribute(SCOPE)) continue;
      node.setAttribute(REF, canonical);node.setAttribute(ATTR, attr);node.removeAttribute(attr);node.removeAttribute("srcset");
    } catch { node.removeAttribute(attr);node.removeAttribute("srcset"); }
  }
  for (const node of root.querySelectorAll<HTMLElement>("[style]")) {
    for (const property of Array.from(node.style)) {
      const value = node.style.getPropertyValue(property);
      if (value.includes("ecbbhathvpxrgvfztzeu.supabase.co") || value.includes("hytdpmtahcmztezhbooc.supabase.co")) node.style.removeProperty(property);
    }
  }
}

/** Inert template prevents even a temporary request to the old Storage host. */
export function prepareStorageHtml(html: string): string {
  const template = document.createElement("template");template.innerHTML = sanitizeRichHtml(html);stage(template.content);return template.innerHTML;
}

export async function hydrateStorageHtml(root: ParentNode, scope: string): Promise<void> {
  stage(root);
  await Promise.all(Array.from(root.querySelectorAll<HTMLElement>(`[${REF}]`), async node => {
    const value = node.getAttribute(REF)!;const attr = node.getAttribute(ATTR);
    if (attr !== "src" && attr !== "href") return;
    if (node.getAttribute(SCOPE) === scope && Date.now() - Number(node.getAttribute(TIME)) < 30_000 && node.hasAttribute(attr)) return;
    node.removeAttribute(attr);
    try {
      const url = await signStorageReference(value, scope);
      if (root.contains(node) && node.getAttribute(REF) === value) {
        node.setAttribute(attr, url);node.setAttribute(SCOPE, scope);node.setAttribute(TIME, String(Date.now()));
      }
    } catch { /* Access denied: leave the source attribute absent. */ }
  }));
}

/** Editor persistence always restores stable locators and strips signed tokens. */
export function serializeStorageHtml(root: HTMLElement): string {
  const clone = root.cloneNode(true) as HTMLElement;
  for (const node of clone.querySelectorAll<HTMLElement>(`img,a`)) {
    const attr = node.tagName === "IMG" ? "src" : "href";
    const value = node.getAttribute(REF) ?? node.getAttribute(attr);
    try {
      const object = storageObject(value);
      if (object) node.setAttribute(attr, storageReference(object.bucket, object.path));
    } catch { node.removeAttribute(attr); }
    for (const name of [REF,ATTR,SCOPE,TIME]) node.removeAttribute(name);
  }
  return sanitizeRichHtml(clone.innerHTML);
}

export async function resolvedStorageHtml(prepared: string, scope: string): Promise<string> {
  const template = document.createElement("template");template.innerHTML = prepared;await hydrateStorageHtml(template.content, scope);
  return sanitizeRichHtml(template.innerHTML);
}
