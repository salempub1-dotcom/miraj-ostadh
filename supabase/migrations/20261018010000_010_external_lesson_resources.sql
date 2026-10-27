-- Miraj Ostadh only: extend existing resources for external-source indexing.
-- Imported Drive materials remain drafts until a content reviewer approves them.
alter table public.resources
  alter column storage_bucket drop not null,
  alter column storage_path drop not null;
alter table public.resources
  add column if not exists external_source text,
  add column if not exists external_file_id text,
  add column if not exists external_url text,
  add column if not exists curriculum_grade_code text,
  add column if not exists curriculum_subject_code text,
  add column if not exists sequence_number integer,
  add column if not exists lesson_number integer,
  add column if not exists educational_category text,
  add column if not exists source_verified boolean not null default false;
alter table public.resources
  add constraint resources_file_location_check
    check ((storage_bucket is not null and storage_path is not null)
       or (external_url is not null and external_url ~ '^https://'));
alter table public.resources add constraint resources_external_publication_review_check
  check (external_source is null or status <> 'published' or source_verified = true);
create unique index if not exists resources_external_source_file_idx
  on public.resources (external_source,external_file_id)
  where external_source is not null and external_file_id is not null;
create index if not exists resources_curriculum_locator_idx
  on public.resources (curriculum_grade_code,curriculum_subject_code,sequence_number,lesson_number,status);
-- Never infer publication approval from a Drive filename.
insert into public.resources
(title, description, resource_type, external_source, external_file_id, external_url,
 curriculum_grade_code,curriculum_subject_code,sequence_number,lesson_number,educational_category,status,source_verified)
values
('الأعداد من 1 إلى 5 (1) — مذكرة الرياضيات','مذكرة مستوردة للفهرسة والمراجعة؛ توافق 2026–2027 غير مثبت','pdf','google_drive','1e0SoChj_HoqZGSPPHOvqgHUHy0t4fBIp','https://drive.google.com/file/d/1e0SoChj_HoqZGSPPHOvqgHUHy0t4fBIp/view','1AP','MATHEMATICS',1,1,'lesson_plan','draft',false),
('تعيين موقع في الفضاء (1) — مذكرة الرياضيات','مذكرة تحتاج مراجعة قبل النشر','pdf','google_drive','16kTxjlvwAtUsfu7kqYVgSifpyF0Dles7','https://drive.google.com/file/d/16kTxjlvwAtUsfu7kqYVgSifpyF0Dles7/view','1AP','MATHEMATICS',1,2,'lesson_plan','draft',false),
('متمم عدد إلى العشرة الموالية — مذكرة الرياضيات','تكرار محتمل لدى المصدر؛ تحقق قبل النشر','pdf','google_drive','1yRUJSyIK1ZlWQRwyeBMEfE41Boa-xbNO','https://drive.google.com/file/d/1yRUJSyIK1ZlWQRwyeBMEfE41Boa-xbNO/view','1AP','MATHEMATICS',5,52,'lesson_plan','draft',false)
on conflict do nothing;
-- Future editors link a reviewed/published resource to the matching lesson
-- via the existing public.lesson_resources table, after the official lesson import.
