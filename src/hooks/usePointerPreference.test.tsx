import { act, cleanup, renderHook, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { beforeEach, expect, it, vi } from "vitest";
import { usePointerPreference } from "./usePointerPreference";
const state=vi.hoisted(()=>({id:"staff-a",values:{"staff-a":true,"staff-b":true} as Record<string,boolean>,payloads:[] as Record<string,unknown>[],fail:false}));
vi.mock("@/auth/AuthProvider",()=>({useAuth:()=>({user:{id:state.id},isStaff:true,loading:false})}));
vi.mock("@/integrations/supabase/client",()=>({supabase:{from:()=>({
  select:()=>({eq:(_:string,id:string)=>({maybeSingle:async()=>({data:{pointer_enabled:state.values[id]},error:null})})}),
  upsert:(payload:{user_id:string,pointer_enabled:boolean})=>({select:()=>({single:async()=>{
    state.payloads.push(payload);
    if(state.fail)return {data:null,error:new Error("Denied")};
    state.values[payload.user_id]=payload.pointer_enabled;return {data:{pointer_enabled:payload.pointer_enabled},error:null};
  }})}),
})}}));
beforeEach(()=>{cleanup();state.id="staff-a";state.values={"staff-a":true,"staff-b":true};state.payloads=[];state.fail=false;});
function setup(){const client=new QueryClient({defaultOptions:{queries:{retry:false},mutations:{retry:false}}});return renderHook(()=>usePointerPreference(),{wrapper:({children})=><QueryClientProvider client={client}>{children}</QueryClientProvider>});}
it("changes only the signed-in employee and isolates preferences when accounts change",async()=>{
  const hook=setup();await waitFor(()=>expect(hook.result.current.query.isSuccess).toBe(true));
  await act(async()=>{await hook.result.current.save.mutateAsync(false);});
  await waitFor(()=>expect(hook.result.current.enabled).toBe(false));
  expect(state.payloads).toEqual([{user_id:"staff-a",pointer_enabled:false}]);
  expect(state.values["staff-b"]).toBe(true);
  state.id="staff-b";hook.rerender();await waitFor(()=>expect(hook.result.current.enabled).toBe(true));
  state.id="staff-a";hook.rerender();await waitFor(()=>expect(hook.result.current.query.isSuccess).toBe(true));
  await waitFor(()=>expect(hook.result.current.enabled).toBe(false));
});
it("keeps the original preference after a rejected save",async()=>{
  const hook=setup();await waitFor(()=>expect(hook.result.current.query.isSuccess).toBe(true));state.fail=true;
  await act(async()=>{await expect(hook.result.current.save.mutateAsync(false)).rejects.toThrow("Denied");});
  expect(hook.result.current.enabled).toBe(true);
});
