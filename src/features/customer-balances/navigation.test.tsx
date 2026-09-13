import { render, screen } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { ProtectedRoute } from "@/auth/ProtectedRoute";
import { AdminSidebar } from "@/components/admin/AdminSidebar";
import { SidebarProvider } from "@/components/ui/sidebar";
import { TooltipProvider } from "@/components/ui/tooltip";

const mocks = vi.hoisted(() => ({ auth: {} as Record<string, unknown> }));

vi.mock("@/auth/AuthProvider", async (loadOriginal) => ({
  ...(await loadOriginal<typeof import("@/auth/AuthProvider")>()),
  useAuth: () => mocks.auth,
}));

vi.mock("@/i18n/LanguageContext", () => ({
  useLanguage: () => ({ t: (key: string) => key, lang: "ar" }),
}));

const permissions = (allowed = false) => ({
  can_manage_products: false,
  can_manage_categories: false,
  can_manage_brands: false,
  can_manage_blog: false,
  can_manage_projects: false,
  can_manage_orders: false,
  can_manage_quotes: false,
  can_manage_customer_balances: allowed,
});

function renderSidebar(isAdmin: boolean, allowed = false) {
  mocks.auth = { isAdmin, salesPerms: permissions(allowed) };
  return render(
    <MemoryRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
      <TooltipProvider>
        <SidebarProvider defaultOpen>
          <AdminSidebar />
        </SidebarProvider>
      </TooltipProvider>
    </MemoryRouter>,
  );
}

function renderProtected(auth: Record<string, unknown>) {
  mocks.auth = auth;
  render(
    <MemoryRouter
      initialEntries={["/admin/customer-balances"]}
      future={{ v7_startTransition: true, v7_relativeSplatPath: true }}
    >
      <Routes>
        <Route path="/auth" element={<div>صفحة الدخول</div>} />
        <Route
          path="/admin/customer-balances"
          element={
            <ProtectedRoute requirePerm="can_manage_customer_balances">
              <div>القسم المحمي</div>
            </ProtectedRoute>
          }
        />
      </Routes>
    </MemoryRouter>,
  );
}

describe("customer balance navigation protection", () => {
  beforeEach(() => vi.clearAllMocks());

  it("shows the navigation link to admins", () => {
    renderSidebar(true);
    expect(screen.getByRole("link", { name: "أرصدة العملاء" })).toHaveAttribute(
      "href",
      "/admin/customer-balances",
    );
  });

  it("shows the link only to sales staff with the independent permission", () => {
    const { unmount } = renderSidebar(false, true);
    expect(screen.getByRole("link", { name: "أرصدة العملاء" })).toBeInTheDocument();
    unmount();

    renderSidebar(false, false);
    expect(screen.queryByRole("link", { name: "أرصدة العملاء" })).not.toBeInTheDocument();
  });

  it("returns 403 for a signed-in user without permission", () => {
    renderProtected({
      session: { user: { id: "sales-1" } },
      isAdmin: false,
      isStaff: true,
      salesPerms: permissions(false),
      loading: false,
    });
    expect(screen.getByRole("heading", { name: "403" })).toBeInTheDocument();
    expect(screen.queryByText("القسم المحمي")).not.toBeInTheDocument();
  });

  it("allows admin or explicitly permitted sales access", () => {
    renderProtected({
      session: { user: { id: "sales-1" } },
      isAdmin: false,
      isStaff: true,
      salesPerms: permissions(true),
      loading: false,
    });
    expect(screen.getByText("القسم المحمي")).toBeInTheDocument();
  });

  it("redirects anonymous users to sign in", () => {
    renderProtected({
      session: null,
      isAdmin: false,
      isStaff: false,
      salesPerms: permissions(false),
      loading: false,
    });
    expect(screen.getByText("صفحة الدخول")).toBeInTheDocument();
  });
});
