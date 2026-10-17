-- Numbering metadata only: no customer or banking information is stored here.
create table public.billing_number_counters (
  professional_id uuid not null references public.professionals(profile_id) on delete cascade,
  document_kind text not null check (document_kind in ('quote','invoice')),
  document_year integer not null check (document_year between 2000 and 9999),
  next_value integer not null default 127 check (next_value >= 127),
  primary key (professional_id,document_kind,document_year)
);
create table public.billing_number_allocations (
  request_id uuid primary key,
  professional_id uuid not null references public.professionals(profile_id) on delete cascade,
  document_kind text not null check (document_kind in ('quote','invoice')),
  document_year integer not null check (document_year between 2000 and 9999),
  sequence_value integer not null check (sequence_value >= 127),
  document_number text not null,
  payload_hash text not null check (payload_hash ~ '^[a-f0-9]{64}$'),
  created_at timestamptz not null default now(),
  unique(professional_id,document_kind,document_year,sequence_value),
  unique(professional_id,document_number)
);
alter table public.billing_number_counters enable row level security;
alter table public.billing_number_allocations enable row level security;
revoke all on public.billing_number_counters, public.billing_number_allocations from anon, authenticated;
grant select on public.billing_number_counters, public.billing_number_allocations to authenticated;
grant all on public.billing_number_counters, public.billing_number_allocations to service_role;
create policy billing_counters_owner_read on public.billing_number_counters for select to authenticated using (professional_id=(select auth.uid()));
create policy billing_allocations_owner_read on public.billing_number_allocations for select to authenticated using (professional_id=(select auth.uid()));

create function private.allocate_billing_number_core(p_request_id uuid,p_kind text,p_year integer,p_payload_hash text)
returns jsonb language plpgsql security definer set search_path = '' as $$
declare
  v_owner uuid := (select auth.uid());
  v_sequence integer;
  v_number text;
  v_existing public.billing_number_allocations%rowtype;
begin
  if v_owner is null or not exists(select 1 from public.professionals p join public.profiles u on u.id=p.profile_id where p.profile_id=v_owner and u.role='professional' and p.status<>'SUSPENDED') then
    raise exception 'Artisan authentication required' using errcode='42501';
  end if;
  if p_request_id is null or p_kind is null or p_kind not in ('quote','invoice') or p_year is null or p_year not between 2000 and 9999 or p_payload_hash is null or p_payload_hash !~ '^[a-f0-9]{64}$' then
    raise exception 'Invalid numbering request' using errcode='22023';
  end if;
  insert into public.billing_number_counters(professional_id,document_kind,document_year) values(v_owner,p_kind,p_year) on conflict do nothing;
  select next_value into v_sequence from public.billing_number_counters where professional_id=v_owner and document_kind=p_kind and document_year=p_year for update;
  select * into v_existing from public.billing_number_allocations where request_id=p_request_id;
  if found then
    if v_existing.professional_id<>v_owner or v_existing.document_kind<>p_kind or v_existing.document_year<>p_year or v_existing.payload_hash<>p_payload_hash then
      raise exception 'Numbering request already used' using errcode='22023';
    end if;
    return jsonb_build_object('number',v_existing.document_number);
  end if;
  v_number := (case p_kind when 'invoice' then 'FAC-' else 'DEV-' end)||p_year::text||'-'||lpad(v_sequence::text,greatest(4,length(v_sequence::text)),'0');
  insert into public.billing_number_allocations(request_id,professional_id,document_kind,document_year,sequence_value,document_number,payload_hash) values(p_request_id,v_owner,p_kind,p_year,v_sequence,v_number,p_payload_hash);
  update public.billing_number_counters set next_value=v_sequence+1 where professional_id=v_owner and document_kind=p_kind and document_year=p_year;
  return jsonb_build_object('number',v_number);
end;
$$;
revoke all on function private.allocate_billing_number_core(uuid,text,integer,text) from public,anon,authenticated;
grant usage on schema private to authenticated;
grant execute on function private.allocate_billing_number_core(uuid,text,integer,text) to authenticated;
create function public.allocate_billing_number(p_request_id uuid,p_kind text,p_year integer,p_payload_hash text)
returns jsonb language sql security invoker set search_path = '' as $$
  select private.allocate_billing_number_core(p_request_id,p_kind,p_year,p_payload_hash);
$$;
revoke all on function public.allocate_billing_number(uuid,text,integer,text) from public,anon,authenticated;
grant execute on function public.allocate_billing_number(uuid,text,integer,text) to authenticated;
