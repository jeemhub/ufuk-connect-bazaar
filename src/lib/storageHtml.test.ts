import { beforeEach, describe, expect, it, vi } from "vitest";
const mock = vi.hoisted(() => ({ denied: false }));
vi.mock("./storageSigning", () => ({ signStorageReference: async () => {
  if (mock.denied) throw new Error("denied");
  return "https://hytdpmtahcmztezhbooc.supabase.co/storage/v1/object/sign/project-images/user/photo.jpg?token=EPHEMERAL_TEST_ONLY";
} }));
import { prepareStorageHtml, hydrateStorageHtml, serializeStorageHtml, resolvedStorageHtml } from "./storageHtml";
const SOURCE = "https://ecbbhathvpxrgvfztzeu.supabase.co/storage/v1/object/public/project-images/user/photo.jpg";
beforeEach(() => { mock.denied = false; });
describe("private images inside rich content", () => {
  it("stages legacy URLs inertly without source requests or old srcset", () => {
    const prepared = prepareStorageHtml(`<img src="${SOURCE}" srcset="${SOURCE} 2x"><a href="${SOURCE}">file</a>`);
    const root = document.createElement("div");root.innerHTML = prepared;
    expect(root.querySelector("img")?.hasAttribute("src")).toBe(false);
    expect(root.querySelector("img")?.hasAttribute("srcset")).toBe(false);
    expect(root.querySelector("a")?.hasAttribute("href")).toBe(false);
  });
  it("previews with signed URLs but saves only stable canonical locators", async () => {
    const root = document.createElement("div");root.innerHTML = prepareStorageHtml(`<img src="${SOURCE}">`);
    await hydrateStorageHtml(root, "user");expect(root.querySelector("img")?.src).toContain("EPHEMERAL_TEST_ONLY");
    const saved = serializeStorageHtml(root);
    expect(saved).not.toContain("token=");expect(saved).not.toContain("EPHEMERAL_TEST_ONLY");expect(saved).not.toContain("data-ufuk-");expect(saved).not.toContain("ecbbhathvpxrgvfztzeu");
    expect(saved).toContain("/storage/v1/object/public/project-images/user/photo.jpg");
  });
  it("fails closed on denial instead of retaining the old public image", async () => {
    mock.denied = true;const rendered = await resolvedStorageHtml(prepareStorageHtml(`<img src="${SOURCE}">`), "user");
    expect(rendered).not.toContain("src=");expect(rendered).not.toContain("ecbbhathvpxrgvfztzeu");
  });
  it("sanitizes events/scripts and forged internal hydration markers", () => {
    const result = prepareStorageHtml('<script>alert(1)</script><a data-ufuk-storage-reference="javascript:alert(1)" data-ufuk-storage-attribute="href" href="javascript:alert(1)">bad</a><img src="/local.png" onerror="alert(1)">');
    expect(result).not.toContain("<script");expect(result).not.toContain("onerror");expect(result).not.toContain("javascript:");expect(result).not.toContain("data-ufuk-");
  });
  it("keeps public static markup and strips unsupported legacy CSS image requests", () => {
    const result = prepareStorageHtml(`<p style="color:red;background-image:url('${SOURCE}')">Text</p><img src="/images/local.png">`);
    expect(result).toContain("color");expect(result).not.toContain("background-image");expect(result).toContain("/images/local.png");
  });
});
