import { createClient } from "https://esm.sh/@supabase/supabase-js@2.104.1";

import {
  defaultCustomerBalanceHandlerDependencies,
  handleImportCustomerBalances,
} from "./handler.ts";

declare const Deno: {
  env: { get(name: string): string | undefined };
  serve(handler: (req: Request) => Promise<Response>): void;
};

const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
const anonKey = Deno.env.get("SUPABASE_ANON_KEY") ?? "";

function userClient(token: string) {
  return createClient(supabaseUrl, anonKey, {
    global: { headers: { Authorization: `Bearer ${token}` } },
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

Deno.serve((req: Request) =>
  handleImportCustomerBalances(req, {
    ...defaultCustomerBalanceHandlerDependencies,
    async authenticate(token) {
      const { data, error } = await userClient(token).auth.getUser(token);
      if (error || !data.user) return null;
      return { id: data.user.id };
    },
    async canManage(userId, token) {
      const { data, error } = await userClient(token).rpc("can_manage_customer_balances", {
        _user_id: userId,
      });
      if (error) throw error;
      return data === true;
    },
    async replaceBalances({ fileName, rows, token }) {
      const { data: userData, error: userError } = await userClient(token).auth.getUser(token);
      if (userError || !userData.user) throw userError ?? new Error("missing authenticated user");
      const { data, error } = await userClient(token).rpc("replace_customer_balances", {
        file_name: fileName,
        rows,
        _user_id: userData.user.id,
      });
      if (error) throw error;
      const result = data as { imported?: unknown } | null;
      return { imported: Number(result?.imported ?? 0) };
    },
  })
);
