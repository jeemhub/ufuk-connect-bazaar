import { beforeEach, describe, expect, it, vi } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { ProductCard } from "./ProductCard";
import type { Product } from "@/data/mockData";
const state = vi.hoisted(() => ({ tier: "retail" }));
vi.mock("@/auth/AuthProvider", () => ({ useAuth: () => ({ pricingTier: state.tier }) }));
vi.mock("@/i18n/LanguageContext", () => ({ useLanguage: () => ({lang:"ar",t:(s:string)=>s}) }));
vi.mock("./SiteContextMenu", () => ({SiteContextMenu:({children}:{children:React.ReactNode})=>children}));
vi.mock("./ProductActions", () => ({ProductActions:()=>null}));
vi.mock("./AddToCartButton", () => ({AddToCartButton:()=>null}));
const product = {id:"p1",nameAr:"منتج",nameEn:"Product",brand:"MikroTik",sku:"TEST",image:"/test.png",stock:10,priceIqd:10000,priceWholesaleIqd:8000,priceDealerIqd:7000} as Product;
beforeEach(cleanup);
describe("brand pricing in product cards",()=>{
  it.each(["retail","wholesale","dealer"])("hides every stale price when ON for %s",tier=>{
    state.tier=tier;
    render(<MemoryRouter><ProductCard product={{...product,priceUnstable:true}}/></MemoryRouter>);
    expect(screen.getByText(/السعر غير مستقر/)).toBeInTheDocument();
    for(const price of ["10,000","8,000","7,000"]) expect(screen.queryByText(price)).not.toBeInTheDocument();
  });
  it.each([["retail",false,false],["wholesale",true,false],["dealer",true,true]])("shows the complete eligible tiers when OFF for %s",(tier,wholesale,dealer)=>{
    state.tier=tier as string;
    render(<MemoryRouter><ProductCard product={{...product,priceUnstable:false}}/></MemoryRouter>);
    expect(screen.getByText("10,000")).toBeInTheDocument();
    expect(!!screen.queryByText("8,000")).toBe(wholesale);
    expect(!!screen.queryByText("7,000")).toBe(dealer);
  });
});
