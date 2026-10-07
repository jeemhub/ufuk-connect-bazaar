import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { SiteContextMenu } from "./SiteContextMenu";
import type { Product } from "@/data/mockData";

const mocks = vi.hoisted(() => ({ add: vi.fn(), compare: [] as string[], toggle: vi.fn() }));
vi.mock("@/i18n/LanguageContext", () => ({ useLanguage: () => ({ lang: "ar" }) }));
vi.mock("@/auth/AuthProvider", () => ({ useAuth: () => ({ pricingTier: "dealer" }) }));
vi.mock("@/cart/CartContext", () => ({ useCart: () => ({ add: mocks.add, setOpen: vi.fn(), count: 0 }) }));
vi.mock("@/catalog/SelectionContext", () => ({ useSelection: () => ({ compare: mocks.compare, quote: {}, toggleCompare: mocks.toggle, setQuoteQty: vi.fn() }) }));
vi.mock("sonner", () => ({ toast: { success: vi.fn(), error: vi.fn() } }));
const product = { id: "p1", nameAr: "منتج اختبار", nameEn: "Test", image: "/test.png", stock: 5, priceIqd: 10000, priceDealerIqd: 8000 } as Product;
function mount(value = product) {
  render(<MemoryRouter><SiteContextMenu><div><input aria-label="بحث" /><SiteContextMenu product={value}><article>منتج اختبار</article></SiteContextMenu></div></SiteContextMenu></MemoryRouter>);
}
class TestRect {
  constructor(public x = 0, public y = 0, public width = 0, public height = 0) {}
  get top() { return this.y; } get left() { return this.x; }
  get bottom() { return this.y + this.height; } get right() { return this.x + this.width; }
  static fromRect(rect: DOMRectInit = {}) { return new TestRect(rect.x, rect.y, rect.width, rect.height); }
}
Object.defineProperty(window, "DOMRect", { configurable: true, value: TestRect });
beforeEach(() => { vi.clearAllMocks(); mocks.compare = []; });
afterEach(cleanup);
describe("storefront context menu", () => {
  it("opens only the product menu inside the site menu and uses the customer's price tier", () => {
    mount(); fireEvent.contextMenu(screen.getByRole("article"), { button: 2, clientX: 50, clientY: 50 });
    expect(screen.getAllByRole("menu")).toHaveLength(1);
    fireEvent.click(screen.getByRole("menuitem", { name: "أضف للسلة" }));
    expect(mocks.add).toHaveBeenCalledWith(expect.objectContaining({ id: "p1", priceIqd: 8000 }));
  });
  it("does not replace native editing menus", () => {
    mount(); fireEvent.contextMenu(screen.getByRole("textbox")); expect(screen.queryByRole("menu")).not.toBeInTheDocument();
  });
  it("blocks cart addition for unavailable products", () => {
    mount({ ...product, stock: 0 }); fireEvent.contextMenu(screen.getByRole("article"));
    expect(screen.getByRole("menuitem", { name: "المنتج نافد" })).toHaveAttribute("aria-disabled", "true");
    expect(mocks.add).not.toHaveBeenCalled();
  });
  it("requires a quote for products without a price", () => {
    mount({ ...product, priceIqd: 0, priceDealerIqd: 0 }); fireEvent.contextMenu(screen.getByRole("article"));
    expect(screen.getByRole("menuitem", { name: "السعر عند الطلب" })).toHaveAttribute("aria-disabled", "true");
    expect(screen.getByRole("menuitem", { name: "أضف لعرض السعر" })).not.toHaveAttribute("aria-disabled", "true");
  });
  it("honors the three-product comparison limit", () => {
    mocks.compare = ["p2", "p3", "p4"]; mount(); fireEvent.contextMenu(screen.getByRole("article"));
    expect(screen.getByRole("menuitem", { name: "المقارنة ممتلئة (3 منتجات)" })).toHaveAttribute("aria-disabled", "true");
  });
});
