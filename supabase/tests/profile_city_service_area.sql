begin;
select '1..1';
do $test$
declare pro uuid:=gen_random_uuid(); other_pro uuid:=gen_random_uuid(); paris uuid; lyon uuid; n integer; rows_changed integer;
begin
 select id into paris from public.cities where slug='paris';
 select id into lyon from public.cities where slug='lyon';
 insert into auth.users(id,email,raw_user_meta_data) values
 (pro,'area-pro-'||pro||'@example.invalid','{"role":"professional","company_name":"City fixture","trade_slug":"plombier"}'),
 (other_pro,'area-pro-'||other_pro||'@example.invalid','{"role":"professional","company_name":"Other city fixture","trade_slug":"plombier"}');
 perform set_config('request.jwt.claims',jsonb_build_object('role','authenticated','sub',pro)::text,true);
 execute 'set local role authenticated';
 update public.professionals set business_city='  pARis  ' where profile_id=pro;
 select count(*) into n from public.professional_service_areas where professional_id=pro and city_id=paris;
 if n<>1 then raise exception 'FAIL automatic city assignment'; end if;
 update public.professional_service_areas set postcodes=array['75015'] where professional_id=pro and city_id=paris;
 update public.professionals set business_city='Paris' where profile_id=pro;
 if (select postcodes from public.professional_service_areas where professional_id=pro and city_id=paris)<>array['75015'] then raise exception 'FAIL postcode restrictions overwritten'; end if;
 select count(*) into n from public.professional_service_areas where professional_id=pro and city_id=paris;
 if n<>1 then raise exception 'FAIL duplicate assignment'; end if;
 update public.professionals set business_city='Lyon' where profile_id=pro;
 select count(*) into n from public.professional_service_areas where professional_id=pro;
 if n<>2 then raise exception 'FAIL changed city or preserved existing cities'; end if;
 update public.professionals set business_city='Unavailable fixture city' where profile_id=pro;
 select count(*) into n from public.professional_service_areas where professional_id=pro;
 if n<>2 then raise exception 'FAIL unknown city'; end if;
 update public.professionals set business_city='Paris' where profile_id=other_pro;
 get diagnostics rows_changed = row_count;
 if rows_changed<>0 then raise exception 'FAIL foreign profile write'; end if;
 execute 'reset role';
 select count(*) into n from public.professional_service_areas where professional_id=other_pro;
 if n<>0 then raise exception 'FAIL foreign city assignment'; end if;
end;
$test$;
rollback;
select 'ok 1 - automatic profile city, case/space normalization, repeat saves, city change, postcode/extra-city preservation, unknown city and owner isolation; fixtures rolled back' as verification;
