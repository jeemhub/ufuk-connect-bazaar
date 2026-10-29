import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
const sdk = vi.hoisted(() => ({
  getSession: vi.fn(), onAuthStateChange: vi.fn(), updateUser: vi.fn(),
  getAuthorizationDetails: vi.fn(), approveAuthorization: vi.fn(), denyAuthorization: vi.fn(),
  signUp: vi.fn(), resetPasswordForEmail: vi.fn(),
  signInWithPassword: vi.fn(async () => ({ data: { user: null }, error: { message: "Synthetic invalid login" } })),
  insert: vi.fn(async () => ({ error: null })),
}));
vi.mock("@/integrations/supabase/client", () => ({ supabase: { auth: { ...sdk, oauth: sdk }, from: vi.fn(() => ({ insert: sdk.insert })) } }));
vi.mock("@/auth/AuthProvider", () => ({ useAuth: () => ({ session: null, loading: false, user: null }) }));
vi.mock("@/i18n/LanguageContext", () => ({ useLanguage: () => ({ lang: "ar", t: (key: string) => key, toggle: vi.fn() }) }));
vi.mock("@/lib/migrationFeatures", () => ({ emailFeaturesEnabled: false, signupEnabled: false, pushEnabled: false, mcpEnabled: false }));
vi.mock("sonner", () => ({ toast: { error: vi.fn(), success: vi.fn() } }));
import OAuthConsent from "@/pages/OAuthConsent";
import ResetPasswordPage from "@/pages/ResetPassword";
import AuthPage from "@/pages/Auth";
import { PushToggleButton } from "@/components/site/PushToggleButton";
afterEach(() => { cleanup(); vi.clearAllMocks(); });
function route(element: React.ReactElement, path: string) { return render(<MemoryRouter initialEntries={[path]}>{element}</MemoryRouter>); }
describe("deferred features fail closed without account or provider actions", () => {
  it("crafted OAuth authorization URL cannot fetch, approve, deny or redirect to a consent flow", () => {
    route(<OAuthConsent />, "/.lovable/oauth/consent?authorization_id=SYNTHETIC");
    expect(screen.getByRole("heading", { name: "ربط التطبيقات مؤجل مؤقتاً" })).toBeInTheDocument();
    for (const f of [sdk.getSession, sdk.getAuthorizationDetails, sdk.approveAuthorization, sdk.denyAuthorization]) expect(f).not.toHaveBeenCalled();
  });
  it("direct recovery route never reads a session or offers a password mutation", () => {
    route(<ResetPasswordPage />, "/auth/reset#access_token=SYNTHETIC_NOT_A_TOKEN");
    expect(screen.getByRole("heading", { name: "استعادة كلمة المرور مؤجلة مؤقتاً" })).toBeInTheDocument();
    expect(screen.queryByLabelText("auth_password")).not.toBeInTheDocument();
    for (const f of [sdk.getSession, sdk.onAuthStateChange, sdk.updateUser, sdk.resetPasswordForEmail]) expect(f).not.toHaveBeenCalled();
  });
  it("existing password login remains usable while signup and recovery stay unavailable", async () => {
    route(<AuthPage />, "/auth");
    expect(screen.queryByText("auth_forgot_link")).not.toBeInTheDocument();
    fireEvent.change(screen.getByLabelText("auth_email"), { target: { value: "synthetic@example.invalid" } });
    fireEvent.change(screen.getByLabelText("auth_password"), { target: { value: "SYNTHETIC_TEST_ONLY" } });
    fireEvent.submit(screen.getByLabelText("auth_password").closest("form")!);
    await waitFor(() => expect(sdk.signInWithPassword).toHaveBeenCalledOnce());
    expect(sdk.signUp).not.toHaveBeenCalled(); expect(sdk.resetPasswordForEmail).not.toHaveBeenCalled();
  });
  it("external push control is visibly disabled rather than reporting subscription success", () => {
    route(<PushToggleButton />, "/");
    expect(screen.getByRole("button", { name: /تنبيهات المتصفح مؤجلة/ })).toBeDisabled();
  });
});
