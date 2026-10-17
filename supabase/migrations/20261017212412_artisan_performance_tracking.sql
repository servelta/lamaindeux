-- Resolve the legacy sequence when called from a hardened RPC.
create or replace function public.generate_booking_number()
returns text language plpgsql security invoker set search_path='' as $body$
declare next_val bigint;
begin
 next_val:=nextval('public.booking_number_seq'::regclass);
 return 'PLB-'||to_char(now(),'YYYY')||'-'||lpad(next_val::text,6,'0');
end;
$body$;

create table public.artisan_call_clicks (
 event_id uuid primary key,
 professional_id uuid not null references public.professionals(profile_id) on delete cascade,
 source text not null check (source in ('profile-contact','profile-call','listing','booking','booking-confirmation')),
 created_at timestamptz not null default now()
);
create index artisan_call_clicks_professional_created on public.artisan_call_clicks(professional_id,created_at);
create index artisan_call_clicks_created on public.artisan_call_clicks(created_at);
alter table public.artisan_call_clicks enable row level security;
revoke all on public.artisan_call_clicks from anon, authenticated;
grant select on public.artisan_call_clicks to authenticated;
grant all on public.artisan_call_clicks to service_role;
create policy artisan_clicks_admin_read on public.artisan_call_clicks for select to authenticated using ((select public.is_admin()));

create table public.artisan_analytics_settings (
 id boolean primary key default true check(id),
 call_tracking_started_at timestamptz not null default now()
);
alter table public.artisan_analytics_settings enable row level security;
revoke all on public.artisan_analytics_settings from anon, authenticated;
grant select on public.artisan_analytics_settings to authenticated;
grant all on public.artisan_analytics_settings to service_role;
create policy analytics_settings_admin_read on public.artisan_analytics_settings for select to authenticated using ((select public.is_admin()));
insert into public.artisan_analytics_settings(id) values(true);

create or replace function public.record_artisan_call_click(p_event_id uuid,p_professional_id uuid,p_source text)
returns void language plpgsql security invoker set search_path='' as $$
begin
 if p_event_id is null or p_professional_id is null or p_source is null or p_source not in ('profile-contact','profile-call','listing','booking','booking-confirmation') then raise exception 'Invalid click' using errcode='22023'; end if;
 if exists(select 1 from public.artisan_call_clicks where event_id=p_event_id) then return; end if;
 -- No IP, visitor identifier, user agent, referrer or client contact data.
 if not public.check_rate_limit('call-click:artisan:'||p_professional_id::text,90,60) then return; end if;
 if not public.check_rate_limit('call-click:global',30000,3600) then return; end if;
 if not exists(select 1 from public.professionals p join public.trades t on t.id=p.trade_id where p.profile_id=p_professional_id and p.status='ACTIVE' and t.active) then return; end if;
 insert into public.artisan_call_clicks(event_id,professional_id,source) values(p_event_id,p_professional_id,p_source) on conflict(event_id) do nothing;
end;
$$;
revoke all on function public.record_artisan_call_click(uuid,uuid,text) from public,anon,authenticated;
grant execute on function public.record_artisan_call_click(uuid,uuid,text) to service_role;

create index bookings_professional_created_status on public.bookings(professional_id,created_at) include(status);
create index bookings_created_professional on public.bookings(created_at,professional_id);

create table private.booking_submissions (
 request_id uuid primary key,
 actor_hash text not null check(actor_hash ~ '^[0-9a-f]{64}$'),
 booking_id uuid not null unique references public.bookings(id) on delete cascade,
 created_at timestamptz not null default now()
);
alter table private.booking_submissions enable row level security;
revoke all on private.booking_submissions from public,anon,authenticated;
grant usage on schema private to service_role;
grant all on private.booking_submissions to service_role;

