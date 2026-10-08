import { beforeEach, afterEach, describe, expect, it, vi } from "vitest";
import { act, cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import Products from "./Products";
const pdfState=vi.hoisted(()=>({export:vi.fn()}));
vi.mock("@/lib/exportProductsPdf",()=>({exportProductsToPdf:pdfState.export}));
const pricing=vi.hoisted(()=>({mode:"parallel",percentage:10,saveMode:vi.fn()}));
const row = vi.hoisted(() => ({id:"p1",nameAr:"منتج اختبار",nameEn:"Test",name_data:"DATA name",stock:5,priceIqd:150000,price_wholesale_iqd:120000,price_dealer_iqd:90000,brand:"Test",category:"networking",subcategory:"Routers",image:"/test.png",is_active:true}));
vi.mock("@/hooks/useProducts",()=>({useAdminProducts:()=>({rows:[row],loading:false,refetch:vi.fn()}),dbToProduct:(value:unknown)=>value}));
vi.mock("@/features/sales-tools/useExchangeRate",()=>({useExchangeRate:()=>({query:{data:{rate:1750,mode:pricing.mode,percentage:pricing.percentage},isSuccess:true,isPending:false,isError:false},saveMode:{isPending:false,mutate:pricing.saveMode}})}));
vi.mock("@/hooks/useBrands",()=>({useBrands:()=>({brands:[]})}));
vi.mock("@/auth/AuthProvider",()=>({useAuth:()=>({isAdmin:true,isSales:false})}));
vi.mock("@/i18n/LanguageContext",()=>({useLanguage:()=>({lang:"ar",t:(key:string)=>key})}));
vi.mock("@/integrations/supabase/client",()=>({supabase:{from:()=>({select:()=>({order:async()=>({data:[]})})})}}));
vi.mock("@/components/admin/ImportProductsDialog",()=>({ImportProductsDialog:()=>null}));
vi.mock("@/components/admin/ImportProductsFullDialog",()=>({ImportProductsFullDialog:()=>null}));
vi.mock("@/components/admin/ImageCropper",()=>({ImageCropper:()=>null}));
afterEach(cleanup);
beforeEach(()=>{pricing.mode="parallel";pricing.percentage=10;vi.clearAllMocks();});
describe("admin product action menu",()=>{
  it("shows the parallel conversion next to each expanded selling tier",async()=>{
    await act(async()=>{render(<MemoryRouter><Products/></MemoryRouter>);});
    fireEvent.click(screen.getByText("منتج اختبار"));
    expect(screen.getAllByText("175,000 د.ع")).toHaveLength(2);
    expect(screen.getByText("140,000 د.ع")).toBeInTheDocument();
    expect(screen.getByText("105,000 د.ع")).toBeInTheDocument();
    for(const value of ["175,000 د.ع","140,000 د.ع","105,000 د.ع"]){
      expect(screen.getAllByText(value)[0].parentElement).toHaveClass("text-red-600");
    }
  });
  it("opens actions without expanding the product row and requires confirmation before deletion",async()=>{
    await act(async () => { render(<MemoryRouter><Products/></MemoryRouter>); });
    const trigger=screen.getByRole("button",{name:"إجراءات المنتج"});
    fireEvent.keyDown(trigger,{key:"Enter"});
    expect(screen.getByRole("menuitem",{name:"تعديل المنتج"})).toBeInTheDocument();
    expect(screen.getByRole("menuitem",{name:"إخفاء المنتج"})).toBeInTheDocument();
    expect(screen.queryByText("سعر المفرد")).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole("menuitem",{name:"حذف المنتج"}));
    expect(screen.getByRole("alertdialog")).toBeInTheDocument();
  });
});

it("switches all selling tiers to percentage calculation and reacts to shared changes",async()=>{
 pricing.mode="percentage";
 let rendered:ReturnType<typeof render>;
 await act(async()=>{rendered=render(<MemoryRouter><Products/></MemoryRouter>);});
 fireEvent.click(screen.getByText("منتج اختبار"));
 expect(screen.getAllByText("165,000 د.ع")).toHaveLength(2);
 expect(screen.getByText("132,000 د.ع")).toBeInTheDocument();
 expect(screen.getByText("99,000 د.ع")).toBeInTheDocument();
 pricing.percentage=20;
 await act(async()=>{rendered.rerender(<MemoryRouter><Products/></MemoryRouter>);});
 expect(screen.getByText("144,000 د.ع")).toBeInTheDocument();
 fireEvent.change(screen.getByLabelText("طريقة حساب السعر الأحمر"),{target:{value:"parallel"}});
 expect(pricing.saveMode).toHaveBeenCalledWith("parallel",expect.any(Object));
});

it("groups import/export actions and supports independent filters",async()=>{
 await act(async()=>{render(<MemoryRouter><Products/></MemoryRouter>);});
 expect(screen.queryByRole("button",{name:"تصدير Excel"})).not.toBeInTheDocument();
 fireEvent.keyDown(screen.getByRole("button",{name:"استيراد وتصدير"}),{key:"Enter"});
 expect(screen.getByRole("menuitem",{name:"تصدير Excel"})).toBeInTheDocument();
 expect(screen.getByRole("menuitem",{name:"استيراد تحديث كامل"})).toBeInTheDocument();
 expect(screen.getByRole("menuitem",{name:"استيراد الرصيد فقط"})).toBeInTheDocument();
 fireEvent.keyDown(screen.getByRole("menu"),{key:"Escape"});
 fireEvent.keyDown(screen.getByRole("button",{name:"فلاتر المنتجات"}),{key:"Enter"});
 expect(screen.getAllByRole("menuitemcheckbox")).toHaveLength(5);
 fireEvent.click(screen.getByRole("menuitemcheckbox",{name:"بدون سعر"}));
 expect(screen.getByRole("menuitemcheckbox",{name:"بدون سعر"})).toHaveAttribute("aria-checked","true");
 expect(screen.queryByText("منتج اختبار")).not.toBeInTheDocument();
 fireEvent.click(screen.getByRole("menuitemcheckbox",{name:"بدون سعر"}));
 expect(screen.getByText("منتج اختبار")).toBeInTheDocument();
});
it("shows progress and prevents duplicate PDF exports until download completes",async()=>{
 let finish!:(n:number)=>void;
 pdfState.export.mockImplementation(({onProgress})=>{onProgress(50);return new Promise<number>(resolve=>{finish=resolve;});});
 await act(async()=>{render(<MemoryRouter><Products/></MemoryRouter>);});
 fireEvent.click(screen.getByRole("button",{name:"طباعة / تصدير تقرير PDF"}));
 await waitFor(()=>expect(screen.getByRole("button",{name:"جارٍ التصدير… 50%"})).toBeDisabled());
 expect(screen.getByRole("button",{name:"جارٍ التصدير… 50%"})).toHaveAttribute("aria-busy","true");
 expect(pdfState.export).toHaveBeenCalledTimes(1);
 await act(async()=>{finish(1);});
 expect(screen.getByRole("button",{name:"طباعة / تصدير تقرير PDF"})).toBeEnabled();
});
