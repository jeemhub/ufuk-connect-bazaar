-- Keep the existing transactional importer, including all validation and locks.
-- The production safe-update guard requires an explicit WHERE on DELETE.
do $migration$
declare
  definition text;
begin
  select pg_get_functiondef('public.replace_customer_balances(text,jsonb,uuid)'::regprocedure)
    into definition;
  definition := replace(definition,
    'delete from public.customer_balances;',
    'delete from public.customer_balances where customer_number is not null;');
  -- A caller-supplied actor must never impersonate another authorized user.
  definition := replace(definition,
    'if not public.can_manage_customer_balances(_user_id) then',
    'if auth.uid() is null or _user_id is distinct from auth.uid() or not public.can_manage_customer_balances(auth.uid()) then');
  execute definition;
end;
$migration$;
