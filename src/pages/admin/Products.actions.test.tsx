import { afterEach, describe, expect, it, vi } from "vitest";
import { act, cleanup, fireEvent, render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import Products from "./Products";
const row = vi.hoisted(() => ({id:"p1",nameAr:"منتج اختبار",nameEn:"Test",name_data:"DATA name",stock:5,priceIqd:10000,brand:"Test",category:"networking",subcategory:"Routers",image:"/test.png",is_active:true}));
vi.mock("@/hooks/useProducts",()=>({useAdminProducts:()=>({rows:[row],loading:false,refetch:vi.fn()}),dbToProduct:(value:unknown)=>value}));
vi.mock("@/hooks/useBrands",()=>({useBrands:()=>({brands:[]})}));
vi.mock("@/auth/AuthProvider",()=>({useAuth:()=>({isAdmin:true,isSales:false})}));
vi.mock("@/i18n/LanguageContext",()=>({useLanguage:()=>({lang:"ar",t:(key:string)=>key})}));
vi.mock("@/integrations/supabase/client",()=>({supabase:{from:()=>({select:()=>({order:async()=>({data:[]})})})}}));
vi.mock("@/components/admin/ImportProductsDialog",()=>({ImportProductsDialog:()=>null}));
vi.mock("@/components/admin/ImportProductsFullDialog",()=>({ImportProductsFullDialog:()=>null}));
vi.mock("@/components/admin/ImageCropper",()=>({ImageCropper:()=>null}));
afterEach(cleanup);
describe("admin product action menu",()=>{
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
