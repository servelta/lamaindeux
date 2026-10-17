begin;
select '1..1';
do $test$
declare
  pro uuid:=gen_random_uuid(); c1 uuid:=gen_random_uuid(); c2 uuid:=gen_random_uuid(); s1 uuid:=gen_random_uuid(); s2 uuid:=gen_random_uuid(); svc uuid; b uuid:=gen_random_uuid(); rejected boolean; n integer;
begin
  insert into auth.users(id,email,raw_user_meta_data) values (pro,'calendar-pro-'||pro||'@example.invalid',jsonb_build_object('role','professional','company_name','Calendar validation fixture','trade_slug','plombier')),
    (c1,'calendar-c1-'||c1||'@example.invalid','{"role":"customer","first_name":"Test","last_name":"Calendar"}'),
    (c2,'calendar-c2-'||c2||'@example.invalid','{"role":"customer","first_name":"Test","last_name":"Calendar"}');
  select id into svc from public.services where active order by sort_order limit 1;
  insert into public.professional_services(id,professional_id,service_id,pricing_type,price_cents,duration_minutes,active) values (s1,pro,svc,'fixed',9000,120,true) on conflict(professional_id,service_id) do update set pricing_type='fixed',price_cents=9000,duration_minutes=120,active=true returning id into s1;
  select id into svc from public.services where active and id<>svc order by sort_order limit 1;
  insert into public.professional_services(id,professional_id,service_id,pricing_type,duration_minutes,active) values (s2,pro,svc,'quote',60,true) on conflict(professional_id,service_id) do update set pricing_type='quote',duration_minutes=60,active=true returning id into s2;
  perform set_config('request.jwt.claims',jsonb_build_object('role','authenticated','sub',pro)::text,true);
  execute 'set local role authenticated';
  insert into public.daily_availability values(pro,'2036-03-11',true,false,true);
  insert into public.daily_availability values(pro,'2036-03-20',true,true,true);
  insert into public.daily_availability(professional_id,date,morning,afternoon,evening)
    select pro, d::date, false, false, false
    from generate_series(date '2036-03-20',date '2036-03-22',interval '1 day') d
    on conflict(professional_id,date) do update set morning=false,afternoon=false,evening=false;
  select count(*) into n from public.daily_availability where professional_id=pro
    and date between '2036-03-20' and '2036-03-22' and not morning and not afternoon and not evening;
  if n<>3 then raise exception 'FAIL: inclusive bulk range block';end if;
  perform set_config('request.jwt.claims',jsonb_build_object('role','authenticated','sub',c2)::text,true);
  rejected:=false; begin update public.daily_availability set morning=false where professional_id=pro and date='2036-03-11'; get diagnostics n=row_count; rejected:=n=0; exception when insufficient_privilege then rejected:=true; end;
  if not rejected then raise exception 'FAIL: foreign user changed availability'; end if;
  rejected:=false; begin insert into public.daily_availability values(pro,'2036-03-12',true,true,true); exception when insufficient_privilege then rejected:=true; end;
  if not rejected then raise exception 'FAIL: foreign user inserted availability'; end if;
  execute 'reset role'; perform set_config('request.jwt.claims','{"role":"service_role"}',true);
  perform set_config('request.jwt.claims',jsonb_build_object('role','authenticated','sub',c1)::text,true);execute 'set local role authenticated';
  insert into public.bookings(id,booking_number,customer_id,professional_id,professional_service_id,status,scheduled_date,scheduled_time,booking_period,contact_first_name,contact_last_name,contact_phone,contact_email,address_line,postcode,city,is_quote_request) values(b,'TEST-'||b,c1,pro,s2,'PENDING','2036-03-11','10:00','morning','Test','Calendar','0600000000','fixture@example.invalid','Test address','75001','Paris',true);
  execute 'reset role';perform set_config('request.jwt.claims','{"role":"service_role"}',true);
  rejected:=false; begin
    insert into public.bookings(booking_number,customer_id,professional_id,professional_service_id,status,scheduled_date,scheduled_time,booking_period,contact_first_name,contact_last_name,contact_phone,contact_email,address_line,postcode,city,is_quote_request) values('TEST-'||gen_random_uuid(),c2,pro,s1,'CONFIRMED','2036-03-11','10:00','morning','Test','Calendar','0600000000','fixture@example.invalid','Test address','75001','Paris',false);
  exception when unique_violation then rejected:=true; end;
  if not rejected then raise exception 'FAIL: duplicate period accepted across services'; end if;
  rejected:=false; begin
    insert into public.bookings(booking_number,customer_id,professional_id,professional_service_id,status,scheduled_date,scheduled_time,contact_first_name,contact_last_name,contact_phone,contact_email,address_line,postcode,city,is_quote_request) values('TEST-'||gen_random_uuid(),c2,pro,s1,'CONFIRMED','2036-03-11','10:30','Test','Calendar','0600000000','fixture@example.invalid','Test address','75001','Paris',false);
  exception when unique_violation then rejected:=true; end;
  if not rejected then raise exception 'FAIL: legacy appointment bypassed period lock'; end if;
  rejected:=false; begin
    insert into public.bookings(booking_number,customer_id,professional_id,professional_service_id,status,scheduled_date,scheduled_time,booking_period,contact_first_name,contact_last_name,contact_phone,contact_email,address_line,postcode,city,is_quote_request) values('TEST-'||gen_random_uuid(),c1,pro,s1,'CONFIRMED','2036-03-11','13:00','afternoon','Test','Calendar','0600000000','fixture@example.invalid','Test address','75001','Paris',false);
  exception when check_violation then rejected:=true; end;
  if not rejected then raise exception 'FAIL: closed period accepted'; end if;
  update public.bookings set status='CANCELLED_BY_CUSTOMER' where id=b;
  insert into public.bookings(booking_number,customer_id,professional_id,professional_service_id,status,scheduled_date,scheduled_time,booking_period,contact_first_name,contact_last_name,contact_phone,contact_email,address_line,postcode,city,is_quote_request) values('TEST-'||gen_random_uuid(),c2,pro,s1,'CONFIRMED','2036-03-11','10:00','morning','Test','Calendar','0600000000','fixture@example.invalid','Test address','75001','Paris',false);
  perform set_config('request.jwt.claims',jsonb_build_object('role','authenticated','sub',pro)::text,true); execute 'set local role authenticated';
  update public.professional_services set active=false,price_cents=8995,duration_minutes=90 where id=s1 and professional_id=pro;
  get diagnostics n=row_count;
  if n<>1 then raise exception 'FAIL: owner service edit';end if;
  select count(*) into n from public.bookings where professional_service_id=s1;
  if n=0 then raise exception 'FAIL: service change lost booking history';end if;
  perform set_config('request.jwt.claims',jsonb_build_object('role','authenticated','sub',c2)::text,true);
  update public.professional_services set active=true where id=s1;
  get diagnostics n=row_count;
  if n<>0 then raise exception 'FAIL: foreign service mutation';end if;
  perform set_config('request.jwt.claims',jsonb_build_object('role','authenticated','sub',pro)::text,true);
  update public.professional_services set active=true,pricing_type='quote',price_cents=null,duration_minutes=120 where id=s1 and professional_id=pro;
  select count(*) into n from public.professional_services where id=s1 and active and pricing_type='quote' and price_cents is null and duration_minutes=120;
  if n<>1 then raise exception 'FAIL: service reactivation and quote pricing';end if;
  execute 'reset role';
  perform set_config('request.jwt.claims','{}',true); execute 'set local role anon';
  select count(*) into n from public.bookings where professional_id=pro;
  if n<>0 then raise exception 'FAIL: anonymous booking disclosure'; end if;
  select count(*) into n from public.daily_availability where professional_id=pro;
  if n<>4 then raise exception 'FAIL: public availability inaccessible'; end if;
  rejected:=false;begin delete from public.daily_availability where professional_id=pro;exception when insufficient_privilege then rejected:=true;end;
  if not rejected then raise exception 'FAIL: anonymous availability mutation';end if;
  execute 'reset role';
end;
$test$;
rollback;
select 'ok 1 - owner RLS, cross-service duplicate rejection, pending quote hold, legacy conflict rejection, closed period rejection, cancellation release, anonymous privacy; all fixtures rolled back' as verification;
