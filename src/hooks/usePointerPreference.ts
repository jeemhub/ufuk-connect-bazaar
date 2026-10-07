import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/auth/AuthProvider";
import { supabase } from "@/integrations/supabase/client";
export function usePointerPreference() {
  const { user, isStaff, loading } = useAuth();
  const client = useQueryClient();
  const key = ["pointer-preference", user?.id];
  const query = useQuery({queryKey:key,enabled:!!user && isStaff,queryFn:async()=>{
    const {data,error}=await supabase.from("admin_preferences").select("pointer_enabled").eq("user_id",user!.id).maybeSingle();
    if(error) throw error;
    return data?.pointer_enabled ?? true;
  }});
  const save = useMutation({onMutate:()=>client.cancelQueries({queryKey:key}),mutationFn:async(enabled:boolean)=>{
    if(!user || !isStaff) throw new Error("Staff account required");
    const {data,error}=await supabase.from("admin_preferences").upsert({user_id:user.id,pointer_enabled:enabled},{onConflict:"user_id"}).select("pointer_enabled").single();
    if(error || !data) throw error || new Error("Preference update failed");
    return {userId:user.id,enabled:data.pointer_enabled};
  },onSuccess:result=>client.setQueryData(["pointer-preference",result.userId],result.enabled)});
  return {query,save,enabled:!loading && (!isStaff || query.data===true)};
}
