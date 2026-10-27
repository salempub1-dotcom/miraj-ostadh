-- Neon Auth ownership bridge and RLS policies. RUN ONLY ON AN ISOLATED BRANCH.

-- Depends on neon_auth and 001_public_schema.sql. Imports NO user records.

BEGIN;

CREATE SCHEMA IF NOT EXISTS miraj_migration;

REVOKE ALL ON SCHEMA miraj_migration FROM PUBLIC;

CREATE TABLE IF NOT EXISTS miraj_migration.identity_links (
 legacy_supabase_user_id uuid PRIMARY KEY,
 neon_auth_user_id uuid NOT NULL UNIQUE REFERENCES neon_auth."user"(id) ON DELETE RESTRICT,
 verified_at timestamptz NOT NULL DEFAULT now(),
 verification_method text NOT NULL CHECK (verification_method IN ('verified_login','verified_email_recovery','verified_oauth')),
 application_role text NOT NULL CHECK (application_role IN ('teacher','admin'))
);

CREATE TABLE IF NOT EXISTS miraj_migration.pending_identity_links (
 legacy_supabase_user_id uuid PRIMARY KEY REFERENCES public.profiles(id),
 neon_auth_user_id uuid NOT NULL UNIQUE REFERENCES neon_auth."user"(id),
 created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE miraj_migration.identity_links ENABLE ROW LEVEL SECURITY;

ALTER TABLE miraj_migration.identity_links FORCE ROW LEVEL SECURITY;

ALTER TABLE miraj_migration.pending_identity_links ENABLE ROW LEVEL SECURITY;

ALTER TABLE miraj_migration.pending_identity_links FORCE ROW LEVEL SECURITY;

REVOKE ALL ON miraj_migration.identity_links, miraj_migration.pending_identity_links FROM PUBLIC;

CREATE OR REPLACE FUNCTION miraj_migration.legacy_user_id() RETURNS uuid
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = pg_catalog
AS $$ SELECT m.legacy_supabase_user_id FROM miraj_migration.identity_links m WHERE m.neon_auth_user_id = NULLIF(auth.user_id(),'')::uuid AND m.verified_at IS NOT NULL LIMIT 1 $$;

REVOKE ALL ON FUNCTION miraj_migration.legacy_user_id() FROM PUBLIC;

GRANT USAGE ON SCHEMA miraj_migration TO authenticated;

GRANT EXECUTE ON FUNCTION miraj_migration.legacy_user_id() TO authenticated;

CREATE SCHEMA IF NOT EXISTS private;

REVOKE ALL ON SCHEMA private FROM PUBLIC;

GRANT USAGE ON SCHEMA private TO authenticated;

CREATE OR REPLACE FUNCTION private.can_edit_content()
 RETURNS boolean
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public', 'pg_temp'
AS $function$
  select exists (
    select 1 from public.profiles
    where id = miraj_migration.legacy_user_id()
      and role in ('editor','content_manager','admin')
  );
$function$
;

CREATE OR REPLACE FUNCTION private.can_review_content()
 RETURNS boolean
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public', 'pg_temp'
AS $function$
  select exists (
    select 1 from public.profiles
    where id = miraj_migration.legacy_user_id()
      and role in ('reviewer','content_manager','admin')
  );
$function$
;

CREATE OR REPLACE FUNCTION private.is_admin()
 RETURNS boolean
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public', 'pg_temp'
AS $function$
  select exists (
    select 1 from public.profiles
    where id = miraj_migration.legacy_user_id() and role = 'admin'
  );
$function$
;

CREATE OR REPLACE FUNCTION private.is_staff()
 RETURNS boolean
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public', 'pg_temp'
AS $function$
  select exists (
    select 1 from public.profiles
    where id = miraj_migration.legacy_user_id()
      and role in ('editor','reviewer','content_manager','admin')
  );
$function$
;

CREATE OR REPLACE FUNCTION private.owns_journal(journal uuid)
 RETURNS boolean
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public', 'pg_temp'
AS $function$
  select exists (
    select 1
    from public.daily_journals dj
    join public.teacher_academic_contexts tac on tac.id = dj.teacher_context_id
    where dj.id = journal
      and tac.user_id = miraj_migration.legacy_user_id()
  );
$function$
;

CREATE OR REPLACE FUNCTION private.owns_teacher_context(context_id uuid)
 RETURNS boolean
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public', 'pg_temp'
AS $function$
  select exists (
    select 1
    from public.teacher_academic_contexts tac
    where tac.id = context_id
      and tac.user_id = miraj_migration.legacy_user_id()
  );
$function$
;

CREATE OR REPLACE FUNCTION private.owns_timetable(timetable uuid)
 RETURNS boolean
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public', 'pg_temp'
AS $function$
  select exists (
    select 1
    from public.teacher_timetables tt
    join public.teacher_academic_contexts tac on tac.id = tt.teacher_context_id
    where tt.id = timetable
      and tac.user_id = miraj_migration.legacy_user_id()
  );
$function$
;

CREATE OR REPLACE FUNCTION private.set_updated_at()
 RETURNS trigger
 LANGUAGE plpgsql
 SET search_path TO 'public', 'pg_temp'
AS $function$
begin
  new.updated_at = now();
  return new;
end;
$function$
;

CREATE OR REPLACE FUNCTION public.save_my_current_timetable(p_slots jsonb)
 RETURNS integer
 LANGUAGE plpgsql
 SET search_path TO ''
AS $function$
declare
  v_user uuid := (select miraj_migration.legacy_user_id());
  v_context uuid;
  v_timetable uuid;
  v_slot jsonb;
  v_day integer;
  v_start time;
  v_end time;
  v_count integer;
  v_idx integer := 0;
  v_item_record record;
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
    if length(coalesce(v_slot->>'note','')) > 120 then raise exception 'Session note too long'; end if;
    end loop;

  -- Compare pairs by array position, including identical JSON objects.
  for v_item_record in
    select a.value as first_slot,b.value as second_slot
    from jsonb_array_elements(p_slots) with ordinality a(value,position)
    join jsonb_array_elements(p_slots) with ordinality b(value,position)
      on a.position < b.position
  loop
    if v_item_record.first_slot->>'day'=v_item_record.second_slot->>'day'
      and (v_item_record.first_slot->>'start')::time < (v_item_record.second_slot->>'end')::time
      and (v_item_record.second_slot->>'start')::time < (v_item_record.first_slot->>'end')::time
    then raise exception 'Overlapping sessions in the same day'; end if;
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
$function$
;

CREATE OR REPLACE FUNCTION public.save_my_daily_journal(p_date date, p_teacher_note text, p_entries jsonb)
 RETURNS uuid
 LANGUAGE plpgsql
 SET search_path TO ''
AS $function$
declare
  v_user uuid := (select miraj_migration.legacy_user_id());
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
$function$
;

CREATE OR REPLACE FUNCTION public.switch_my_teaching_grade(p_curriculum_id uuid, p_class_name text DEFAULT NULL::text)
 RETURNS uuid
 LANGUAGE plpgsql
 SET search_path TO ''
AS $function$
declare
  v_user uuid := (select miraj_migration.legacy_user_id());
  v_old public.teacher_academic_contexts%rowtype;
  v_target uuid;
  v_class text := nullif(btrim(coalesce(p_class_name,'')),'');
begin
  if v_user is null then raise exception 'Authentication required' using errcode='28000'; end if;
  if length(coalesce(v_class,'')) > 100 then raise exception 'Class name too long'; end if;
  select * into v_old from public.teacher_academic_contexts
    where user_id = v_user and is_current = true for update;
  if not found or v_old.onboarding_completed_at is null then
    raise exception 'Complete account setup before changing grade';
  end if;
  if not exists (
    select 1 from public.curricula desired
    join public.curricula current_curriculum on current_curriculum.id = v_old.curriculum_id
    where desired.id = p_curriculum_id and desired.status = 'published'
      and desired.academic_year_id = current_curriculum.academic_year_id
      and desired.subject_id = current_curriculum.subject_id
  ) then raise exception 'Curriculum not available for this teacher year and subject'; end if;
  if v_old.curriculum_id = p_curriculum_id and v_old.class_name is not distinct from v_class then
    return v_old.id;
  end if;
  update public.teacher_academic_contexts set is_current = false where id = v_old.id and user_id = v_user;
  select id into v_target from public.teacher_academic_contexts
    where user_id = v_user and curriculum_id = p_curriculum_id
      and class_name is not distinct from v_class and is_current = false
    order by created_at desc limit 1 for update;
  if v_target is not null then
    update public.teacher_academic_contexts
      set is_current = true, onboarding_completed_at = coalesce(onboarding_completed_at, now())
      where id = v_target and user_id = v_user;
  else
    insert into public.teacher_academic_contexts(user_id,curriculum_id,class_name,is_current,onboarding_completed_at)
      values(v_user,p_curriculum_id,v_class,true,now()) returning id into v_target;
  end if;
  return v_target;
end;
$function$
;

CREATE POLICY "academic_years_delete_staff" ON public."academic_years" AS PERMISSIVE FOR DELETE TO "authenticated" USING (private.can_edit_content());

CREATE POLICY "academic_years_insert_staff" ON public."academic_years" AS PERMISSIVE FOR INSERT TO "authenticated" WITH CHECK (private.can_edit_content());

CREATE POLICY "academic_years_read_active" ON public."academic_years" AS PERMISSIVE FOR SELECT TO "authenticated" USING ((is_active OR private.is_staff()));

CREATE POLICY "academic_years_update_staff" ON public."academic_years" AS PERMISSIVE FOR UPDATE TO "authenticated" USING (private.can_edit_content()) WITH CHECK (private.can_edit_content());

CREATE POLICY "assessments_delete_staff" ON public."assessments" AS PERMISSIVE FOR DELETE TO "authenticated" USING (private.can_edit_content());

CREATE POLICY "assessments_insert_staff" ON public."assessments" AS PERMISSIVE FOR INSERT TO "authenticated" WITH CHECK (private.can_edit_content());

CREATE POLICY "assessments_read" ON public."assessments" AS PERMISSIVE FOR SELECT TO "authenticated" USING ((private.is_staff() OR (EXISTS ( SELECT 1
   FROM lessons l
  WHERE ((l.id = assessments.lesson_id) AND (l.status = 'published'::text))))));

CREATE POLICY "assessments_update_staff" ON public."assessments" AS PERMISSIVE FOR UPDATE TO "authenticated" USING (private.can_edit_content()) WITH CHECK (private.can_edit_content());

CREATE POLICY "content_reviews_delete_reviewers" ON public."content_reviews" AS PERMISSIVE FOR DELETE TO "authenticated" USING (private.can_review_content());

CREATE POLICY "content_reviews_insert_staff" ON public."content_reviews" AS PERMISSIVE FOR INSERT TO "authenticated" WITH CHECK ((private.is_staff() AND ((submitted_by IS NULL) OR (submitted_by = ( SELECT miraj_migration.legacy_user_id() AS uid)))));

CREATE POLICY "content_reviews_read_staff" ON public."content_reviews" AS PERMISSIVE FOR SELECT TO "authenticated" USING (private.is_staff());

CREATE POLICY "content_reviews_update_staff" ON public."content_reviews" AS PERMISSIVE FOR UPDATE TO "authenticated" USING ((private.can_review_content() OR (submitted_by = ( SELECT miraj_migration.legacy_user_id() AS uid)))) WITH CHECK ((private.can_review_content() OR (submitted_by = ( SELECT miraj_migration.legacy_user_id() AS uid))));

CREATE POLICY "curricula_delete_staff" ON public."curricula" AS PERMISSIVE FOR DELETE TO "authenticated" USING (private.can_edit_content());

CREATE POLICY "curricula_insert_staff" ON public."curricula" AS PERMISSIVE FOR INSERT TO "authenticated" WITH CHECK (private.can_edit_content());

CREATE POLICY "curricula_read_published" ON public."curricula" AS PERMISSIVE FOR SELECT TO "authenticated" USING (((status = 'published'::text) OR private.is_staff()));

CREATE POLICY "curricula_update_staff" ON public."curricula" AS PERMISSIVE FOR UPDATE TO "authenticated" USING (private.can_edit_content()) WITH CHECK (private.can_edit_content());

CREATE POLICY "daily_journal_entries_own_delete" ON public."daily_journal_entries" AS PERMISSIVE FOR DELETE TO "authenticated" USING (private.owns_journal(journal_id));

CREATE POLICY "daily_journal_entries_own_insert" ON public."daily_journal_entries" AS PERMISSIVE FOR INSERT TO "authenticated" WITH CHECK (private.owns_journal(journal_id));

CREATE POLICY "daily_journal_entries_own_select" ON public."daily_journal_entries" AS PERMISSIVE FOR SELECT TO "authenticated" USING (private.owns_journal(journal_id));

CREATE POLICY "daily_journal_entries_own_update" ON public."daily_journal_entries" AS PERMISSIVE FOR UPDATE TO "authenticated" USING (private.owns_journal(journal_id)) WITH CHECK (private.owns_journal(journal_id));

CREATE POLICY "daily_journals_own_delete" ON public."daily_journals" AS PERMISSIVE FOR DELETE TO "authenticated" USING (private.owns_teacher_context(teacher_context_id));

CREATE POLICY "daily_journals_own_insert" ON public."daily_journals" AS PERMISSIVE FOR INSERT TO "authenticated" WITH CHECK (private.owns_teacher_context(teacher_context_id));

CREATE POLICY "daily_journals_own_select" ON public."daily_journals" AS PERMISSIVE FOR SELECT TO "authenticated" USING (private.owns_teacher_context(teacher_context_id));

CREATE POLICY "daily_journals_own_update" ON public."daily_journals" AS PERMISSIVE FOR UPDATE TO "authenticated" USING (private.owns_teacher_context(teacher_context_id)) WITH CHECK (private.owns_teacher_context(teacher_context_id));

CREATE POLICY "domains_delete_staff" ON public."domains" AS PERMISSIVE FOR DELETE TO "authenticated" USING (private.can_edit_content());

CREATE POLICY "domains_insert_staff" ON public."domains" AS PERMISSIVE FOR INSERT TO "authenticated" WITH CHECK (private.can_edit_content());

CREATE POLICY "domains_read_active" ON public."domains" AS PERMISSIVE FOR SELECT TO "authenticated" USING ((is_active OR private.is_staff()));

CREATE POLICY "domains_update_staff" ON public."domains" AS PERMISSIVE FOR UPDATE TO "authenticated" USING (private.can_edit_content()) WITH CHECK (private.can_edit_content());

CREATE POLICY "grades_delete_staff" ON public."grades" AS PERMISSIVE FOR DELETE TO "authenticated" USING (private.can_edit_content());

CREATE POLICY "grades_insert_staff" ON public."grades" AS PERMISSIVE FOR INSERT TO "authenticated" WITH CHECK (private.can_edit_content());

CREATE POLICY "grades_read_active" ON public."grades" AS PERMISSIVE FOR SELECT TO "authenticated" USING ((is_active OR private.is_staff()));

CREATE POLICY "grades_update_staff" ON public."grades" AS PERMISSIVE FOR UPDATE TO "authenticated" USING (private.can_edit_content()) WITH CHECK (private.can_edit_content());

CREATE POLICY "lesson_activities_delete_staff" ON public."lesson_activities" AS PERMISSIVE FOR DELETE TO "authenticated" USING (private.can_edit_content());

CREATE POLICY "lesson_activities_insert_staff" ON public."lesson_activities" AS PERMISSIVE FOR INSERT TO "authenticated" WITH CHECK (private.can_edit_content());

CREATE POLICY "lesson_activities_read" ON public."lesson_activities" AS PERMISSIVE FOR SELECT TO "authenticated" USING ((private.is_staff() OR (EXISTS ( SELECT 1
   FROM lessons l
  WHERE ((l.id = lesson_activities.lesson_id) AND (l.status = 'published'::text))))));

CREATE POLICY "lesson_activities_update_staff" ON public."lesson_activities" AS PERMISSIVE FOR UPDATE TO "authenticated" USING (private.can_edit_content()) WITH CHECK (private.can_edit_content());

CREATE POLICY "lesson_plan_stages_delete_staff" ON public."lesson_plan_stages" AS PERMISSIVE FOR DELETE TO "authenticated" USING (private.can_edit_content());

CREATE POLICY "lesson_plan_stages_insert_staff" ON public."lesson_plan_stages" AS PERMISSIVE FOR INSERT TO "authenticated" WITH CHECK (private.can_edit_content());

CREATE POLICY "lesson_plan_stages_read" ON public."lesson_plan_stages" AS PERMISSIVE FOR SELECT TO "authenticated" USING ((private.is_staff() OR (EXISTS ( SELECT 1
   FROM (lesson_plans lp
     JOIN lessons l ON ((l.id = lp.lesson_id)))
  WHERE ((lp.id = lesson_plan_stages.lesson_plan_id) AND (lp.status = 'published'::text) AND (l.status = 'published'::text))))));

CREATE POLICY "lesson_plan_stages_update_staff" ON public."lesson_plan_stages" AS PERMISSIVE FOR UPDATE TO "authenticated" USING (private.can_edit_content()) WITH CHECK (private.can_edit_content());

CREATE POLICY "lesson_plans_delete_staff" ON public."lesson_plans" AS PERMISSIVE FOR DELETE TO "authenticated" USING (private.can_edit_content());

CREATE POLICY "lesson_plans_insert_staff" ON public."lesson_plans" AS PERMISSIVE FOR INSERT TO "authenticated" WITH CHECK (private.can_edit_content());

CREATE POLICY "lesson_plans_read" ON public."lesson_plans" AS PERMISSIVE FOR SELECT TO "authenticated" USING ((private.is_staff() OR ((status = 'published'::text) AND (EXISTS ( SELECT 1
   FROM lessons l
  WHERE ((l.id = lesson_plans.lesson_id) AND (l.status = 'published'::text)))))));

CREATE POLICY "lesson_plans_update_staff" ON public."lesson_plans" AS PERMISSIVE FOR UPDATE TO "authenticated" USING (private.can_edit_content()) WITH CHECK (private.can_edit_content());

CREATE POLICY "lesson_resources_delete_staff" ON public."lesson_resources" AS PERMISSIVE FOR DELETE TO "authenticated" USING (private.can_edit_content());

CREATE POLICY "lesson_resources_insert_staff" ON public."lesson_resources" AS PERMISSIVE FOR INSERT TO "authenticated" WITH CHECK (private.can_edit_content());

CREATE POLICY "lesson_resources_read" ON public."lesson_resources" AS PERMISSIVE FOR SELECT TO "authenticated" USING ((private.is_staff() OR ((EXISTS ( SELECT 1
   FROM lessons l
  WHERE ((l.id = lesson_resources.lesson_id) AND (l.status = 'published'::text)))) AND (EXISTS ( SELECT 1
   FROM resources r
  WHERE ((r.id = lesson_resources.resource_id) AND (r.status = 'published'::text)))))));

CREATE POLICY "lesson_resources_update_staff" ON public."lesson_resources" AS PERMISSIVE FOR UPDATE TO "authenticated" USING (private.can_edit_content()) WITH CHECK (private.can_edit_content());

CREATE POLICY "lesson_texts_delete_staff" ON public."lesson_texts" AS PERMISSIVE FOR DELETE TO "authenticated" USING (private.can_edit_content());

CREATE POLICY "lesson_texts_insert_staff" ON public."lesson_texts" AS PERMISSIVE FOR INSERT TO "authenticated" WITH CHECK (private.can_edit_content());

CREATE POLICY "lesson_texts_read" ON public."lesson_texts" AS PERMISSIVE FOR SELECT TO "authenticated" USING ((private.is_staff() OR (EXISTS ( SELECT 1
   FROM lessons l
  WHERE ((l.id = lesson_texts.lesson_id) AND (l.status = 'published'::text))))));

CREATE POLICY "lesson_texts_update_staff" ON public."lesson_texts" AS PERMISSIVE FOR UPDATE TO "authenticated" USING (private.can_edit_content()) WITH CHECK (private.can_edit_content());

CREATE POLICY "lessons_delete_staff" ON public."lessons" AS PERMISSIVE FOR DELETE TO "authenticated" USING (private.can_edit_content());

CREATE POLICY "lessons_insert_staff" ON public."lessons" AS PERMISSIVE FOR INSERT TO "authenticated" WITH CHECK (private.can_edit_content());

CREATE POLICY "lessons_read_published" ON public."lessons" AS PERMISSIVE FOR SELECT TO "authenticated" USING ((private.is_staff() OR ((status = 'published'::text) AND (EXISTS ( SELECT 1
   FROM ((weeks w
     JOIN units u ON ((u.id = w.unit_id)))
     JOIN curricula c ON ((c.id = u.curriculum_id)))
  WHERE ((w.id = lessons.week_id) AND (w.status = 'published'::text) AND (u.status = 'published'::text) AND (c.status = 'published'::text)))))));

CREATE POLICY "lessons_update_staff" ON public."lessons" AS PERMISSIVE FOR UPDATE TO "authenticated" USING (private.can_edit_content()) WITH CHECK (private.can_edit_content());

CREATE POLICY "library_items_own_delete" ON public."library_items" AS PERMISSIVE FOR DELETE TO "authenticated" USING (private.owns_teacher_context(teacher_context_id));

CREATE POLICY "library_items_own_insert" ON public."library_items" AS PERMISSIVE FOR INSERT TO "authenticated" WITH CHECK (private.owns_teacher_context(teacher_context_id));

CREATE POLICY "library_items_own_select" ON public."library_items" AS PERMISSIVE FOR SELECT TO "authenticated" USING (private.owns_teacher_context(teacher_context_id));

CREATE POLICY "library_items_own_update" ON public."library_items" AS PERMISSIVE FOR UPDATE TO "authenticated" USING (private.owns_teacher_context(teacher_context_id)) WITH CHECK (private.owns_teacher_context(teacher_context_id));

CREATE POLICY "profiles_select_self_or_admin" ON public."profiles" AS PERMISSIVE FOR SELECT TO "authenticated" USING (((id = ( SELECT miraj_migration.legacy_user_id() AS uid)) OR private.is_admin()));

CREATE POLICY "profiles_update_own" ON public."profiles" AS PERMISSIVE FOR UPDATE TO "authenticated" USING ((id = ( SELECT miraj_migration.legacy_user_id() AS uid))) WITH CHECK ((id = ( SELECT miraj_migration.legacy_user_id() AS uid)));

CREATE POLICY "remediation_activities_delete_staff" ON public."remediation_activities" AS PERMISSIVE FOR DELETE TO "authenticated" USING (private.can_edit_content());

CREATE POLICY "remediation_activities_insert_staff" ON public."remediation_activities" AS PERMISSIVE FOR INSERT TO "authenticated" WITH CHECK (private.can_edit_content());

CREATE POLICY "remediation_activities_read" ON public."remediation_activities" AS PERMISSIVE FOR SELECT TO "authenticated" USING ((private.is_staff() OR (EXISTS ( SELECT 1
   FROM lessons l
  WHERE ((l.id = remediation_activities.lesson_id) AND (l.status = 'published'::text))))));

CREATE POLICY "remediation_activities_update_staff" ON public."remediation_activities" AS PERMISSIVE FOR UPDATE TO "authenticated" USING (private.can_edit_content()) WITH CHECK (private.can_edit_content());

CREATE POLICY "resources_delete_staff" ON public."resources" AS PERMISSIVE FOR DELETE TO "authenticated" USING (private.can_edit_content());

CREATE POLICY "resources_insert_staff" ON public."resources" AS PERMISSIVE FOR INSERT TO "authenticated" WITH CHECK (private.can_edit_content());

CREATE POLICY "resources_read" ON public."resources" AS PERMISSIVE FOR SELECT TO "authenticated" USING (((status = 'published'::text) OR private.is_staff()));

CREATE POLICY "resources_update_staff" ON public."resources" AS PERMISSIVE FOR UPDATE TO "authenticated" USING (private.can_edit_content()) WITH CHECK (private.can_edit_content());

CREATE POLICY "subjects_delete_staff" ON public."subjects" AS PERMISSIVE FOR DELETE TO "authenticated" USING (private.can_edit_content());

CREATE POLICY "subjects_insert_staff" ON public."subjects" AS PERMISSIVE FOR INSERT TO "authenticated" WITH CHECK (private.can_edit_content());

CREATE POLICY "subjects_read_active" ON public."subjects" AS PERMISSIVE FOR SELECT TO "authenticated" USING ((is_active OR private.is_staff()));

CREATE POLICY "subjects_update_staff" ON public."subjects" AS PERMISSIVE FOR UPDATE TO "authenticated" USING (private.can_edit_content()) WITH CHECK (private.can_edit_content());

CREATE POLICY "teacher_contexts_own_delete" ON public."teacher_academic_contexts" AS PERMISSIVE FOR DELETE TO "authenticated" USING ((user_id = ( SELECT miraj_migration.legacy_user_id() AS uid)));

CREATE POLICY "teacher_contexts_own_insert" ON public."teacher_academic_contexts" AS PERMISSIVE FOR INSERT TO "authenticated" WITH CHECK ((user_id = ( SELECT miraj_migration.legacy_user_id() AS uid)));

CREATE POLICY "teacher_contexts_own_select" ON public."teacher_academic_contexts" AS PERMISSIVE FOR SELECT TO "authenticated" USING ((user_id = ( SELECT miraj_migration.legacy_user_id() AS uid)));

CREATE POLICY "teacher_contexts_own_update" ON public."teacher_academic_contexts" AS PERMISSIVE FOR UPDATE TO "authenticated" USING ((user_id = ( SELECT miraj_migration.legacy_user_id() AS uid))) WITH CHECK ((user_id = ( SELECT miraj_migration.legacy_user_id() AS uid)));

CREATE POLICY "teacher_class_pupils_own" ON public."teacher_class_pupils" AS PERMISSIVE FOR ALL TO "authenticated" USING (private.owns_teacher_context(teacher_context_id)) WITH CHECK (private.owns_teacher_context(teacher_context_id));

CREATE POLICY "teacher_lesson_customizations_own_delete" ON public."teacher_lesson_customizations" AS PERMISSIVE FOR DELETE TO "authenticated" USING (private.owns_teacher_context(teacher_context_id));

CREATE POLICY "teacher_lesson_customizations_own_insert" ON public."teacher_lesson_customizations" AS PERMISSIVE FOR INSERT TO "authenticated" WITH CHECK (private.owns_teacher_context(teacher_context_id));

CREATE POLICY "teacher_lesson_customizations_own_select" ON public."teacher_lesson_customizations" AS PERMISSIVE FOR SELECT TO "authenticated" USING (private.owns_teacher_context(teacher_context_id));

CREATE POLICY "teacher_lesson_customizations_own_update" ON public."teacher_lesson_customizations" AS PERMISSIVE FOR UPDATE TO "authenticated" USING (private.owns_teacher_context(teacher_context_id)) WITH CHECK (private.owns_teacher_context(teacher_context_id));

CREATE POLICY "teacher_lesson_progress_own_delete" ON public."teacher_lesson_progress" AS PERMISSIVE FOR DELETE TO "authenticated" USING (private.owns_teacher_context(teacher_context_id));

CREATE POLICY "teacher_lesson_progress_own_insert" ON public."teacher_lesson_progress" AS PERMISSIVE FOR INSERT TO "authenticated" WITH CHECK (private.owns_teacher_context(teacher_context_id));

CREATE POLICY "teacher_lesson_progress_own_select" ON public."teacher_lesson_progress" AS PERMISSIVE FOR SELECT TO "authenticated" USING (private.owns_teacher_context(teacher_context_id));

CREATE POLICY "teacher_lesson_progress_own_update" ON public."teacher_lesson_progress" AS PERMISSIVE FOR UPDATE TO "authenticated" USING (private.owns_teacher_context(teacher_context_id)) WITH CHECK (private.owns_teacher_context(teacher_context_id));

CREATE POLICY "professional_card_insert_own" ON public."teacher_professional_cards" AS PERMISSIVE FOR INSERT TO "authenticated" WITH CHECK ((user_id = ( SELECT miraj_migration.legacy_user_id() AS uid)));

CREATE POLICY "professional_card_select_own" ON public."teacher_professional_cards" AS PERMISSIVE FOR SELECT TO "authenticated" USING ((user_id = ( SELECT miraj_migration.legacy_user_id() AS uid)));

CREATE POLICY "professional_card_update_own" ON public."teacher_professional_cards" AS PERMISSIVE FOR UPDATE TO "authenticated" USING ((user_id = ( SELECT miraj_migration.legacy_user_id() AS uid))) WITH CHECK ((user_id = ( SELECT miraj_migration.legacy_user_id() AS uid)));

CREATE POLICY "teacher_register_records_own" ON public."teacher_register_records" AS PERMISSIVE FOR ALL TO "authenticated" USING (private.owns_teacher_context(teacher_context_id)) WITH CHECK (private.owns_teacher_context(teacher_context_id));

CREATE POLICY "teacher_timetables_own_delete" ON public."teacher_timetables" AS PERMISSIVE FOR DELETE TO "authenticated" USING (private.owns_teacher_context(teacher_context_id));

CREATE POLICY "teacher_timetables_own_insert" ON public."teacher_timetables" AS PERMISSIVE FOR INSERT TO "authenticated" WITH CHECK (private.owns_teacher_context(teacher_context_id));

CREATE POLICY "teacher_timetables_own_select" ON public."teacher_timetables" AS PERMISSIVE FOR SELECT TO "authenticated" USING (private.owns_teacher_context(teacher_context_id));

CREATE POLICY "teacher_timetables_own_update" ON public."teacher_timetables" AS PERMISSIVE FOR UPDATE TO "authenticated" USING (private.owns_teacher_context(teacher_context_id)) WITH CHECK (private.owns_teacher_context(teacher_context_id));

CREATE POLICY "timetable_slots_own_delete" ON public."timetable_slots" AS PERMISSIVE FOR DELETE TO "authenticated" USING (private.owns_timetable(timetable_id));

CREATE POLICY "timetable_slots_own_insert" ON public."timetable_slots" AS PERMISSIVE FOR INSERT TO "authenticated" WITH CHECK (private.owns_timetable(timetable_id));

CREATE POLICY "timetable_slots_own_select" ON public."timetable_slots" AS PERMISSIVE FOR SELECT TO "authenticated" USING (private.owns_timetable(timetable_id));

CREATE POLICY "timetable_slots_own_update" ON public."timetable_slots" AS PERMISSIVE FOR UPDATE TO "authenticated" USING (private.owns_timetable(timetable_id)) WITH CHECK (private.owns_timetable(timetable_id));

CREATE POLICY "units_delete_staff" ON public."units" AS PERMISSIVE FOR DELETE TO "authenticated" USING (private.can_edit_content());

CREATE POLICY "units_insert_staff" ON public."units" AS PERMISSIVE FOR INSERT TO "authenticated" WITH CHECK (private.can_edit_content());

CREATE POLICY "units_read_published" ON public."units" AS PERMISSIVE FOR SELECT TO "authenticated" USING ((private.is_staff() OR ((status = 'published'::text) AND (EXISTS ( SELECT 1
   FROM curricula c
  WHERE ((c.id = units.curriculum_id) AND (c.status = 'published'::text)))))));

CREATE POLICY "units_update_staff" ON public."units" AS PERMISSIVE FOR UPDATE TO "authenticated" USING (private.can_edit_content()) WITH CHECK (private.can_edit_content());

CREATE POLICY "weeks_delete_staff" ON public."weeks" AS PERMISSIVE FOR DELETE TO "authenticated" USING (private.can_edit_content());

CREATE POLICY "weeks_insert_staff" ON public."weeks" AS PERMISSIVE FOR INSERT TO "authenticated" WITH CHECK (private.can_edit_content());

CREATE POLICY "weeks_read_published" ON public."weeks" AS PERMISSIVE FOR SELECT TO "authenticated" USING ((private.is_staff() OR ((status = 'published'::text) AND (EXISTS ( SELECT 1
   FROM (units u
     JOIN curricula c ON ((c.id = u.curriculum_id)))
  WHERE ((u.id = weeks.unit_id) AND (u.status = 'published'::text) AND (c.status = 'published'::text)))))));

CREATE POLICY "weeks_update_staff" ON public."weeks" AS PERMISSIVE FOR UPDATE TO "authenticated" USING (private.can_edit_content()) WITH CHECK (private.can_edit_content());

GRANT USAGE ON SCHEMA public TO authenticated;

GRANT SELECT,INSERT,UPDATE,DELETE ON ALL TABLES IN SCHEMA public TO authenticated;

GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA private TO authenticated;

GRANT EXECUTE ON FUNCTION public.save_my_daily_journal(date,text,jsonb) TO authenticated;

COMMIT;
