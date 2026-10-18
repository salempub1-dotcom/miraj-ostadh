-- Daily journal: one atomic, RLS-protected save for the teacher's current grade.
-- This does not change timetable slots or any journal belonging to another grade.
create or replace function public.save_my_daily_journal(
  p_date date,
  p_teacher_note text,
  p_entries jsonb
) returns uuid
language plpgsql security invoker set search_path = ''
as $$
declare
  v_user uuid := (select auth.uid());
  v_context uuid;
  v_journal uuid;
  v_entry jsonb;
  v_position int := 0;
  v_length int;
begin
  if v_user is null then raise exception 'Authentication required'; end if;
  if p_date is null or p_date < date '2020-01-01' or p_date > date '2040-12-31'
    then raise exception 'Invalid journal date'; end if;
  if length(coalesce(p_teacher_note, '')) > 2000
    then raise exception 'Teacher note too long'; end if;
  if jsonb_typeof(p_entries) is distinct from 'array'
    then raise exception 'Entries must be an array'; end if;
  v_length := jsonb_array_length(p_entries);
  if v_length > 35 then raise exception 'Too many daily entries'; end if;
  for v_entry in select value from jsonb_array_elements(p_entries) loop
    if jsonb_typeof(v_entry) <> 'object'
      or coalesce(v_entry->>'start','') !~ '^([01][0-9]|2[0-3]):[0-5][0-9]$'
      or coalesce(v_entry->>'end','') !~ '^([01][0-9]|2[0-3]):[0-5][0-9]$'
      or (v_entry->>'end')::time <= (v_entry->>'start')::time
      or length(btrim(coalesce(v_entry->>'subject',''))) not between 1 and 100
      or length(btrim(coalesce(v_entry->>'title',''))) not between 1 and 200
      or length(coalesce(v_entry->>'activities','')) > 2500
    then raise exception 'Invalid daily entry'; end if;
  end loop;
  -- Serialize journal updates for this teacher, including the first creation.
  select id into v_context
    from public.teacher_academic_contexts
    where user_id=v_user and is_current=true and onboarding_completed_at is not null
    for update;
  if v_context is null then raise exception 'Teacher context unavailable'; end if;
  select id into v_journal from public.daily_journals
    where teacher_context_id=v_context and journal_date=p_date for update;
  if v_journal is null then
    insert into public.daily_journals(teacher_context_id,journal_date,status,teacher_note)
    values(v_context,p_date,'draft',nullif(btrim(p_teacher_note),''))
    returning id into v_journal;
  else
    if exists (select 1 from public.daily_journals where id=v_journal and status='finalized')
      then raise exception 'Finalized journal cannot be modified'; end if;
    if exists (select 1 from public.daily_journal_entries
               where journal_id=v_journal and lesson_id is not null)
      then raise exception 'Journal has linked lessons; manual replacement blocked'; end if;
    update public.daily_journals set teacher_note=nullif(btrim(p_teacher_note),'')
      where id=v_journal;
    delete from public.daily_journal_entries where journal_id=v_journal;
  end if;
  for v_entry in select value from jsonb_array_elements(p_entries) loop
    insert into public.daily_journal_entries(
      journal_id,start_time,end_time,subject_name,lesson_title,entry_type,notes,order_index
    ) values (
      v_journal,(v_entry->>'start')::time,(v_entry->>'end')::time,
      btrim(v_entry->>'subject'),btrim(v_entry->>'title'),'manual',
      nullif(btrim(coalesce(v_entry->>'activities','')),''),v_position
    );
    v_position := v_position + 1;
  end loop;
  return v_journal;
end;
$$;
revoke all on function public.save_my_daily_journal(date,text,jsonb) from public,anon;
grant execute on function public.save_my_daily_journal(date,text,jsonb) to authenticated;
