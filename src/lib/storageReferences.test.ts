import { describe, expect, it } from "vitest";
import { storageObject, storageReference, TARGET_ORIGIN } from "./storageReferences";

describe("independent private Storage locators", () => {
  it("preserves original nested paths and encodes names", () => {
    const url = storageReference("product-images", "datasheets/ملف 1.pdf");
    expect(url.startsWith(TARGET_ORIGIN)).toBe(true);
    expect(storageObject(url)).toEqual({ bucket: "product-images", path: "datasheets/ملف 1.pdf" });
  });
  it("maps old public/render and signed locators without retaining old tokens", () => {
    for (const type of ["object/public", "render/image/public", "object/sign"]) {
      expect(storageObject(`https://ecbbhathvpxrgvfztzeu.supabase.co/storage/v1/${type}/avatars/user/photo.jpg?token=OLD_NOT_USED`)).toEqual({ bucket: "avatars", path: "user/photo.jpg" });
    }
  });
  it("does not sign another project or external images", () => {
    expect(storageObject("https://another.supabase.co/storage/v1/object/public/avatars/u/a.jpg")).toBeNull();
    expect(storageObject("/images/local.webp")).toBeNull();
  });
  it("rejects traversal, encoded separators, unsupported buckets and insecure origins", () => {
    for (const tail of ["avatars/u/../a.jpg", "avatars/u/%2e%2e/a.jpg", "avatars/u%2fa.jpg", "unknown/a.jpg"]) {
      expect(() => storageObject(`${TARGET_ORIGIN}/storage/v1/object/public/${tail}`)).toThrow();
    }
    expect(() => storageObject(TARGET_ORIGIN.replace("https:", "http:")+"/storage/v1/object/public/avatars/u/a.jpg")).toThrow();
    expect(() => storageReference("avatars", "../a.jpg")).toThrow();
  });
});
