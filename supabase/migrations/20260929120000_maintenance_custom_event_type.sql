begin;

alter table public.maintenance_events drop constraint if exists maintenance_events_event_type_check;
alter table public.maintenance_events add constraint maintenance_events_event_type_check
  check (event_type = btrim(event_type) and char_length(event_type) between 1 and 100);

create or replace function public.maintenance_record_event(
  _device_id uuid, _event_type text, _location text, _custom_location text,
  _status text, _note text, _occurred_at timestamptz
)
returns uuid language plpgsql security definer set search_path = public, pg_temp
as $$
declare event_id uuid; device_row public.maintenance_devices%rowtype; latest_time timestamptz;
begin
  if not public.can_manage_maintenance(auth.uid()) then raise exception using errcode = '42501', message = 'forbidden'; end if;
  select * into device_row from public.maintenance_devices where id = _device_id for update;
  if not found then raise exception using errcode = 'P0002', message = 'device not found'; end if;
  select max(occurred_at) into latest_time from public.maintenance_events where device_id = _device_id;
  if _event_type is null or _event_type = 'received' or _event_type <> btrim(_event_type)
    or char_length(_event_type) not between 1 and 100
    or _location not in ('office','warehouse','baghdad','custom','customer')
    or _status is null or _status <> btrim(_status) or char_length(_status) not between 1 and 100
    or (_status = 'delivered' and _location <> 'customer')
    or (_event_type = 'delivered' and (_location <> 'customer' or _status <> 'delivered'))
    or (_location = 'custom' and (char_length(btrim(coalesce(_custom_location,''))) not between 1 and 100))
    or _occurred_at is null or _occurred_at < device_row.received_at or _occurred_at < latest_time or _occurred_at > now() + interval '1 minute'
    or char_length(coalesce(_note,'')) > 2000 then
    raise exception using errcode = '22023', message = 'invalid maintenance event';
  end if;
  update public.maintenance_devices set location = _location,
    custom_location = case when _location = 'custom' then btrim(_custom_location) else null end,
    status = _status, updated_at = now() where id = _device_id;
  insert into public.maintenance_events(device_id,event_type,location,custom_location,status,note,occurred_at,created_by)
  values (_device_id,_event_type,_location,case when _location = 'custom' then btrim(_custom_location) else null end,
    _status,btrim(coalesce(_note,'')),_occurred_at,auth.uid()) returning id into event_id;
  return event_id;
end;
$$;
revoke all on function public.maintenance_record_event(uuid,text,text,text,text,text,timestamptz) from public, anon;
grant execute on function public.maintenance_record_event(uuid,text,text,text,text,text,timestamptz) to authenticated;

commit;
