-- Atomic replacement of timetable slots for the signed-in teacher's current context.
-- Keeping all other contexts, journals and progress untouched.
create or replace function public.save_my_current_timetable(p_slots jsonb)
returns integer
language plpgsql security invoker set search_path = ''
as $$
declare
  v_user uuid := (select auth.uid());
  v_context uuid;
  v_timetable uuid;
  v_slot jsonb;
  v_day integer;
  v_start time;
  v_end time;
  v_count integer;
  v_idx integer := 0;
begin
  if v_user is null then raise exception 'Authentication required'; end if;
  if jsonb_typeof(p_slots) is distinct from 'array' then raise exception 'Slots must be an array'; end if;
  v_count := jsonb_array_length(p_slots);
  if v_count < 1 or v_count > 30 then raise exception 'Enter between 1 and 30 valid sessions'; end if;
  select id into v_context from public.teacher_academic_contexts
   where user_id=v_user and is_current=true and onboarding_completed_at is not null for update;
  if v_context is null then raise exception 'Teacher context unavailable'; end if;

  -- Validate before deleting anything. Reject duplicates and overlapping intervals.
  for v_slot in select value from jsonb_array_elements(p_slots) loop
    if jsonb_typeof(v_slot) <> 'object'
       or (v_slot->>'day') !~ '^[0-4]$'
       or (v_slot->>'start') !~ '^([01][0-9]|2[0-3]):[0-5][0-9]$'
       or (v_slot->>'end') !~ '^([01][0-9]|2[0-3]):[0-5][0-9]$'
    then raise exception 'Invalid weekday or time'; end if;
    v_day := (v_slot->>'day')::integer;
    v_start := (v_slot->>'start')::time;
    v_end := (v_slot->>'end')::time;
    if v_end <= v_start then raise exception 'Session must end after it starts'; end if;
    if exists (select 1 from jsonb_array_elements(p_slots) other
      where other is distinct from v_slot
        and other->>'day'=v_slot->>'day'
        and (other->>'start') ~ '^([01][0-9]|2[0-3]):[0-5][0-9]$'
        and (other->>'end') ~ '^([01][0-9]|2[0-3]):[0-5][0-9]$'
        and (other->>'start')::time < v_end
        and (other->>'end')::time > v_start
    ) then raise exception 'Overlapping sessions in the same day'; end if;
  end loop;

  select id into v_timetable from public.teacher_timetables
    where teacher_context_id=v_context and is_active=true for update;
  if v_timetable is null then
    insert into public.teacher_timetables(teacher_context_id,name,is_active)
    values (v_context,'الجدول الأسبوعي',true) returning id into v_timetable;
  end if;
  delete from public.timetable_slots where timetable_id=v_timetable;
  for v_slot in select value from jsonb_array_elements(p_slots)
    order by (value->>'day')::integer, (value->>'start')::time
  loop
    insert into public.timetable_slots(timetable_id,day_of_week,start_time,end_time,order_index,note)
    values(v_timetable,(v_slot->>'day')::integer,(v_slot->>'start')::time,
      (v_slot->>'end')::time,v_idx,nullif(btrim(coalesce(v_slot->>'note','')),''));
    v_idx := v_idx + 1;
  end loop;
  return v_count;
end;
$$;
revoke all on function public.save_my_current_timetable(jsonb) from public, anon;
grant execute on function public.save_my_current_timetable(jsonb) to authenticated;
