-- Miraj Ostadh — Migration 002
-- Security and performance hardening after Supabase advisor review

create schema if not exists private;
revoke all on schema private from public;
revoke all on schema private from anon;
grant usage on schema private to authenticated;

alter function public.set_updated_at() set schema private;
alter function public.handle_new_user() set schema private;
alter function public.is_staff() set schema private;
alter function public.can_edit_content() set schema private;
alter function public.is_admin() set schema private;

alter function private.set_updated_at() set search_path = public, pg_temp;
alter function private.handle_new_user() set search_path = public, pg_temp;
alter function private.is_staff() set search_path = public, pg_temp;
alter function private.can_edit_content() set search_path = public, pg_temp;
alter function private.is_admin() set search_path = public, pg_temp;

revoke all on function private.set_updated_at() from public, anon, authenticated;
revoke all on function private.handle_new_user() from public, anon, authenticated;
revoke all on function private.is_staff() from public, anon, authenticated;
revoke all on function private.can_edit_content() from public, anon, authenticated;
revoke all on function private.is_admin() from public, anon, authenticated;

grant execute on function private.is_staff() to authenticated;
grant execute on function private.can_edit_content() to authenticated;
grant execute on function private.is_admin() to authenticated;

-- Supabase automatic-RLS helper should never be directly callable from the API.
do $$
begin
  if to_regprocedure('public.rls_auto_enable()') is not null then
    execute 'revoke all on function public.rls_auto_enable() from public, anon, authenticated';
  end if;
end;
$$;

-- Optimize profile policies and avoid multiple permissive SELECT policies.
drop policy if exists "profiles_select_own" on public.profiles;
drop policy if exists "profiles_select_admin" on public.profiles;
drop policy if exists "profiles_update_own" on public.profiles;

create policy "profiles_select_self_or_admin"
on public.profiles for select
to authenticated
using (id = (select auth.uid()) or private.is_admin());

create policy "profiles_update_own"
on public.profiles for update
to authenticated
using (id = (select auth.uid()))
with check (id = (select auth.uid()));

-- Split write policies so SELECT has only one permissive policy per table.
do $$
declare
  table_name text;
begin
  foreach table_name in array array[
    'academic_years',
    'grades',
    'subjects',
    'domains',
    'curricula',
    'units',
    'weeks',
    'lessons'
  ]
  loop
    execute format('drop policy if exists %I on public.%I', table_name || '_edit_staff', table_name);

    execute format(
      'create policy %I on public.%I for insert to authenticated with check (private.can_edit_content())',
      table_name || '_insert_staff', table_name
    );

    execute format(
      'create policy %I on public.%I for update to authenticated using (private.can_edit_content()) with check (private.can_edit_content())',
      table_name || '_update_staff', table_name
    );

    execute format(
      'create policy %I on public.%I for delete to authenticated using (private.can_edit_content())',
      table_name || '_delete_staff', table_name
    );
  end loop;
end;
$$;

-- Cover foreign keys frequently used by joins and admin screens.
create index if not exists curricula_grade_idx on public.curricula (grade_id);
create index if not exists curricula_subject_idx on public.curricula (subject_id);
create index if not exists curricula_created_by_idx on public.curricula (created_by);
create index if not exists lessons_created_by_idx on public.lessons (created_by);
