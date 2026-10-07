import { cleanup, fireEvent, render } from "@testing-library/react";
import { afterEach, expect, it, vi } from "vitest";
import { PointerEffect } from "./PointerEffect";
const state=vi.hoisted(()=>({enabled:true}));
vi.mock("@/hooks/usePointerPreference",()=>({usePointerPreference:()=>({enabled:state.enabled})}));
afterEach(()=>{cleanup();state.enabled=true;vi.unstubAllGlobals();document.documentElement.classList.remove("ufuk-custom-pointer");});
it("removes the animated circle, listeners and hidden native cursor when disabled",()=>{
  vi.stubGlobal("matchMedia",()=>({matches:true,addEventListener:vi.fn(),removeEventListener:vi.fn()}));
  const {rerender}=render(<PointerEffect/>);
  expect(document.querySelector(".ufuk-pointer")).not.toBeNull();
  fireEvent(document.body,Object.assign(new Event("pointermove",{bubbles:true}),{pointerType:"mouse",clientX:50,clientY:50}));
  expect(document.documentElement).toHaveClass("ufuk-custom-pointer");
  state.enabled=false;rerender(<PointerEffect/>);
  expect(document.querySelector(".ufuk-pointer")).toBeNull();
  expect(document.documentElement).not.toHaveClass("ufuk-custom-pointer");
  fireEvent(document.body,Object.assign(new Event("pointermove",{bubbles:true}),{pointerType:"mouse",clientX:80,clientY:80}));
  expect(document.documentElement).not.toHaveClass("ufuk-custom-pointer");
});
