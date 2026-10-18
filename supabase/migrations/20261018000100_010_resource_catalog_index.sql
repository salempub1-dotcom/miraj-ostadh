-- Additive resource indexing for Miraj Ostadh ONLY (ltcchvjxgdcdsvgrmtjb).
-- Existing teacher data, published curricula and existing tables remain intact.
alter table public.resources
  add column if not exists source_provider text,
  add column if not exists source_file_id text,
  add column if not exists external_url text,
  add column if not exists grade_code text,
  add column if not exists subject_code text,
  add column if not exists unit_number integer,
  add column if not exists lesson_number integer,
  add column if not exists review_status text not null default 'unreviewed';
alter table public.resources
  add constraint resources_review_status_check
  check (review_status in ('unreviewed','verified','outdated','rejected'));
create unique index if not exists resources_source_identity_idx
  on public.resources(source_provider, source_file_id)
  where source_provider is not null and source_file_id is not null;
create index if not exists resources_catalog_lookup_idx
  on public.resources(grade_code,subject_code,unit_number,lesson_number,status);
-- This explicitly protects against accidental publication of unreviewed Drive resources.
drop policy if exists "resources_read" on public.resources;
create policy "resources_read" on public.resources for select to authenticated
using ((status = 'published' and review_status = 'verified') or private.is_staff());

-- Three confirmed Drive identifiers, kept in draft until pedagogical and copyright review.
insert into public.resources
(title,description,resource_type,storage_bucket,storage_path,mime_type,status,
 source_provider,source_file_id,external_url,grade_code,subject_code,unit_number,lesson_number,review_status)
values
('الأعداد من 1 إلى 5 (1)','مذكرة الرياضيات — المقطع الأول، الدرس 01','pdf','external-drive','1e0SoChj_HoqZGSPPHOvqgHUHy0t4fBIp','application/pdf','draft','google_drive','1e0SoChj_HoqZGSPPHOvqgHUHy0t4fBIp','https://drive.google.com/file/d/1e0SoChj_HoqZGSPPHOvqgHUHy0t4fBIp/view','1AP','MATH',1,1,'unreviewed'),
('تعيين موقع في الفضاء (1)','مذكرة الرياضيات — المقطع الأول، الدرس 02','pdf','external-drive','16kTxjlvwAtUsfu7kqYVgSifpyF0Dles7','application/pdf','draft','google_drive','16kTxjlvwAtUsfu7kqYVgSifpyF0Dles7','https://drive.google.com/file/d/16kTxjlvwAtUsfu7kqYVgSifpyF0Dles7/view','1AP','MATH',1,2,'unreviewed'),
('متمم عدد إلى العشرة الموالية','مذكرة الرياضيات — المقطع الخامس، الدرس 52','pdf','external-drive','1yRUJSyIK1ZlWQRwyeBMEfE41Boa-xbNO','application/pdf','draft','google_drive','1yRUJSyIK1ZlWQRwyeBMEfE41Boa-xbNO','https://drive.google.com/file/d/1yRUJSyIK1ZlWQRwyeBMEfE41Boa-xbNO/view','1AP','MATH',5,52,'unreviewed')
on conflict (storage_bucket,storage_path) do nothing;
