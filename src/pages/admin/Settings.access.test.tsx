import { cleanup, render, screen } from "@testing-library/react";
import { beforeEach, expect, it, vi } from "vitest";
import Settings from "./Settings";
const state=vi.hoisted(()=>({isAdmin:false}));
vi.mock("@/auth/AuthProvider",()=>({useAuth:()=>({isAdmin:state.isAdmin})}));
vi.mock("@/i18n/LanguageContext",()=>({useLanguage:()=>({lang:"ar",t:(key:string)=>key})}));
vi.mock("@/components/admin/PointerSettings",()=>({PointerSettings:()=> <p>حركة الفأرة الشخصية</p>}));
vi.mock("@/components/admin/GlobalPriceSettings",()=>({GlobalPriceSettings:()=> <p>السعر غير مستقر لكل الموقع</p>}));
vi.mock("@/components/admin/GlassThemeSettings",()=>({GlassThemeSettings:()=> <p>الثيم</p>}));
vi.mock("@/components/admin/CommerceSettings",()=>({CommerceSettings:()=> <p>إعدادات المتجر العامة</p>}));
vi.mock("@/components/admin/ProductDetailsSettings",()=>({ProductDetailsSettings:()=>null}));
beforeEach(cleanup);
it("lets sales employees access personal settings without admin controls",()=>{
  state.isAdmin=false;render(<Settings/>);
  expect(screen.getByText("حركة الفأرة الشخصية")).toBeInTheDocument();
  expect(screen.queryByText("السعر غير مستقر لكل الموقع")).not.toBeInTheDocument();
  expect(screen.queryByText("إعدادات المتجر العامة")).not.toBeInTheDocument();
  expect(screen.queryByRole("button",{name:"حذف الكل"})).not.toBeInTheDocument();
});
it("shows global pricing controls for the administrator",()=>{
  state.isAdmin=true;render(<Settings/>);
  expect(screen.getByText("السعر غير مستقر لكل الموقع")).toBeInTheDocument();
  expect(screen.getByText("حركة الفأرة الشخصية")).toBeInTheDocument();
});
