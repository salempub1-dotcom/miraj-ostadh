-- Grant authenticated users the SQL privileges required by the existing RLS policies.
-- Keep profile role/email/system fields protected from self-service updates.

grant usage on schema public to authenticated;

grant select, insert, update, delete on table
  public.academic_years,
  public.grades,
  public.subjects,
  public.domains,
  public.curricula,
  public.units,
  public.weeks,
  public.lessons,
  public.lesson_plans,
  public.lesson_plan_stages,
  public.lesson_texts,
  public.lesson_activities,
  public.assessments,
  public.remediation_activities,
  public.resources,
  public.lesson_resources,
  public.content_reviews,
  public.teacher_academic_contexts,
  public.teacher_timetables,
  public.timetable_slots,
  public.teacher_lesson_progress,
  public.teacher_lesson_customizations,
  public.library_items,
  public.daily_journals,
  public.daily_journal_entries
  to authenticated;

grant select on table public.profiles to authenticated;
grant update (full_name, display_name, province, school_name, avatar_url) on table public.profiles to authenticated;

revoke insert, delete on table public.profiles from authenticated;
revoke update (email, role, created_at, updated_at) on table public.profiles from authenticated;
