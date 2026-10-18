-- Miraj Ostadh: atomic change of teacher's current grade without deleting previous grade history.
-- Invoker permissions and RLS apply; the caller may operate only on their own contexts.
create or replace function public.switch_my_teaching_grade(p_curriculum_id uuid, p_class_name text default null)
returns uuid
language plpgsql
security invoker
set search_path = ''
as $$
declare
  v_user uuid := (select auth.uid());
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
$$;
revoke all on function public.switch_my_teaching_grade(uuid,text) from public,anon;
grant execute on function public.switch_my_teaching_grade(uuid,text) to authenticated;