create or replace function public.find_booking_submission(p_request_id uuid,p_actor_hash text)
returns jsonb language plpgsql security invoker set search_path='' as $$
declare saved private.booking_submissions%rowtype;
begin
 if p_request_id is null or p_actor_hash is null or p_actor_hash !~ '^[0-9a-f]{64}$' then raise exception 'Invalid submission' using errcode='22023'; end if;
 perform pg_advisory_xact_lock(hashtextextended(p_request_id::text,0));
 select * into saved from private.booking_submissions where request_id=p_request_id;
 if not found then return null; end if;
 if saved.actor_hash<>p_actor_hash then raise exception 'Invalid submission' using errcode='22023'; end if;
 return (select to_jsonb(b) from public.bookings b where b.id=saved.booking_id);
end;
$$;
create or replace function public.save_booking_submission(p_request_id uuid,p_actor_hash text,p_booking jsonb)
returns jsonb language plpgsql security invoker set search_path='' as $$
declare existing jsonb; saved public.bookings%rowtype;
begin
 if p_request_id is null or p_actor_hash is null or p_actor_hash !~ '^[0-9a-f]{64}$' then raise exception 'Invalid submission' using errcode='22023'; end if;
 -- Serialize retries of this intent, including simultaneous guest requests.
 perform pg_advisory_xact_lock(hashtextextended(p_request_id::text,0));
 existing:=public.find_booking_submission(p_request_id,p_actor_hash);
 if existing is not null then return jsonb_build_object('booking',existing,'inserted',false); end if;
 insert into public.bookings(customer_id,professional_id,professional_service_id,status,scheduled_date,scheduled_time,booking_period,contact_first_name,contact_last_name,contact_phone,contact_email,address_line,postcode,city,description,photo_urls,price_cents,is_quote_request)
 values ((p_booking->>'customer_id')::uuid,(p_booking->>'professional_id')::uuid,(p_booking->>'professional_service_id')::uuid,(p_booking->>'status')::public.booking_status,(p_booking->>'scheduled_date')::date,(p_booking->>'scheduled_time')::time,p_booking->>'booking_period',p_booking->>'contact_first_name',p_booking->>'contact_last_name',p_booking->>'contact_phone',p_booking->>'contact_email',p_booking->>'address_line',p_booking->>'postcode',p_booking->>'city',p_booking->>'description',array(select jsonb_array_elements_text(p_booking->'photo_urls')),(p_booking->>'price_cents')::integer,(p_booking->>'is_quote_request')::boolean) returning * into saved;
 insert into private.booking_submissions(request_id,actor_hash,booking_id) values(p_request_id,p_actor_hash,saved.id);
 return jsonb_build_object('booking',to_jsonb(saved),'inserted',true);
end;
$$;
revoke all on function public.find_booking_submission(uuid,text), public.save_booking_submission(uuid,text,jsonb) from public,anon,authenticated;
grant execute on function public.find_booking_submission(uuid,text), public.save_booking_submission(uuid,text,jsonb) to service_role;

create or replace function private.preserve_booking_identity()
returns trigger language plpgsql security invoker set search_path='' as $$
begin
 if new.id is distinct from old.id or new.professional_id is distinct from old.professional_id or new.created_at is distinct from old.created_at then raise exception 'Booking identity and creation time are immutable' using errcode='23514'; end if;
 return new;
end;
$$;
revoke all on function private.preserve_booking_identity() from public,anon,authenticated;
create trigger preserve_booking_identity before update on public.bookings for each row execute function private.preserve_booking_identity();

