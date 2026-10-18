-- Historical reference seed, not an official 2026/2027 confirmation.
-- 2024/2025 pedagogical plan from user Drive: "مخطط بناء التعلمات السنة الاولى".
-- All units, weeks, lessons remain draft until official 2026/27 review.
do $$
declare c_id uuid; u_id uuid; w_id uuid; l_id uuid; r_id uuid;
begin
  select c.id into c_id from public.curricula c
  join public.academic_years y on y.id=c.academic_year_id
  join public.grades g on g.id=c.grade_id
  join public.subjects s on s.id=c.subject_id
  where y.name='2026-2027' and g.code='1AP' and s.code='AR'
  order by c.created_at limit 1;
  if c_id is null then raise exception 'Expected 1AP AR 2026-2027 curriculum missing'; end if;
  insert into public.units(curriculum_id,number,title,description,order_index,status)
  values(c_id,1,'العائلة','مسودة مرجعية مأخوذة من مخطط 2024/2025؛ يلزم التحقق من توزيع 2026/2027',1,'draft')
  on conflict (curriculum_id,number) do nothing;
  insert into public.units(curriculum_id,number,title,description,order_index,status)
  values(c_id,2,'المدرسة','مسودة مرجعية مأخوذة من مخطط 2024/2025؛ يلزم التحقق من توزيع 2026/2027',2,'draft')
  on conflict (curriculum_id,number) do nothing;
  insert into public.units(curriculum_id,number,title,description,order_index,status)
  values(c_id,3,'الحي والقرية','مسودة مرجعية مأخوذة من مخطط 2024/2025؛ يلزم التحقق من توزيع 2026/2027',3,'draft')
  on conflict (curriculum_id,number) do nothing;
  insert into public.units(curriculum_id,number,title,description,order_index,status)
  values(c_id,4,'الرياضة والتسلية','مسودة مرجعية مأخوذة من مخطط 2024/2025؛ يلزم التحقق من توزيع 2026/2027',4,'draft')
  on conflict (curriculum_id,number) do nothing;
  insert into public.units(curriculum_id,number,title,description,order_index,status)
  values(c_id,5,'البيئة والطبيعة','مسودة مرجعية مأخوذة من مخطط 2024/2025؛ يلزم التحقق من توزيع 2026/2027',5,'draft')
  on conflict (curriculum_id,number) do nothing;
  insert into public.units(curriculum_id,number,title,description,order_index,status)
  values(c_id,6,'التغذية والصحة','مسودة مرجعية مأخوذة من مخطط 2024/2025؛ يلزم التحقق من توزيع 2026/2027',6,'draft')
  on conflict (curriculum_id,number) do nothing;
  insert into public.units(curriculum_id,number,title,description,order_index,status)
  values(c_id,7,'التواصل','مسودة مرجعية مأخوذة من مخطط 2024/2025؛ يلزم التحقق من توزيع 2026/2027',7,'draft')
  on conflict (curriculum_id,number) do nothing;
  insert into public.units(curriculum_id,number,title,description,order_index,status)
  values(c_id,8,'الموروث الحضاري','مسودة مرجعية مأخوذة من مخطط 2024/2025؛ يلزم التحقق من توزيع 2026/2027',8,'draft')
  on conflict (curriculum_id,number) do nothing;
  select id into u_id from public.units where curriculum_id=c_id and number=2;
  if u_id is null then raise exception 'School unit not found'; end if;
  -- Only observed week titles and lesson labels are seeded.
  
  insert into public.weeks(unit_id,number,title,order_index,status)
  values(u_id,5,'الأسبوع 5',5,'draft')
  on conflict (unit_id,number) do nothing;
  select id into w_id from public.weeks where unit_id=u_id and number=5;
  insert into public.lessons(week_id,title,lesson_number,duration_minutes,order_index,status)
  values(w_id,'أحمد في المدرسة',1,45,1,'draft')
  on conflict (week_id,lesson_number) do nothing;
  select id into l_id from public.lessons where week_id=w_id and lesson_number=1;
  select id into r_id from public.resources
    where external_source='google_drive' and external_file_id='1-HzdUmDw4Hfd3sXBgKKqlmcmb5DcNigh';
  if r_id is not null then
    insert into public.lesson_resources(lesson_id,resource_id,category,order_index)
    values(l_id,r_id,'lesson_plan',0) on conflict do nothing;
  end if;
  

  insert into public.weeks(unit_id,number,title,order_index,status)
  values(u_id,6,'الأسبوع 6',6,'draft')
  on conflict (unit_id,number) do nothing;
  select id into w_id from public.weeks where unit_id=u_id and number=6;
  insert into public.lessons(week_id,title,lesson_number,duration_minutes,order_index,status)
  values(w_id,'في ساحة المدرسة',1,45,1,'draft')
  on conflict (week_id,lesson_number) do nothing;
  select id into l_id from public.lessons where week_id=w_id and lesson_number=1;
  select id into r_id from public.resources
    where external_source='google_drive' and external_file_id='1-HzdUmDw4Hfd3sXBgKKqlmcmb5DcNigh';
  if r_id is not null then
    insert into public.lesson_resources(lesson_id,resource_id,category,order_index)
    values(l_id,r_id,'lesson_plan',0) on conflict do nothing;
  end if;
  

  insert into public.weeks(unit_id,number,title,order_index,status)
  values(u_id,7,'الأسبوع 7',7,'draft')
  on conflict (unit_id,number) do nothing;
  select id into w_id from public.weeks where unit_id=u_id and number=7;
  insert into public.lessons(week_id,title,lesson_number,duration_minutes,order_index,status)
  values(w_id,'أدواتي المدرسية',1,45,1,'draft')
  on conflict (week_id,lesson_number) do nothing;
  select id into l_id from public.lessons where week_id=w_id and lesson_number=1;
  select id into r_id from public.resources
    where external_source='google_drive' and external_file_id='1-HzdUmDw4Hfd3sXBgKKqlmcmb5DcNigh';
  if r_id is not null then
    insert into public.lesson_resources(lesson_id,resource_id,category,order_index)
    values(l_id,r_id,'lesson_plan',0) on conflict do nothing;
  end if;
  
end $$;
