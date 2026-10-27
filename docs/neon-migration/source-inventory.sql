-- Miraj Ostadh / READ-ONLY inventory, run ONLY inside the verified Supabase
-- project ltcchvjxgdcdsvgrmtjb using a trusted SQL client.
-- Do not export user email, names, tokens, auth password hashes or file contents.
-- Treat counts/schema metadata as private; never commit query results.
BEGIN READ ONLY;
SELECT current_database() AS source_database,
       current_setting('server_version') AS postgres_version;
SELECT table_schema, table_name,
       (SELECT relrowsecurity FROM pg_class WHERE oid=format('%I.%I',table_schema,table_name)::regclass) AS rls_enabled,
       (SELECT relforcerowsecurity FROM pg_class WHERE oid=format('%I.%I',table_schema,table_name)::regclass) AS force_rls
FROM information_schema.tables
WHERE table_schema IN ('public','auth','storage') AND table_type='BASE TABLE'
ORDER BY table_schema,table_name;
SELECT n.nspname AS schema_name,c.relname AS table_name,c.reltuples::bigint AS estimated_rows
FROM pg_class c JOIN pg_namespace n ON n.oid=c.relnamespace
WHERE c.relkind IN ('r','p') AND n.nspname IN ('public','auth','storage')
ORDER BY n.nspname,c.relname;
SELECT conrelid::regclass::text AS from_table,confrelid::regclass::text AS to_table,
       conname AS foreign_key,pg_get_constraintdef(oid) AS definition
FROM pg_constraint WHERE contype='f'
AND connamespace IN (SELECT oid FROM pg_namespace WHERE nspname IN ('public','auth','storage'))
ORDER BY from_table,foreign_key;
SELECT schemaname,tablename,policyname,permissive,roles,cmd,qual,with_check
FROM pg_policies WHERE schemaname IN ('public','auth','storage')
ORDER BY schemaname,tablename,policyname;
SELECT n.nspname AS function_schema,p.proname AS function_name,
       pg_get_function_identity_arguments(p.oid) AS function_arguments,
       p.prosecdef AS security_definer
FROM pg_proc p JOIN pg_namespace n ON n.oid=p.pronamespace
WHERE n.nspname IN ('public','private') ORDER BY n.nspname,p.proname;
SELECT n.nspname AS table_schema,c.relname AS table_name,t.tgname AS trigger_name,
       pg_get_triggerdef(t.oid) AS trigger_definition
FROM pg_trigger t JOIN pg_class c ON c.oid=t.tgrelid
JOIN pg_namespace n ON n.oid=c.relnamespace
WHERE NOT t.tgisinternal AND n.nspname IN ('public','auth','storage')
ORDER BY n.nspname,c.relname,t.tgname;
SELECT extname,extversion FROM pg_extension ORDER BY extname;
SELECT 'auth.users' AS object, COUNT(*) AS row_count FROM auth.users
UNION ALL SELECT 'public.profiles',COUNT(*) FROM public.profiles
UNION ALL SELECT 'public.teacher_academic_contexts',COUNT(*) FROM public.teacher_academic_contexts
UNION ALL SELECT 'public.daily_journals',COUNT(*) FROM public.daily_journals
UNION ALL SELECT 'public.timetable_slots',COUNT(*) FROM public.timetable_slots
UNION ALL SELECT 'storage.objects',COUNT(*) FROM storage.objects
UNION ALL SELECT 'storage.buckets',COUNT(*) FROM storage.buckets;
COMMIT;
