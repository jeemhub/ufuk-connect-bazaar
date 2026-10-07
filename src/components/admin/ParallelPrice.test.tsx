import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, expect, it, vi } from "vitest";
import { ParallelPrice } from "./ParallelPrice";
vi.mock("@/i18n/LanguageContext",()=>({useLanguage:()=>({lang:"ar"})}));
afterEach(cleanup);
it("recalculates when the shared saved rate changes",()=>{
  const {rerender}=render(<ParallelPrice price={150000} rate={1750}/>);
  expect(screen.getByText("175,000 د.ع")).toBeInTheDocument();
  rerender(<ParallelPrice price={150000} rate={1800}/>);
  expect(screen.getByText("180,000 د.ع")).toBeInTheDocument();
  expect(screen.queryByText("175,000 د.ع")).not.toBeInTheDocument();
});
it("asks for a rate without inventing a converted amount",()=>{
  render(<ParallelPrice price={150000} rate={null}/>);
  expect(screen.getByText("حدد سعر الصرف أولًا")).toBeInTheDocument();
});
it("hides stale converted amounts when fetching the rate fails",()=>{
  render(<ParallelPrice price={150000} rate={1750} error/>);
  expect(screen.queryByText("175,000 د.ع")).not.toBeInTheDocument();
  expect(screen.getByText("تعذر تحميل سعر الصرف")).toBeInTheDocument();
});
