import { beforeEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import AdminBrands from "./Brands";
const mocks=vi.hoisted(()=>({update:vi.fn(),single:vi.fn(),refresh:vi.fn(),error:vi.fn(),success:vi.fn()}));
vi.mock("@/hooks/useBrands",()=>({useBrands:()=>({brands:[{id:"brand1",name:"MikroTik",slug:"mikrotik",is_active:true,price_unstable:false}],loading:false,refresh:mocks.refresh})}));
vi.mock("@/i18n/LanguageContext",()=>({useLanguage:()=>({lang:"ar",t:(key:string)=>key})}));
vi.mock("@/integrations/supabase/client",()=>({supabase:{from:()=>({update:mocks.update})}}));
vi.mock("sonner",()=>({toast:{error:mocks.error,success:mocks.success}}));
beforeEach(()=>{cleanup();vi.clearAllMocks();mocks.update.mockReturnValue({eq:()=>({select:()=>({single:mocks.single})})});});
describe("admin brand price switch",()=>{
  it("saves ON for the selected brand before refreshing",async()=>{
    mocks.single.mockResolvedValue({data:{id:"brand1"},error:null});
    render(<AdminBrands/>);
    const toggle=screen.getByRole("switch",{name:"MikroTik: السعر غير مستقر"});
    expect(toggle).toHaveAttribute("aria-checked","false");
    fireEvent.click(toggle);
    await waitFor(()=>expect(mocks.refresh).toHaveBeenCalled());
    expect(mocks.update).toHaveBeenCalledWith({price_unstable:true});
    expect(mocks.success).toHaveBeenCalled();
  });
  it("keeps OFF and shows an error when the database rejects the change",async()=>{
    mocks.single.mockResolvedValue({data:null,error:{message:"Denied"}});
    render(<AdminBrands/>);
    fireEvent.click(screen.getByRole("switch",{name:"MikroTik: السعر غير مستقر"}));
    await waitFor(()=>expect(mocks.error).toHaveBeenCalled());
    expect(mocks.refresh).not.toHaveBeenCalled();
    expect(screen.getByRole("switch",{name:"MikroTik: السعر غير مستقر"})).toHaveAttribute("aria-checked","false");
  });
});
