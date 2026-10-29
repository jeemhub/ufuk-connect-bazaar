import { beforeEach, describe, expect, it, vi } from "vitest";
const state = vi.hoisted(() => ({ scope: "user-a", deny: false, calls: [] as string[][], switchDuringSign: false }));
vi.mock("@/integrations/supabase/client", () => ({ supabase: {
  auth: { getSession: async () => ({ data: { session: state.scope === "anonymous" ? null : { user: { id: state.scope } } }, error: null }) },
  storage: { from: () => ({ createSignedUrls: async (paths: string[]) => {
    state.calls.push(paths);
    if (state.switchDuringSign) state.scope = "user-b";
    return state.deny ? { data: null, error: { message: "denied" } } : { data: paths.map(path => ({ path, signedUrl: `https://target.test/signed/${path}?token=TEST_ONLY` })), error: null };
  } }) },
} }));
import { signStorageReference } from "./storageSigning";
import { storageReference } from "./storageReferences";
beforeEach(() => { state.scope = "user-a"; state.deny = false; state.calls = []; state.switchDuringSign = false; });
describe("private media signing", () => {
  it("batches/deduplicates paths without source requests", async () => {
    const value = storageReference("avatars", "user-a/photo.jpg");
    const urls = await Promise.all([signStorageReference(value, "user-a"), signStorageReference(value, "user-a")]);
    expect(urls[0]).toBe(urls[1]);expect(state.calls).toEqual([["user-a/photo.jpg"]]);
  });
  it("fails closed when RLS denies instead of returning a public/source URL", async () => {
    state.deny = true;
    await expect(signStorageReference(storageReference("avatars", "user-a/photo.jpg"), "user-a")).rejects.toThrow("denied");
  });
  it("rejects changed session both before and after the signing request", async () => {
    const value = storageReference("avatars", "user-a/photo.jpg");
    await expect(signStorageReference(value, "other-user")).rejects.toThrow();expect(state.calls).toHaveLength(0);
    state.switchDuringSign = true;
    await expect(signStorageReference(value, "user-a")).rejects.toThrow();
  });
  it("keeps static and external assets independent from storage authorization", async () => {
    expect(await signStorageReference("/images/logo.png", "anonymous")).toBe("/images/logo.png");expect(state.calls).toHaveLength(0);
  });
});
