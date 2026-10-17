-- Date-specific availability is public business information; customer bookings stay private.
create table public.daily_availability (
  professional_id uuid not null references public.professionals(profile_id) on delete cascade,
  date date not null,
  morning boolean not null default false,
  afternoon boolean not null default false,
  evening boolean not null default false,
  primary key (professional_id, date)
);
alter table public.daily_availability enable row level security;
revoke all on public.daily_availability from anon, authenticated;
grant select on public.daily_availability to anon, authenticated;
grant insert, update, delete on public.daily_availability to authenticated;
grant all on public.daily_availability to service_role;
create policy daily_availability_read on public.daily_availability for select to anon, authenticated using (true);
create policy daily_availability_insert on public.daily_availability for insert to authenticated with check (professional_id = (select auth.uid()));
create policy daily_availability_update on public.daily_availability for update to authenticated using (professional_id = (select auth.uid())) with check (professional_id = (select auth.uid()));
create policy daily_availability_delete on public.daily_availability for delete to authenticated using (professional_id = (select auth.uid()));

alter table public.bookings add column booking_period text check (booking_period in ('morning', 'afternoon', 'evening'));
create unique index uq_professional_day_period on public.bookings(professional_id, scheduled_date, booking_period)
where booking_period is not null and status not in ('CANCELLED_BY_CUSTOMER', 'CANCELLED_BY_PROFESSIONAL', 'NO_SHOW');

-- Only a trigger may call this function. It must see competing bookings hidden
-- by customer RLS. It returns no customer information and exposes no RPC.
create schema if not exists private;
revoke all on schema private from public;
create function private.enforce_booking_period() returns trigger
language plpgsql security definer set search_path = '' as $$
declare
  v_start time; v_end time; v_enabled boolean; v_day public.daily_availability%rowtype;
  v_now timestamp := now() at time zone 'Europe/Paris';
  v_duration integer;
begin
  if new.status in ('CANCELLED_BY_CUSTOMER', 'CANCELLED_BY_PROFESSIONAL', 'NO_SHOW') then return new; end if;
  if tg_op = 'UPDATE' then
    if old.status not in ('CANCELLED_BY_CUSTOMER', 'CANCELLED_BY_PROFESSIONAL', 'NO_SHOW')
      and old.professional_id = new.professional_id and old.scheduled_date = new.scheduled_date
      and old.scheduled_time = new.scheduled_time and old.booking_period is not distinct from new.booking_period
    then return new; end if;
  end if;
  if (select auth.uid()) is null and (select auth.jwt()->>'role') is distinct from 'service_role' and session_user not in ('postgres','supabase_admin') then
    raise exception 'Authentication required' using errcode='42501';
  end if;
  perform pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtextextended(new.professional_id::text || ':' || new.scheduled_date::text, 0));
  if new.booking_period is null then
    -- Old quote requests never selected a window. Keep that historical meaning.
    if not new.is_quote_request and exists (
      select 1 from public.bookings b where b.professional_id=new.professional_id and b.scheduled_date=new.scheduled_date and b.id<>new.id
      and b.booking_period is not null and b.status not in ('CANCELLED_BY_CUSTOMER','CANCELLED_BY_PROFESSIONAL','NO_SHOW')
      and new.scheduled_time < case b.booking_period when 'morning' then time '13:00' when 'afternoon' then time '17:00' else time '20:00' end
      and new.scheduled_time + make_interval(mins => coalesce((select s.duration_minutes from public.professional_services s where s.id=new.professional_service_id),60)) > b.scheduled_time
    ) then raise exception 'Period already booked' using errcode='23505'; end if;
    return new;
  end if;
  v_start := case new.booking_period when 'morning' then time '10:00' when 'afternoon' then time '13:00' else time '17:00' end;
  v_end := case new.booking_period when 'morning' then time '13:00' when 'afternoon' then time '17:00' else time '20:00' end;
  if new.scheduled_time <> v_start then raise exception 'Invalid period time' using errcode='23514'; end if;
  if new.scheduled_date < v_now::date or (new.scheduled_date=v_now::date and v_end <= v_now::time) then
    raise exception 'Period has passed' using errcode='23514';
  end if;
  select * into v_day from public.daily_availability where professional_id=new.professional_id and date=new.scheduled_date;
  if found then
    v_enabled := case new.booking_period when 'morning' then v_day.morning when 'afternoon' then v_day.afternoon else v_day.evening end;
  else
    select exists(select 1 from public.availability a where a.professional_id=new.professional_id and a.weekday=extract(dow from new.scheduled_date)
      and a.start_time<=v_start and a.end_time>=v_end) into v_enabled;
    if exists(select 1 from public.availability_exceptions e where e.professional_id=new.professional_id and e.date=new.scheduled_date
      and ((e.start_time is null or e.end_time is null) or (e.start_time<v_end and e.end_time>v_start))) then v_enabled:=false; end if;
  end if;
  if not v_enabled then raise exception 'Period unavailable' using errcode='23514'; end if;
  if exists (
    select 1 from public.bookings b left join public.professional_services s on s.id=b.professional_service_id
    where b.professional_id=new.professional_id and b.scheduled_date=new.scheduled_date and b.id<>new.id
    and b.status not in ('CANCELLED_BY_CUSTOMER','CANCELLED_BY_PROFESSIONAL','NO_SHOW')
    and (b.booking_period=new.booking_period or (b.booking_period is null and not b.is_quote_request
      and b.scheduled_time<v_end and b.scheduled_time+make_interval(mins=>coalesce(s.duration_minutes,60))>v_start))
  ) then raise exception 'Period already booked' using errcode='23505'; end if;
  return new;
end;
$$;
revoke all on function private.enforce_booking_period() from public, anon, authenticated;
create trigger enforce_booking_period before insert or update of professional_id, scheduled_date, scheduled_time, booking_period, status on public.bookings
for each row execute function private.enforce_booking_period();
