begin;
select '1..1';
do $test$
declare pro uuid:=gen_random_uuid(); other_pro uuid:=gen_random_uuid(); customer uuid:=gen_random_uuid(); req uuid:=gen_random_uuid(); v jsonb; n integer; denied boolean;
begin
 insert into auth.users(id,email,raw_user_meta_data) values
 (pro,'billing-pro-'||pro||'@example.invalid','{"role":"professional","company_name":"Numbering fixture","trade_slug":"plombier"}'),
 (other_pro,'billing-pro-'||other_pro||'@example.invalid','{"role":"professional","company_name":"Other numbering fixture","trade_slug":"plombier"}'),
 (customer,'billing-client-'||customer||'@example.invalid','{"role":"customer"}');
 perform set_config('request.jwt.claims',jsonb_build_object('role','authenticated','sub',pro)::text,true);execute 'set local role authenticated';
 v:=public.allocate_billing_number(req,'quote',2026,repeat('a',64));
 if v->>'number'<>'DEV-2026-0127' then raise exception 'FAIL first quote';end if;
 v:=public.allocate_billing_number(req,'quote',2026,repeat('a',64));
 if v->>'number'<>'DEV-2026-0127' then raise exception 'FAIL idempotency';end if;
 v:=public.allocate_billing_number(gen_random_uuid(),'quote',2026,repeat('b',64));
 if v->>'number'<>'DEV-2026-0128' then raise exception 'FAIL next quote';end if;
 v:=public.allocate_billing_number(gen_random_uuid(),'invoice',2026,repeat('c',64));
 if v->>'number'<>'FAC-2026-0127' then raise exception 'FAIL independent invoice';end if;
 denied:=false;begin perform public.allocate_billing_number(req,'quote',2026,repeat('d',64));exception when invalid_parameter_value then denied:=true;end;
 if not denied then raise exception 'FAIL changed payload reused number';end if;
 denied:=false;begin update public.billing_number_counters set next_value=127 where professional_id=pro;exception when insufficient_privilege then denied:=true;end;
 if not denied then raise exception 'FAIL editable counter';end if;
 perform set_config('request.jwt.claims',jsonb_build_object('role','authenticated','sub',other_pro)::text,true);
 select count(*) into n from public.billing_number_allocations where professional_id=pro;
 if n<>0 then raise exception 'FAIL foreign registry disclosure';end if;
 v:=public.allocate_billing_number(gen_random_uuid(),'quote',2026,repeat('a',64));
 if v->>'number'<>'DEV-2026-0127' then raise exception 'FAIL artisan isolation';end if;
 denied:=false;begin perform public.allocate_billing_number(req,'quote',2026,repeat('a',64));exception when invalid_parameter_value then denied:=true;end;
 if not denied then raise exception 'FAIL foreign request reuse';end if;
 perform set_config('request.jwt.claims',jsonb_build_object('role','authenticated','sub',customer)::text,true);
 denied:=false;begin perform public.allocate_billing_number(gen_random_uuid(),'quote',2026,repeat('a',64));exception when insufficient_privilege then denied:=true;end;
 if not denied then raise exception 'FAIL customer numbering';end if;
 execute 'reset role';perform set_config('request.jwt.claims','{}',true);execute 'set local role anon';
 denied:=false;begin perform public.allocate_billing_number(gen_random_uuid(),'quote',2026,repeat('a',64));exception when insufficient_privilege then denied:=true;end;
 if not denied then raise exception 'FAIL anonymous numbering';end if;
 execute 'reset role';
end;
$test$;
rollback;
select 'ok 1 - 0127 start, separate quote/invoice sequences, idempotent retry, changed-content rejection, owner isolation, no direct counter edits, customer/anonymous rejection; all fixtures rolled back' as verification;
