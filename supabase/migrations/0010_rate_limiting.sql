-- =============================================================================
-- Rate limiting (Phase 9). Backed by Postgres rather than an external
-- service like Upstash Redis — keeps the MVP at zero extra infrastructure
-- cost, and unlike an in-memory counter, this works correctly across
-- multiple serverless function instances since Supabase is the shared
-- source of truth.
--
-- Fixed-window counter: check_rate_limit atomically inserts-or-increments
-- a row per key and returns whether the caller is still within budget.
-- No RLS policies are defined (service-role only), matching the pattern
-- already used for `notifications`.
-- =============================================================================

create table rate_limits (
  key text primary key,
  window_start timestamptz not null default now(),
  count int not null default 0
);

alter table rate_limits enable row level security;

create or replace function check_rate_limit(p_key text, p_limit int, p_window_seconds int)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  current_count int;
begin
  insert into rate_limits (key, window_start, count)
  values (p_key, now(), 1)
  on conflict (key) do update
    set count = case
          when now() - rate_limits.window_start > (p_window_seconds || ' seconds')::interval
          then 1
          else rate_limits.count + 1
        end,
        window_start = case
          when now() - rate_limits.window_start > (p_window_seconds || ' seconds')::interval
          then now()
          else rate_limits.window_start
        end
  returning count into current_count;

  return current_count <= p_limit;
end;
$$;

comment on function check_rate_limit is
  'Returns true if the caller is still within the limit for this window (and counts this attempt), false if they have exceeded it.';
