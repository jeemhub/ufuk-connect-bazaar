import { beforeEach, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { SelectionProvider } from "@/catalog/SelectionContext";
import QuotePage from "./QuotePage";

const mocks=vi.hoisted(()=>({insert:vi.fn(),download:vi.fn()}));
vi.mock("@/integrations/supabase/client",()=>({supabase:{from:()=>({insert:mocks.insert})}}));
vi.mock("@/auth/AuthProvider",()=>({useAuth:()=>({pricingTier:"wholesale"})}));
vi.mock("@/i18n/LanguageContext",()=>({useLanguage:()=>({lang:"ar",t:(key:string)=>key})}));
vi.mock("@/lib/quotePdf",()=>({downloadQuoteSummary:mocks.download}));
vi.mock("@/hooks/useProducts",()=>({useProduct:()=>({product:null}),useProducts:()=>({loading:false,error:null,products:[
  {id:"one",nameAr:"سويتش",priceIqd:100,priceWholesaleIqd:80,sku:"SW"},
  {id:"two",nameAr:"بطارية",priceIqd:200,priceWholesaleIqd:180,sku:"BAT"},
]})}));
vi.mock("sonner",()=>({toast:{error:vi.fn(),success:vi.fn()}}));
beforeEach(()=>{cleanup();vi.clearAllMocks();localStorage.clear();localStorage.setItem("ufuk-selections-v1",JSON.stringify({compare:[],quote:{one:3,two:2}}));});
it("keeps all selected product quantities in the submitted quote and clears them only after saving",async()=>{
  mocks.insert.mockResolvedValue({error:null});
  render(<MemoryRouter><SelectionProvider><QuotePage/></SelectionProvider></MemoryRouter>);
  expect(screen.getByText(/600 IQD/)).toBeInTheDocument();
  fireEvent.change(screen.getByLabelText(/full_name/),{target:{value:"Test customer"}});
  fireEvent.change(screen.getByLabelText(/phone_label/),{target:{value:"٠٧٧١٦٩٩٢٩٥٥"}});
  fireEvent.click(screen.getByRole("button",{name:"submit"}));
  await waitFor(()=>expect(mocks.insert).toHaveBeenCalled());
  const payload=mocks.insert.mock.calls[0][0];expect(payload.phone).toBe("07716992955");
  expect(payload.message).toContain("SKU: SW | الكمية: 3");expect(payload.message).toContain("SKU: BAT | الكمية: 2");
  await waitFor(()=>expect(JSON.parse(localStorage.getItem("ufuk-selections-v1")!).quote).toEqual({}));
});
it("uses the displayed summary for PDF export without submitting the sales request",async()=>{
  render(<MemoryRouter><SelectionProvider><QuotePage/></SelectionProvider></MemoryRouter>);
  fireEvent.click(screen.getByRole("button",{name:"تنزيل ملخص الطلب PDF"}));
  await waitFor(()=>expect(mocks.download).toHaveBeenCalled());
  expect(mocks.download.mock.calls[0][0].textContent).toContain("سويتش");
  expect(mocks.insert).not.toHaveBeenCalled();
});