create or replace function public.admin_artisan_performance(p_from date default null,p_to date default null,p_professional_id uuid default null,p_trade_id uuid default null,p_city text default null,p_search text default null,p_daily boolean default false)
returns jsonb language plpgsql stable security invoker set search_path='' as $$
declare result jsonb; from_utc timestamptz:=p_from::timestamp at time zone 'Europe/Paris'; to_utc timestamptz:=(p_to+1)::timestamp at time zone 'Europe/Paris';
begin
 if not coalesce(public.is_admin(),false) then raise exception 'Admin required' using errcode='42501'; end if;
 if (p_from is null)<>(p_to is null) or p_from>p_to or p_to-p_from>3660 or length(p_search)>100 or length(p_city)>150 or (p_daily and p_professional_id is null) then raise exception 'Invalid filters' using errcode='22023'; end if;
 with selected as (
  select p.profile_id id,p.company_name name,p.trade_id,t.name_singular trade,p.business_city city
  from public.professionals p join public.trades t on t.id=p.trade_id
  where (p_professional_id is null or p.profile_id=p_professional_id) and (p_trade_id is null or p.trade_id=p_trade_id) and (p_city is null or p.business_city=p_city) and (coalesce(p_search,'')='' or position(lower(p_search) in lower(p.company_name))>0)
 ), clicks as (
  select e.professional_id,count(*) total from public.artisan_call_clicks e join selected s on s.id=e.professional_id
  where (from_utc is null or e.created_at>=from_utc) and (to_utc is null or e.created_at<to_utc) group by e.professional_id
 ), booked as (
  select b.professional_id,b.status,count(*) total from public.bookings b join selected s on s.id=b.professional_id
  where (from_utc is null or b.created_at>=from_utc) and (to_utc is null or b.created_at<to_utc) group by b.professional_id,b.status
 ), counts as (
  select professional_id,sum(total) total,jsonb_object_agg(status,total) statuses from booked group by professional_id
 ), rows as (
  select s.*,coalesce(c.total,0) clicks,coalesce(b.total,0) appointments,coalesce(b.statuses,'{}'::jsonb) statuses from selected s left join clicks c on c.professional_id=s.id left join counts b on b.professional_id=s.id
 ), daily_clicks as (
  select (e.created_at at time zone 'Europe/Paris')::date as day,count(*) total from public.artisan_call_clicks e join selected s on s.id=e.professional_id where p_daily and e.professional_id=p_professional_id and (from_utc is null or e.created_at>=from_utc) and (to_utc is null or e.created_at<to_utc) group by 1
 ), daily_booked as (
  select (b.created_at at time zone 'Europe/Paris')::date as day,b.status,count(*) total from public.bookings b join selected s on s.id=b.professional_id where p_daily and b.professional_id=p_professional_id and (from_utc is null or b.created_at>=from_utc) and (to_utc is null or b.created_at<to_utc) group by 1,2
 ), daily_counts as (
  select day,sum(total) total,jsonb_object_agg(status,total) statuses from daily_booked group by day
 ), days as (
  select generate_series(coalesce(p_from,(select min(d) from (select min(day) d from daily_clicks union all select min(day) from daily_counts) x), (now() at time zone 'Europe/Paris')::date)::timestamp,coalesce(p_to,(now() at time zone 'Europe/Paris')::date)::timestamp,interval '1 day')::date as day where p_daily
 ), daily as (
  select d.day,coalesce(c.total,0) clicks,coalesce(b.total,0) appointments,coalesce(b.statuses,'{}'::jsonb) statuses from days d left join daily_clicks c using(day) left join daily_counts b using(day)
 )
 select jsonb_build_object(
 'rows',coalesce((select jsonb_agg(to_jsonb(r) order by name,id) from rows r),'[]'::jsonb),
 'daily',coalesce((select jsonb_agg(to_jsonb(d) order by day) from daily d),'[]'::jsonb),
 'totals',jsonb_build_object('clicks',coalesce((select sum(clicks) from rows),0),'appointments',coalesce((select sum(appointments) from rows),0),'artisans',(select count(*) from rows),'statuses',coalesce((select jsonb_object_agg(status,total) from (select status,sum(total) total from booked group by status) t),'{}'::jsonb)),
 'startedAt',(select call_tracking_started_at from public.artisan_analytics_settings where id=true),
 'artisans',coalesce((select jsonb_agg(jsonb_build_object('id',profile_id,'name',company_name) order by company_name) from public.professionals),'[]'::jsonb),
 'trades',coalesce((select jsonb_agg(jsonb_build_object('id',id,'name',name_singular) order by name_singular) from public.trades),'[]'::jsonb),
 'cities',coalesce((select jsonb_agg(city order by city) from (select distinct business_city city from public.professionals where business_city is not null and business_city<>'') c),'[]'::jsonb)
 ) into result;
 return result;
end;
$$;
revoke all on function public.admin_artisan_performance(date,date,uuid,uuid,text,text,boolean) from public,anon;
grant execute on function public.admin_artisan_performance(date,date,uuid,uuid,text,text,boolean) to authenticated;
