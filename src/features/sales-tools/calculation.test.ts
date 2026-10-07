import { describe, expect, it } from "vitest";
import { calculateParallelPrice, parseAmount } from "./calculation";
describe("parallel exchange calculation",()=>{
  it("matches the requested 300000 / 1500 * 1750 calculation",()=>{
    expect(calculateParallelPrice(300000,1750)).toEqual({dollars:200,dinars:350000});
    expect(calculateParallelPrice(300000,1500)).toEqual({dollars:200,dinars:300000});
  });
  it("accepts Arabic digits and digit separators",()=>{
    expect(parseAmount("٣٠٠٬٠٠٠")).toBe(300000);
    expect(parseAmount("۱۷۵۰٫۵")).toBe(1750.5);
    expect(calculateParallelPrice(300000,1750.5)?.dinars).toBe(350100);
  });
  it.each(["", "-100", "abc", "1e9", "1.23456"])("rejects invalid amounts %s",value=>expect(parseAmount(value)).toBeNull());
  it.each([[null,1750],[300000,null],[300000,0],[300000,-1],[300000,Infinity],[300000,100001],[-100,1750]])("does not calculate invalid or unset amounts %j",(price,rate)=>expect(calculateParallelPrice(price,rate)).toBeNull());
  it("keeps a zero product price valid",()=>expect(calculateParallelPrice(0,1750)).toEqual({dollars:0,dinars:0}));
});
