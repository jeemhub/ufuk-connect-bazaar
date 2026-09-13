import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import Users from "@/pages/admin/Users";

const mocks = vi.hoisted(() => ({
  rpc: vi.fn(),
  from: vi.fn(),
}));

vi.mock("@/integrations/supabase/client", () => ({
  supabase: {
    rpc: mocks.rpc,
    from: mocks.from,
  },
}));

vi.mock("@/i18n/LanguageContext", () => ({
  useLanguage: () => ({ t: (key: string) => key, lang: "ar" }),
}));

describe("customer balance sales permission", () => {
  it("can be granted from the existing sales permissions editor", async () => {
    mocks.rpc.mockImplementation((name: string) => {
      if (name === "admin_list_users") {
        return Promise.resolve({
          data: [
            {
              id: "sales-1",
              email: "sales@example.test",
              full_name: "موظف المبيعات",
              phone: "",
              created_at: "2026-09-13T00:00:00Z",
              roles: ["sales"],
              quote_count: 0,
              is_verified: true,
              is_blocked: false,
              sales_perms: {},
            },
          ],
          error: null,
        });
      }
      return Promise.resolve({ data: null, error: null });
    });
    mocks.from.mockReturnValue({
      select: vi.fn().mockResolvedValue({ data: [], error: null }),
    });

    render(<Users />);

    await screen.findByText("موظف المبيعات");
    fireEvent.click(screen.getByRole("button", { name: /صلاحيات مبيعات/ }));
    expect(
      await screen.findByText("حدد الأقسام التي يمكن لهذا الموظف الوصول إليها داخل لوحة التحكم."),
    ).toBeInTheDocument();
    const permissionLabel = await screen.findByText("أرصدة العملاء");
    fireEvent.click(permissionLabel);
    fireEvent.click(screen.getByRole("button", { name: "حفظ الصلاحيات" }));

    await waitFor(() => {
      expect(mocks.rpc).toHaveBeenCalledWith(
        "admin_set_sales_permissions",
        expect.objectContaining({ _can_manage_customer_balances: true }),
      );
    });
  });
});
