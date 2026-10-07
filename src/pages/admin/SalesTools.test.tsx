import { beforeEach, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import SalesTools from "./SalesTools";
const state=vi.hoisted(()=>({rate:1750,save:vi.fn()}));
vi.mock("@/i18n/LanguageContext",()=>({useLanguage:()=>({lang:"ar"})}));
vi.mock("@/features/sales-tools/useExchangeRate",()=>({useExchangeRate:()=>({query:{isPending:false,isError:false,data:{rate:state.rate,updatedAt:"2026-10-07T12:00:00Z"}},save:{isPending:false,mutate:state.save}})}));
beforeEach(()=>{cleanup();vi.clearAllMocks();state.rate=1750;});
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
