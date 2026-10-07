import { beforeEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { AddToCartButton } from "./AddToCartButton";
import { CartDrawer } from "./CartDrawer";
import { ProductActions } from "./ProductActions";
import { SelectionProvider } from "@/catalog/SelectionContext";
import type { Product } from "@/data/mockData";

const mocks = vi.hoisted(() => ({unstable:false,add:vi.fn(),clear:vi.fn(),rpc:vi.fn(),invoice:vi.fn()}));
vi.mock("@/i18n/LanguageContext",()=>({useLanguage:()=>({lang:"ar"})}));
vi.mock("@/auth/AuthProvider",()=>({useAuth:()=>({pricingTier:"retail"})}));
vi.mock("@/cart/CartContext",()=>({useCart:()=>({
  add:mocks.add,clear:mocks.clear,setOpen:vi.fn(),setQty:vi.fn(),remove:vi.fn(),isOpen:true,
  items:[{id:"p1",name:"منتج اختبار",priceIqd:999,quantity:2}],count:2,totalIqd:1998,
})}));
vi.mock("@/hooks/useCartPrices",()=>({useCartPrices:()=>({prices:{p1:{price:mocks.unstable?0:12000,unstable:mocks.unstable}},loading:false})}));
vi.mock("@/hooks/useCommerceSettings",()=>({useCommerceSettings:()=>({settings:{zones:[],payments:"",delivery:""}})}));
vi.mock("@/integrations/supabase/client",()=>({supabase:{rpc:mocks.rpc}}));
vi.mock("@/lib/invoice",()=>({generateInvoicePdf:mocks.invoice,resolveEnglishNames:async()=>({p1:"Test product"})}));
vi.mock("sonner",()=>({toast:{success:vi.fn(),error:vi.fn()}}));

beforeEach(()=>{mocks.unstable=false;cleanup();localStorage.clear();vi.clearAllMocks();});
describe("storefront purchasing workflows",()=>{
  it("takes zero-priced products to a quote and never adds them to the cart",()=>{
    render(<MemoryRouter><Routes><Route path="/" element={<AddToCartButton product={{id:"p0",stock:1,priceIqd:0} as Product} />} /><Route path="/quote" element={<p>طلب السعر</p>} /></Routes></MemoryRouter>);
    fireEvent.click(screen.getByRole("button",{name:"استفسر عن السعر"}));
    expect(screen.getByText("طلب السعر")).toBeInTheDocument();expect(mocks.add).not.toHaveBeenCalled();
  });
  it("limits comparison to three products while keeping quote selection independent",()=>{
    render(<MemoryRouter><SelectionProvider>{["1","2","3","4"].map(id=><ProductActions key={id} id={id}/>)}</SelectionProvider></MemoryRouter>);
    for(let i=0;i<3;i++)fireEvent.click(screen.getAllByRole("button",{name:"قارن"})[0]);
    expect(screen.getByRole("button",{name:"قارن"})).toBeDisabled();
    fireEvent.click(screen.getAllByRole("button",{name:"أضف للعرض"})[3]);
    expect(JSON.parse(localStorage.getItem("ufuk-selections-v1")!)).toEqual({compare:["1","2","3"],quote:{"4":1}});
  });
  it("submits an atomic guest order with IDs and quantities, and uses server totals for the receipt",async()=>{
    mocks.rpc.mockResolvedValue({error:null,data:{order_no:"ORD-test",created_at:"2026-10-07T09:00:00Z",notes:"Delivery fee to be confirmed",total_iqd:24000,items:[{id:"p1",name:"Test product",quantity:2,unitPriceIqd:12000}]}});
    render(<MemoryRouter><SelectionProvider><CartDrawer/></SelectionProvider></MemoryRouter>);
    expect(screen.getByRole("dialog")).toHaveAttribute("dir","rtl");
    fireEvent.click(screen.getByRole("button",{name:"إكمال الطلب"}));
    fireEvent.change(screen.getByLabelText(/الاسم الكامل/),{target:{value:"عميل اختبار"}});
    fireEvent.change(screen.getByLabelText(/رقم الهاتف/),{target:{value:"٠٧٧١٦٩٩٢٩٥٥"}});
    fireEvent.change(screen.getByLabelText(/عنوان/),{target:{value:"البصرة"}});
    fireEvent.click(screen.getByRole("button",{name:/إرسال الطلب|تأكيد الطلب/}));
    await waitFor(()=>expect(mocks.clear).toHaveBeenCalled());
    expect(mocks.rpc).toHaveBeenCalledWith("place_order",expect.objectContaining({p_phone:"07716992955",p_items:[{id:"p1",quantity:2}]}));
    expect(mocks.invoice).toHaveBeenCalledWith(expect.objectContaining({totalIqd:24000,items:[{name:"Test product",quantity:2,unitPriceIqd:12000}]}));
  });
  it("hides persisted cart prices and blocks checkout when the brand becomes unstable",()=>{
    mocks.unstable=true;
    render(<MemoryRouter><SelectionProvider><CartDrawer/></SelectionProvider></MemoryRouter>);
    expect(screen.queryByText(/999|1,998|١٬٩٩٩/)).not.toBeInTheDocument();
    expect(screen.getAllByText(/السعر غير مستقر/).length).toBeGreaterThan(0);
    expect(screen.getByRole("button",{name:"إكمال الطلب"})).toBeDisabled();
    const quoteLink = screen.getByRole("link",{name:"تواصل لطلب عرض سعر"});
    expect(quoteLink).toHaveAttribute("href","/quote");
    fireEvent.click(quoteLink);
    expect(JSON.parse(localStorage.getItem("ufuk-selections-v1")!).quote).toEqual({p1:2});
  });
  it("preserves the cart when saving fails",async()=>{
    mocks.rpc.mockResolvedValue({data:null,error:new Error("unavailable")});
    render(<MemoryRouter><SelectionProvider><CartDrawer/></SelectionProvider></MemoryRouter>);
    fireEvent.click(screen.getByRole("button",{name:"إكمال الطلب"}));
    fireEvent.change(screen.getByLabelText(/الاسم الكامل/),{target:{value:"عميل اختبار"}});
    fireEvent.change(screen.getByLabelText(/رقم الهاتف/),{target:{value:"07716992955"}});
    fireEvent.change(screen.getByLabelText(/عنوان/),{target:{value:"البصرة"}});
    fireEvent.click(screen.getByRole("button",{name:/إرسال الطلب|تأكيد الطلب/}));
    await waitFor(()=>expect(mocks.rpc).toHaveBeenCalled());expect(mocks.clear).not.toHaveBeenCalled();expect(mocks.invoice).not.toHaveBeenCalled();
  });
});
