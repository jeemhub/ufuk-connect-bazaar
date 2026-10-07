import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/auth/AuthProvider";
import { supabase } from "@/integrations/supabase/client";
export function useExchangeRate() {
  const { user, isStaff } = useAuth();
  const client = useQueryClient();
  const key = ["sales-exchange-rate", user?.id];
  const query = useQuery({queryKey:key,enabled:isStaff,refetchInterval:5000,queryFn:async()=>{
    const {data,error}=await supabase.from("sales_tool_settings").select("exchange_rate,updated_at").eq("id",true).single();
    if(error) throw error;
    return {rate:data.exchange_rate===null ? null : Number(data.exchange_rate),updatedAt:data.updated_at};
  }});
  const save = useMutation({mutationFn:async(rate:number)=>{
    if(!isStaff || !Number.isFinite(rate) || rate<=0 || rate>100000) throw new Error("Invalid exchange rate");
    const {data,error}=await supabase.from("sales_tool_settings").update({exchange_rate:rate}).eq("id",true).select("exchange_rate,updated_at").single();
    if(error || !data) throw error || new Error("Exchange rate update failed");
    return {rate:Number(data.exchange_rate),updatedAt:data.updated_at};
  },onSuccess:data=>client.setQueryData(key,data)});
  return {query,save};
}
