import { describe, expect, it, vi } from "vitest";
import { assertApprovedBackend, isServiceCaller } from "../../supabase/functions/_shared/migrationSafety";
import { sendOwnedEmail } from "../../supabase/functions/_shared/ownedEmail";
describe("function migration boundaries", () => {
  it("rejects source backend and fake service JWT claims", () => {
    expect(() => assertApprovedBackend("https://ecbbhathvpxrgvfztzeu.supabase.co")).toThrow();
    const fake = `a.${btoa(JSON.stringify({ role: "service_role" }))}.forged`;
    expect(isServiceCaller(new Request("https://local.test", { headers: { authorization: `Bearer ${fake}` } }), "EXPECTED_TEST_ONLY")).toBe(false);
    expect(isServiceCaller(new Request("https://local.test", { headers: { apikey: "EXPECTED_TEST_ONLY" } }), "EXPECTED_TEST_ONLY")).toBe(true);
    expect(isServiceCaller(new Request("https://local.test"), "")).toBe(false);
  });
  it("pins provider and sender, retains idempotency and never uses payload sender", async () => {
    const send = vi.fn(async (_input: RequestInfo | URL, _init?: RequestInit) => new Response("{}", { status: 200 }));
    await sendOwnedEmail({ to: "recipient@example.test", from: "spoof@example.test", subject: "Test", text: "Synthetic", message_id: "fixture-1" } as never, { apiKey: "TEST_ONLY", from: "verified@example.test" }, send);
    expect(send).toHaveBeenCalledOnce();
    expect(send.mock.calls[0][0]).toBe("https://api.resend.com/emails");
    const options = send.mock.calls[0][1] as RequestInit;
    expect(JSON.parse(options.body as string).from).toBe("verified@example.test");
    expect(options.headers).toMatchObject({ "Idempotency-Key": "fixture-1" });
    expect(options.redirect).toBe("error");
  });
  it("does not send without configuration or stable idempotency", async () => {
    const send = vi.fn();const payload = { to: "recipient@example.test", subject: "Test", text: "Synthetic", message_id: "one" };
    await expect(sendOwnedEmail(payload, { apiKey: "", from: "" }, send)).rejects.toThrow();
    await expect(sendOwnedEmail({ ...payload, message_id: undefined }, { apiKey: "TEST_ONLY", from: "verified@example.test" }, send)).rejects.toThrow();
    expect(send).not.toHaveBeenCalled();
  });
  it("returns sanitized quota errors with bounded retry delays", async () => {
    const send = vi.fn(async () => new Response("private provider error must not be logged", { status: 429, headers: { "retry-after": "120" } }));
    await expect(sendOwnedEmail({ to: "recipient@example.test", subject: "Test", text: "Synthetic", message_id: "one" }, { apiKey: "TEST_ONLY", from: "verified@example.test" }, send)).rejects.toMatchObject({ status: 429, retryAfterSeconds: 120, message: "Email provider rejected request (429)" });
  });
});
