import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { MemoryRouter } from "react-router-dom";
import Products from "./Products";

vi.mock("@/i18n/LanguageContext", () => ({ useLanguage: () => ({ lang: "ar", t: (key: string) => key }) }));
vi.mock("@/auth/AuthProvider", () => ({ useAuth: () => ({ isAdmin: true }) }));
vi.mock("@/hooks/useBrands", () => ({ useBrands: () => ({ brands: [] }) }));
vi.mock("@/integrations/supabase/client", () => ({ supabase: {
  from: () => ({ select: () => ({ data: [], order: async () => ({ data: [] }) }) }),
} }));
vi.mock("@/hooks/useProducts", async (importOriginal) => {
  const original = await importOriginal<typeof import("@/hooks/useProducts")>();
  const rows = [
    ["نفد", 0, true], ["سالب", -1, true], ["قليل", 1, true],
    ["اربعة", 4, true], ["كاف", 5, true], ["مستور", 0, false],
  ].map(([name, stock, active]) => ({
    id: name, sku: name, name_ar: name, name_en: name, name_data: null,
    desc_ar: "description", desc_en: "description", brand: "MikroTik",
    category_id: null, subcategory: null, price_iqd: 100, stock,
    image_url: null, datasheet_url: null, datasheet_name: null, is_active: active,
  }));
  return { ...original, useAdminProducts: () => ({ rows, loading: false, refetch: vi.fn() }) };
});

afterEach(cleanup);
function open(query = "") {
  return render(<MemoryRouter initialEntries={[`/admin/products${query}`]}><Products /></MemoryRouter>);
}
const hasProduct = (name: string) => screen.queryByRole("row", { name: new RegExp(name) });

describe("admin product stock filters", () => {
  it("hides inactive products initially and allows the user to show them", async () => {
    open();
    await waitFor(() => expect(hasProduct("كاف")).toBeInTheDocument());
    expect(screen.getByRole("switch", { name: "إظهار المنتجات المخفية" })).not.toBeChecked();
    expect(hasProduct("مستور")).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole("switch", { name: "إظهار المنتجات المخفية" }));
    expect(hasProduct("مستور")).toBeInTheDocument();
  });

  it("shows only unavailable products for the out-of-stock URL filter", async () => {
    open("?filter=out_of_stock");
    await waitFor(() => expect(hasProduct("نفد")).toBeInTheDocument());
    expect(hasProduct("سالب")).toBeInTheDocument();
    expect(hasProduct("قليل")).not.toBeInTheDocument();
    expect(hasProduct("كاف")).not.toBeInTheDocument();
    expect(hasProduct("مستور")).not.toBeInTheDocument();
    expect(screen.getByRole("combobox", { name: "حالة المخزون" })).toBeInTheDocument();
  });

  it("keeps the low-stock link working and excludes zero and quantities of five", async () => {
    open("?filter=low_stock");
    await waitFor(() => expect(hasProduct("قليل")).toBeInTheDocument());
    expect(hasProduct("اربعة")).toBeInTheDocument();
    expect(hasProduct("نفد")).not.toBeInTheDocument();
    expect(hasProduct("سالب")).not.toBeInTheDocument();
    expect(hasProduct("كاف")).not.toBeInTheDocument();
  });
});
