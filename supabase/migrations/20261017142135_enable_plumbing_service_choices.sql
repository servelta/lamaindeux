-- Restore plumbing catalog choices so artisans can opt into individual services.
-- Existing professional assignments and their activation/pricing are untouched.
update public.services set active = true
where trade_id in (select id from public.trades where slug_singular = 'plombier')
  and active = false;
