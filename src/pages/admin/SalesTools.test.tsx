import { beforeEach, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import SalesTools from "./SalesTools";
const state=vi.hoisted(()=>({rate:1750,percentage:10,mode:"parallel",save:vi.fn(),savePercentage:vi.fn(),saveMode:vi.fn()}));
vi.mock("@/i18n/LanguageContext",()=>({useLanguage:()=>({lang:"ar"})}));
vi.mock("@/features/sales-tools/useExchangeRate",()=>({useExchangeRate:()=>({query:{isPending:false,isError:false,isSuccess:true,data:{rate:state.rate,percentage:state.percentage,mode:state.mode,updatedAt:"2026-10-07T12:00:00Z"}},save:{isPending:false,mutate:state.save},savePercentage:{isPending:false,mutate:state.savePercentage},saveMode:{isPending:false,mutate:state.saveMode}})}));
beforeEach(()=>{cleanup();vi.clearAllMocks();state.rate=1750;state.percentage=10;state.mode="parallel";});
it("calculates both results immediately and saves the edited rate for everyone",()=>{
  render(<SalesTools/>);
  fireEvent.change(screen.getByLabelText(/سعر المنتج بالدينار/),{target:{value:"٣٠٠٠٠٠"}});
  expect(screen.getByLabelText("السعر بالدولار")).toHaveTextContent("200 $");
  expect(screen.getByLabelText("السعر النهائي بالدينار")).toHaveTextContent("350,000 IQD");
  fireEvent.change(screen.getByLabelText(/سعر الصرف اليوم/),{target:{value:"1800"}});
  expect(screen.getByLabelText("السعر النهائي بالدينار")).toHaveTextContent("360,000 IQD");
  expect(state.save).not.toHaveBeenCalled();
  fireEvent.click(screen.getByRole("button",{name:"حفظ للجميع"}));
  expect(state.save).toHaveBeenCalledWith(1800,expect.any(Object));
});
it("updates a clean rate when another employee changes the shared setting",()=>{
  const {rerender}=render(<SalesTools/>);
  fireEvent.change(screen.getByLabelText(/سعر المنتج بالدينار/),{target:{value:"300000"}});
  state.rate=1800;rerender(<SalesTools/>);
  expect(screen.getByLabelText(/سعر الصرف اليوم/)).toHaveValue("1800");
  expect(screen.getByLabelText("السعر النهائي بالدينار")).toHaveTextContent("360,000 IQD");
});
it("preserves an unsaved preview while disabling invalid rate saves",()=>{
  const {rerender}=render(<SalesTools/>);
  fireEvent.change(screen.getByLabelText(/سعر الصرف اليوم/),{target:{value:"1900"}});
  state.rate=1800;rerender(<SalesTools/>);
  expect(screen.getByLabelText(/سعر الصرف اليوم/)).toHaveValue("1900");
  fireEvent.change(screen.getByLabelText(/سعر الصرف اليوم/),{target:{value:"0"}});
  expect(screen.getByRole("button",{name:"حفظ للجميع"})).toBeDisabled();
  expect(screen.getByLabelText("السعر النهائي بالدينار")).toHaveTextContent("—");
});

it("previews percentage in the original currency and saves shared percentage and mode",()=>{
 render(<SalesTools/>);
 fireEvent.change(screen.getByLabelText("سعر المنتج قبل الزيادة"),{target:{value:"100"}});
 fireEvent.change(screen.getByLabelText("العملة"),{target:{value:"USD"}});
 expect(screen.getByLabelText("السعر بعد النسبة المئوية")).toHaveTextContent("110 $");
 fireEvent.change(screen.getByLabelText("نسبة الزيادة (%)"),{target:{value:"20"}});
 expect(screen.getByLabelText("السعر بعد النسبة المئوية")).toHaveTextContent("120 $");
 fireEvent.click(screen.getByRole("button",{name:"حفظ نسبة الزيادة"}));
 expect(state.savePercentage).toHaveBeenCalledWith(20,expect.any(Object));
 fireEvent.change(screen.getByLabelText("طريقة حساب السعر الأحمر"),{target:{value:"percentage"}});
 expect(state.saveMode).toHaveBeenCalledWith("percentage",expect.any(Object));
});
it("refreshes shared percentage without overwriting an unsaved draft",()=>{
 const {rerender}=render(<SalesTools/>);
 state.percentage=15;rerender(<SalesTools/>);
 expect(screen.getByLabelText("نسبة الزيادة (%)")).toHaveValue("15");
 fireEvent.change(screen.getByLabelText("نسبة الزيادة (%)"),{target:{value:"25"}});
 state.percentage=30;rerender(<SalesTools/>);
 expect(screen.getByLabelText("نسبة الزيادة (%)")).toHaveValue("25");
 fireEvent.change(screen.getByLabelText("نسبة الزيادة (%)"),{target:{value:"-1"}});
 expect(screen.getByRole("button",{name:"حفظ نسبة الزيادة"})).toBeDisabled();
});
