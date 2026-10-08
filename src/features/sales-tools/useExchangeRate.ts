import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/auth/AuthProvider";
import { supabase } from "@/integrations/supabase/client";
import type { PricingMode } from "./calculation";
type SettingsRow = {exchange_rate:number|null;markup_percentage:number;pricing_mode:string;updated_at:string};
const columns="exchange_rate,markup_percentage,pricing_mode,updated_at";
const parseSettings=(data:SettingsRow)=>({rate:data.exchange_rate===null ? null : Number(data.exchange_rate),percentage:Number(data.markup_percentage),mode:data.pricing_mode as PricingMode,updatedAt:data.updated_at});
export function useExchangeRate() {
  const {user,isStaff}=useAuth(); const client=useQueryClient(); const key=["sales-exchange-rate",user?.id];
  const query=useQuery({queryKey:key,enabled:isStaff,refetchInterval:5000,queryFn:async()=>{
    const {data,error}=await supabase.from("sales_tool_settings").select(columns).eq("id",true).single();
    if(error) throw error; return parseSettings(data);
  }});
  async function update(patch:{exchange_rate?:number;markup_percentage?:number;pricing_mode?:PricingMode}) {
    if(!isStaff) throw new Error("Staff account required");
    const {data,error}=await supabase.from("sales_tool_settings").update(patch).eq("id",true).select(columns).single();
    if(error || !data) throw error || new Error("Sales pricing update failed"); return parseSettings(data);
  }
  const callbacks={onMutate:()=>client.cancelQueries({queryKey:key}),onSuccess:(data:ReturnType<typeof parseSettings>)=>client.setQueryData(key,data)};
  const save=useMutation({...callbacks,mutationFn:async(rate:number)=>{
    if(!Number.isFinite(rate)||rate<=0||rate>100000) throw new Error("Invalid exchange rate");
    return update({exchange_rate:rate});
  }});
  const savePercentage=useMutation({...callbacks,mutationFn:async(percentage:number)=>{
    if(!Number.isFinite(percentage)||percentage<0||percentage>100000) throw new Error("Invalid percentage");
    return update({markup_percentage:percentage});
  }});
  const saveMode=useMutation({...callbacks,mutationFn:async(mode:PricingMode)=>{
    if(mode!=="parallel"&&mode!=="percentage") throw new Error("Invalid pricing mode");
    return update({pricing_mode:mode});
  }});
  return {query,save,savePercentage,saveMode};
}
