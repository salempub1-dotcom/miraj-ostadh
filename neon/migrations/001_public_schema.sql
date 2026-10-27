-- Miraj Ostadh: recreated from LIVE Supabase public schema metadata.

-- Trial source ltcchvjxgdcdsvgrmtjb, Neon branch br-cold-grass-b4x3kbmz.

-- No auth.users / storage internals / passwords / user data included.

-- Run only on a new isolated Neon branch; requires neon_auth provisioned separately.

BEGIN;

CREATE TABLE IF NOT EXISTS public."academic_years" (
 "id" uuid NOT NULL DEFAULT gen_random_uuid(),
 "name" text NOT NULL,
 "starts_on" date NOT NULL,
 "ends_on" date NOT NULL,
 "is_current" boolean NOT NULL DEFAULT false,
 "is_active" boolean NOT NULL DEFAULT true,
 "created_at" timestamptz NOT NULL DEFAULT now(),
 PRIMARY KEY (id)
);

ALTER TABLE public."academic_years" ENABLE ROW LEVEL SECURITY;

ALTER TABLE public."academic_years" FORCE ROW LEVEL SECURITY;

CREATE TABLE IF NOT EXISTS public."assessments" (
 "id" uuid NOT NULL DEFAULT gen_random_uuid(),
 "lesson_id" uuid NOT NULL,
 "title" text NOT NULL,
 "instructions" text,
 "content" text,
 "answer_key" text,
 "assessment_type" text,
 "order_index" integer NOT NULL DEFAULT 0,
 "created_at" timestamptz NOT NULL DEFAULT now(),
 "updated_at" timestamptz NOT NULL DEFAULT now(),
 PRIMARY KEY (id)
);

ALTER TABLE public."assessments" ENABLE ROW LEVEL SECURITY;

ALTER TABLE public."assessments" FORCE ROW LEVEL SECURITY;

CREATE TABLE IF NOT EXISTS public."content_reviews" (
 "id" uuid NOT NULL DEFAULT gen_random_uuid(),
 "content_type" text NOT NULL,
 "content_id" uuid NOT NULL,
 "submitted_by" uuid,
 "reviewer_id" uuid,
 "status" text NOT NULL DEFAULT 'pending'::text,
 "review_comment" text,
 "submitted_at" timestamptz NOT NULL DEFAULT now(),
 "reviewed_at" timestamptz,
 PRIMARY KEY (id)
);

ALTER TABLE public."content_reviews" ENABLE ROW LEVEL SECURITY;

ALTER TABLE public."content_reviews" FORCE ROW LEVEL SECURITY;

CREATE TABLE IF NOT EXISTS public."curricula" (
 "id" uuid NOT NULL DEFAULT gen_random_uuid(),
 "academic_year_id" uuid NOT NULL,
 "grade_id" uuid NOT NULL,
 "subject_id" uuid NOT NULL,
 "name" text NOT NULL,
 "version" text NOT NULL DEFAULT '1.0'::text,
 "status" text NOT NULL DEFAULT 'draft'::text,
 "published_at" timestamptz,
 "created_by" uuid,
 "created_at" timestamptz NOT NULL DEFAULT now(),
 "updated_at" timestamptz NOT NULL DEFAULT now(),
 PRIMARY KEY (id)
);

ALTER TABLE public."curricula" ENABLE ROW LEVEL SECURITY;

ALTER TABLE public."curricula" FORCE ROW LEVEL SECURITY;

CREATE TABLE IF NOT EXISTS public."daily_journal_entries" (
 "id" uuid NOT NULL DEFAULT gen_random_uuid(),
 "journal_id" uuid NOT NULL,
 "lesson_id" uuid,
 "start_time" time without time zone NOT NULL,
 "end_time" time without time zone NOT NULL,
 "subject_name" text NOT NULL,
 "domain_name" text,
 "lesson_title" text NOT NULL,
 "entry_type" text NOT NULL DEFAULT 'normal'::text,
 "notes" text,
 "order_index" integer NOT NULL DEFAULT 0,
 "created_at" timestamptz NOT NULL DEFAULT now(),
 "updated_at" timestamptz NOT NULL DEFAULT now(),
 PRIMARY KEY (id)
);

ALTER TABLE public."daily_journal_entries" ENABLE ROW LEVEL SECURITY;

ALTER TABLE public."daily_journal_entries" FORCE ROW LEVEL SECURITY;

CREATE TABLE IF NOT EXISTS public."daily_journals" (
 "id" uuid NOT NULL DEFAULT gen_random_uuid(),
 "teacher_context_id" uuid NOT NULL,
 "journal_date" date NOT NULL,
 "status" text NOT NULL DEFAULT 'draft'::text,
 "teacher_note" text,
 "created_at" timestamptz NOT NULL DEFAULT now(),
 "updated_at" timestamptz NOT NULL DEFAULT now(),
 PRIMARY KEY (id)
);

ALTER TABLE public."daily_journals" ENABLE ROW LEVEL SECURITY;

ALTER TABLE public."daily_journals" FORCE ROW LEVEL SECURITY;

CREATE TABLE IF NOT EXISTS public."domains" (
 "id" uuid NOT NULL DEFAULT gen_random_uuid(),
 "subject_id" uuid NOT NULL,
 "code" text,
 "name_ar" text NOT NULL,
 "order_index" integer NOT NULL DEFAULT 0,
 "is_active" boolean NOT NULL DEFAULT true,
 "created_at" timestamptz NOT NULL DEFAULT now(),
 PRIMARY KEY (id)
);

ALTER TABLE public."domains" ENABLE ROW LEVEL SECURITY;

ALTER TABLE public."domains" FORCE ROW LEVEL SECURITY;

CREATE TABLE IF NOT EXISTS public."grades" (
 "id" uuid NOT NULL DEFAULT gen_random_uuid(),
 "code" text NOT NULL,
 "name_ar" text NOT NULL,
 "order_index" integer NOT NULL,
 "is_active" boolean NOT NULL DEFAULT true,
 "created_at" timestamptz NOT NULL DEFAULT now(),
 PRIMARY KEY (id)
);

ALTER TABLE public."grades" ENABLE ROW LEVEL SECURITY;

ALTER TABLE public."grades" FORCE ROW LEVEL SECURITY;

CREATE TABLE IF NOT EXISTS public."lesson_activities" (
 "id" uuid NOT NULL DEFAULT gen_random_uuid(),
 "lesson_id" uuid NOT NULL,
 "title" text NOT NULL,
 "instructions" text,
 "content" text,
 "activity_type" text,
 "answer_key" text,
 "difficulty" text,
 "is_printable" boolean NOT NULL DEFAULT true,
 "order_index" integer NOT NULL,
 "created_at" timestamptz NOT NULL DEFAULT now(),
 "updated_at" timestamptz NOT NULL DEFAULT now(),
 PRIMARY KEY (id)
);

ALTER TABLE public."lesson_activities" ENABLE ROW LEVEL SECURITY;

ALTER TABLE public."lesson_activities" FORCE ROW LEVEL SECURITY;

CREATE TABLE IF NOT EXISTS public."lesson_plan_stages" (
 "id" uuid NOT NULL DEFAULT gen_random_uuid(),
 "lesson_plan_id" uuid NOT NULL,
 "title" text NOT NULL,
 "duration_minutes" integer,
 "teacher_actions" text,
 "learner_actions" text,
 "instructions" text,
 "assessment_notes" text,
 "order_index" integer NOT NULL,
 "created_at" timestamptz NOT NULL DEFAULT now(),
 "updated_at" timestamptz NOT NULL DEFAULT now(),
 PRIMARY KEY (id)
);

ALTER TABLE public."lesson_plan_stages" ENABLE ROW LEVEL SECURITY;

ALTER TABLE public."lesson_plan_stages" FORCE ROW LEVEL SECURITY;

CREATE TABLE IF NOT EXISTS public."lesson_plans" (
 "id" uuid NOT NULL DEFAULT gen_random_uuid(),
 "lesson_id" uuid NOT NULL,
 "terminal_competency" text,
 "competency_component" text,
 "performance_indicators" text,
 "learning_objectives" text,
 "teaching_materials" text,
 "version" text NOT NULL DEFAULT '1.0'::text,
 "status" text NOT NULL DEFAULT 'draft'::text,
 "published_at" timestamptz,
 "created_by" uuid,
 "created_at" timestamptz NOT NULL DEFAULT now(),
 "updated_at" timestamptz NOT NULL DEFAULT now(),
 PRIMARY KEY (id)
);

ALTER TABLE public."lesson_plans" ENABLE ROW LEVEL SECURITY;

ALTER TABLE public."lesson_plans" FORCE ROW LEVEL SECURITY;

CREATE TABLE IF NOT EXISTS public."lesson_resources" (
 "lesson_id" uuid NOT NULL,
 "resource_id" uuid NOT NULL,
 "category" text,
 "order_index" integer NOT NULL DEFAULT 0,
 "is_featured" boolean NOT NULL DEFAULT false,
 "created_at" timestamptz NOT NULL DEFAULT now(),
 PRIMARY KEY (lesson_id, resource_id)
);

ALTER TABLE public."lesson_resources" ENABLE ROW LEVEL SECURITY;

ALTER TABLE public."lesson_resources" FORCE ROW LEVEL SECURITY;

CREATE TABLE IF NOT EXISTS public."lesson_texts" (
 "id" uuid NOT NULL DEFAULT gen_random_uuid(),
 "lesson_id" uuid NOT NULL,
 "title" text,
 "body" text NOT NULL,
 "vocabulary_notes" text,
 "teacher_notes" text,
 "source_text" text,
 "order_index" integer NOT NULL DEFAULT 0,
 "created_at" timestamptz NOT NULL DEFAULT now(),
 "updated_at" timestamptz NOT NULL DEFAULT now(),
 PRIMARY KEY (id)
);

ALTER TABLE public."lesson_texts" ENABLE ROW LEVEL SECURITY;

ALTER TABLE public."lesson_texts" FORCE ROW LEVEL SECURITY;

CREATE TABLE IF NOT EXISTS public."lessons" (
 "id" uuid NOT NULL DEFAULT gen_random_uuid(),
 "week_id" uuid NOT NULL,
 "domain_id" uuid,
 "title" text NOT NULL,
 "lesson_number" integer NOT NULL,
 "duration_minutes" integer NOT NULL DEFAULT 45,
 "order_index" integer NOT NULL,
 "status" text NOT NULL DEFAULT 'draft'::text,
 "created_by" uuid,
 "published_at" timestamptz,
 "created_at" timestamptz NOT NULL DEFAULT now(),
 "updated_at" timestamptz NOT NULL DEFAULT now(),
 PRIMARY KEY (id)
);

ALTER TABLE public."lessons" ENABLE ROW LEVEL SECURITY;

ALTER TABLE public."lessons" FORCE ROW LEVEL SECURITY;

CREATE TABLE IF NOT EXISTS public."library_items" (
 "id" uuid NOT NULL DEFAULT gen_random_uuid(),
 "teacher_context_id" uuid NOT NULL,
 "resource_id" uuid,
 "lesson_id" uuid,
 "item_type" text NOT NULL,
 "created_at" timestamptz NOT NULL DEFAULT now(),
 PRIMARY KEY (id)
);

ALTER TABLE public."library_items" ENABLE ROW LEVEL SECURITY;

ALTER TABLE public."library_items" FORCE ROW LEVEL SECURITY;

CREATE TABLE IF NOT EXISTS public."profiles" (
 "id" uuid NOT NULL,
 "full_name" text,
 "display_name" text,
 "email" text,
 "province" text,
 "school_name" text,
 "role" text NOT NULL DEFAULT 'teacher'::text,
 "avatar_url" text,
 "created_at" timestamptz NOT NULL DEFAULT now(),
 "updated_at" timestamptz NOT NULL DEFAULT now(),
 PRIMARY KEY (id)
);

ALTER TABLE public."profiles" ENABLE ROW LEVEL SECURITY;

ALTER TABLE public."profiles" FORCE ROW LEVEL SECURITY;

CREATE TABLE IF NOT EXISTS public."remediation_activities" (
 "id" uuid NOT NULL DEFAULT gen_random_uuid(),
 "lesson_id" uuid NOT NULL,
 "title" text NOT NULL,
 "target_skill" text,
 "instructions" text,
 "content" text,
 "difficulty" text,
 "answer_key" text,
 "order_index" integer NOT NULL DEFAULT 0,
 "created_at" timestamptz NOT NULL DEFAULT now(),
 "updated_at" timestamptz NOT NULL DEFAULT now(),
 PRIMARY KEY (id)
);

ALTER TABLE public."remediation_activities" ENABLE ROW LEVEL SECURITY;

ALTER TABLE public."remediation_activities" FORCE ROW LEVEL SECURITY;

CREATE TABLE IF NOT EXISTS public."resources" (
 "id" uuid NOT NULL DEFAULT gen_random_uuid(),
 "title" text NOT NULL,
 "description" text,
 "resource_type" text NOT NULL,
 "storage_bucket" text,
 "storage_path" text,
 "thumbnail_path" text,
 "mime_type" text,
 "file_size" bigint,
 "is_downloadable" boolean NOT NULL DEFAULT true,
 "is_printable" boolean NOT NULL DEFAULT true,
 "status" text NOT NULL DEFAULT 'draft'::text,
 "created_by" uuid,
 "published_at" timestamptz,
 "created_at" timestamptz NOT NULL DEFAULT now(),
 "updated_at" timestamptz NOT NULL DEFAULT now(),
 "external_source" text,
 "external_file_id" text,
 "external_url" text,
 "curriculum_grade_code" text,
 "curriculum_subject_code" text,
 "sequence_number" integer,
 "lesson_number" integer,
 "educational_category" text,
 "source_verified" boolean NOT NULL DEFAULT false,
 PRIMARY KEY (id)
);

ALTER TABLE public."resources" ENABLE ROW LEVEL SECURITY;

ALTER TABLE public."resources" FORCE ROW LEVEL SECURITY;

CREATE TABLE IF NOT EXISTS public."subjects" (
 "id" uuid NOT NULL DEFAULT gen_random_uuid(),
 "code" text NOT NULL,
 "name_ar" text NOT NULL,
 "name_fr" text,
 "name_en" text,
 "is_active" boolean NOT NULL DEFAULT true,
 "created_at" timestamptz NOT NULL DEFAULT now(),
 PRIMARY KEY (id)
);

ALTER TABLE public."subjects" ENABLE ROW LEVEL SECURITY;

ALTER TABLE public."subjects" FORCE ROW LEVEL SECURITY;

CREATE TABLE IF NOT EXISTS public."teacher_academic_contexts" (
 "id" uuid NOT NULL DEFAULT gen_random_uuid(),
 "user_id" uuid NOT NULL,
 "curriculum_id" uuid NOT NULL,
 "class_name" text,
 "is_current" boolean NOT NULL DEFAULT true,
 "created_at" timestamptz NOT NULL DEFAULT now(),
 "updated_at" timestamptz NOT NULL DEFAULT now(),
 "onboarding_completed_at" timestamptz,
 PRIMARY KEY (id)
);

ALTER TABLE public."teacher_academic_contexts" ENABLE ROW LEVEL SECURITY;

ALTER TABLE public."teacher_academic_contexts" FORCE ROW LEVEL SECURITY;

CREATE TABLE IF NOT EXISTS public."teacher_class_pupils" (
 "id" uuid NOT NULL DEFAULT gen_random_uuid(),
 "teacher_context_id" uuid NOT NULL,
 "order_index" smallint NOT NULL,
 "full_name" text NOT NULL,
 "observations" text,
 "created_at" timestamptz NOT NULL DEFAULT now(),
 PRIMARY KEY (id)
);

ALTER TABLE public."teacher_class_pupils" ENABLE ROW LEVEL SECURITY;

ALTER TABLE public."teacher_class_pupils" FORCE ROW LEVEL SECURITY;

CREATE TABLE IF NOT EXISTS public."teacher_lesson_customizations" (
 "id" uuid NOT NULL DEFAULT gen_random_uuid(),
 "teacher_context_id" uuid NOT NULL,
 "lesson_id" uuid NOT NULL,
 "custom_title" text,
 "custom_objectives" text,
 "custom_materials" text,
 "custom_data" jsonb NOT NULL DEFAULT '{}'::jsonb,
 "created_at" timestamptz NOT NULL DEFAULT now(),
 "updated_at" timestamptz NOT NULL DEFAULT now(),
 PRIMARY KEY (id)
);

ALTER TABLE public."teacher_lesson_customizations" ENABLE ROW LEVEL SECURITY;

ALTER TABLE public."teacher_lesson_customizations" FORCE ROW LEVEL SECURITY;

CREATE TABLE IF NOT EXISTS public."teacher_lesson_progress" (
 "id" uuid NOT NULL DEFAULT gen_random_uuid(),
 "teacher_context_id" uuid NOT NULL,
 "lesson_id" uuid NOT NULL,
 "status" text NOT NULL DEFAULT 'not_started'::text,
 "started_at" timestamptz,
 "completed_at" timestamptz,
 "completion_percent" smallint NOT NULL DEFAULT 0,
 "stopped_stage_id" uuid,
 "teacher_notes" text,
 "created_at" timestamptz NOT NULL DEFAULT now(),
 "updated_at" timestamptz NOT NULL DEFAULT now(),
 PRIMARY KEY (id)
);

ALTER TABLE public."teacher_lesson_progress" ENABLE ROW LEVEL SECURITY;

ALTER TABLE public."teacher_lesson_progress" FORCE ROW LEVEL SECURITY;

CREATE TABLE IF NOT EXISTS public."teacher_professional_cards" (
 "user_id" uuid NOT NULL,
 "teacher_name" text,
 "directorate" text,
 "school_name" text,
 "academic_qualification" text,
 "professional_qualification" text,
 "appointment_date" date,
 "first_employment_date" date,
 "promotion_notes" text,
 "inspector_visit_notes" text,
 "updated_at" timestamptz NOT NULL DEFAULT now(),
 PRIMARY KEY (user_id)
);

ALTER TABLE public."teacher_professional_cards" ENABLE ROW LEVEL SECURITY;

ALTER TABLE public."teacher_professional_cards" FORCE ROW LEVEL SECURITY;

CREATE TABLE IF NOT EXISTS public."teacher_register_records" (
 "id" uuid NOT NULL DEFAULT gen_random_uuid(),
 "teacher_context_id" uuid NOT NULL,
 "record_type" text NOT NULL,
 "event_date" date,
 "title" text NOT NULL,
 "place" text,
 "notes" text,
 "created_at" timestamptz NOT NULL DEFAULT now(),
 PRIMARY KEY (id)
);

ALTER TABLE public."teacher_register_records" ENABLE ROW LEVEL SECURITY;

ALTER TABLE public."teacher_register_records" FORCE ROW LEVEL SECURITY;

CREATE TABLE IF NOT EXISTS public."teacher_timetables" (
 "id" uuid NOT NULL DEFAULT gen_random_uuid(),
 "teacher_context_id" uuid NOT NULL,
 "name" text NOT NULL DEFAULT 'الجدول الأسبوعي'::text,
 "is_active" boolean NOT NULL DEFAULT true,
 "created_at" timestamptz NOT NULL DEFAULT now(),
 "updated_at" timestamptz NOT NULL DEFAULT now(),
 PRIMARY KEY (id)
);

ALTER TABLE public."teacher_timetables" ENABLE ROW LEVEL SECURITY;

ALTER TABLE public."teacher_timetables" FORCE ROW LEVEL SECURITY;

CREATE TABLE IF NOT EXISTS public."timetable_slots" (
 "id" uuid NOT NULL DEFAULT gen_random_uuid(),
 "timetable_id" uuid NOT NULL,
 "day_of_week" smallint NOT NULL,
 "start_time" time without time zone NOT NULL,
 "end_time" time without time zone NOT NULL,
 "order_index" integer NOT NULL DEFAULT 0,
 "note" text,
 "created_at" timestamptz NOT NULL DEFAULT now(),
 "updated_at" timestamptz NOT NULL DEFAULT now(),
 PRIMARY KEY (id)
);

ALTER TABLE public."timetable_slots" ENABLE ROW LEVEL SECURITY;

ALTER TABLE public."timetable_slots" FORCE ROW LEVEL SECURITY;

CREATE TABLE IF NOT EXISTS public."units" (
 "id" uuid NOT NULL DEFAULT gen_random_uuid(),
 "curriculum_id" uuid NOT NULL,
 "number" integer NOT NULL,
 "title" text NOT NULL,
 "description" text,
 "order_index" integer NOT NULL,
 "status" text NOT NULL DEFAULT 'draft'::text,
 "created_at" timestamptz NOT NULL DEFAULT now(),
 "updated_at" timestamptz NOT NULL DEFAULT now(),
 PRIMARY KEY (id)
);

ALTER TABLE public."units" ENABLE ROW LEVEL SECURITY;

ALTER TABLE public."units" FORCE ROW LEVEL SECURITY;

CREATE TABLE IF NOT EXISTS public."weeks" (
 "id" uuid NOT NULL DEFAULT gen_random_uuid(),
 "unit_id" uuid NOT NULL,
 "number" integer NOT NULL,
 "title" text,
 "order_index" integer NOT NULL,
 "status" text NOT NULL DEFAULT 'draft'::text,
 "created_at" timestamptz NOT NULL DEFAULT now(),
 "updated_at" timestamptz NOT NULL DEFAULT now(),
 PRIMARY KEY (id)
);

ALTER TABLE public."weeks" ENABLE ROW LEVEL SECURITY;

ALTER TABLE public."weeks" FORCE ROW LEVEL SECURITY;

ALTER TABLE public."academic_years" ADD CONSTRAINT "academic_year_dates" CHECK ((ends_on > starts_on));

ALTER TABLE public."academic_years" ADD CONSTRAINT "academic_years_name_key" UNIQUE (name);

ALTER TABLE public."assessments" ADD CONSTRAINT "assessments_lesson_id_fkey" FOREIGN KEY (lesson_id) REFERENCES lessons(id) ON DELETE CASCADE;

ALTER TABLE public."assessments" ADD CONSTRAINT "assessments_lesson_id_order_index_key" UNIQUE (lesson_id, order_index);

ALTER TABLE public."content_reviews" ADD CONSTRAINT "content_reviews_content_type_check" CHECK ((content_type = ANY (ARRAY['lesson'::text, 'lesson_plan'::text, 'resource'::text, 'activity'::text, 'assessment'::text, 'remediation'::text])));

ALTER TABLE public."content_reviews" ADD CONSTRAINT "content_reviews_status_check" CHECK ((status = ANY (ARRAY['pending'::text, 'approved'::text, 'changes_requested'::text])));

ALTER TABLE public."content_reviews" ADD CONSTRAINT "content_reviews_reviewer_id_fkey" FOREIGN KEY (reviewer_id) REFERENCES profiles(id) ON DELETE SET NULL;

ALTER TABLE public."content_reviews" ADD CONSTRAINT "content_reviews_submitted_by_fkey" FOREIGN KEY (submitted_by) REFERENCES profiles(id) ON DELETE SET NULL;

ALTER TABLE public."curricula" ADD CONSTRAINT "curricula_status_check" CHECK ((status = ANY (ARRAY['draft'::text, 'in_review'::text, 'approved'::text, 'published'::text, 'archived'::text])));

ALTER TABLE public."curricula" ADD CONSTRAINT "curricula_academic_year_id_fkey" FOREIGN KEY (academic_year_id) REFERENCES academic_years(id) ON DELETE RESTRICT;

ALTER TABLE public."curricula" ADD CONSTRAINT "curricula_created_by_fkey" FOREIGN KEY (created_by) REFERENCES profiles(id) ON DELETE SET NULL;

ALTER TABLE public."curricula" ADD CONSTRAINT "curricula_grade_id_fkey" FOREIGN KEY (grade_id) REFERENCES grades(id) ON DELETE RESTRICT;

ALTER TABLE public."curricula" ADD CONSTRAINT "curricula_subject_id_fkey" FOREIGN KEY (subject_id) REFERENCES subjects(id) ON DELETE RESTRICT;

ALTER TABLE public."curricula" ADD CONSTRAINT "curricula_academic_year_id_grade_id_subject_id_version_key" UNIQUE (academic_year_id, grade_id, subject_id, version);

ALTER TABLE public."daily_journal_entries" ADD CONSTRAINT "daily_journal_entries_entry_type_check" CHECK ((entry_type = ANY (ARRAY['normal'::text, 'manual'::text, 'break'::text])));

ALTER TABLE public."daily_journal_entries" ADD CONSTRAINT "journal_entry_time_check" CHECK ((end_time > start_time));

ALTER TABLE public."daily_journal_entries" ADD CONSTRAINT "daily_journal_entries_journal_id_fkey" FOREIGN KEY (journal_id) REFERENCES daily_journals(id) ON DELETE CASCADE;

ALTER TABLE public."daily_journal_entries" ADD CONSTRAINT "daily_journal_entries_lesson_id_fkey" FOREIGN KEY (lesson_id) REFERENCES lessons(id) ON DELETE SET NULL;

ALTER TABLE public."daily_journals" ADD CONSTRAINT "daily_journals_status_check" CHECK ((status = ANY (ARRAY['draft'::text, 'finalized'::text])));

ALTER TABLE public."daily_journals" ADD CONSTRAINT "daily_journals_teacher_context_id_fkey" FOREIGN KEY (teacher_context_id) REFERENCES teacher_academic_contexts(id) ON DELETE CASCADE;

ALTER TABLE public."daily_journals" ADD CONSTRAINT "daily_journals_teacher_context_id_journal_date_key" UNIQUE (teacher_context_id, journal_date);

ALTER TABLE public."domains" ADD CONSTRAINT "domains_subject_id_fkey" FOREIGN KEY (subject_id) REFERENCES subjects(id) ON DELETE CASCADE;

ALTER TABLE public."domains" ADD CONSTRAINT "domains_subject_id_name_ar_key" UNIQUE (subject_id, name_ar);

ALTER TABLE public."grades" ADD CONSTRAINT "grades_code_key" UNIQUE (code);

ALTER TABLE public."lesson_activities" ADD CONSTRAINT "lesson_activities_difficulty_check" CHECK (((difficulty IS NULL) OR (difficulty = ANY (ARRAY['easy'::text, 'medium'::text, 'advanced'::text]))));

ALTER TABLE public."lesson_activities" ADD CONSTRAINT "lesson_activities_lesson_id_fkey" FOREIGN KEY (lesson_id) REFERENCES lessons(id) ON DELETE CASCADE;

ALTER TABLE public."lesson_activities" ADD CONSTRAINT "lesson_activities_lesson_id_order_index_key" UNIQUE (lesson_id, order_index);

ALTER TABLE public."lesson_plan_stages" ADD CONSTRAINT "lesson_plan_stages_duration_minutes_check" CHECK (((duration_minutes IS NULL) OR (duration_minutes >= 0)));

ALTER TABLE public."lesson_plan_stages" ADD CONSTRAINT "lesson_plan_stages_lesson_plan_id_fkey" FOREIGN KEY (lesson_plan_id) REFERENCES lesson_plans(id) ON DELETE CASCADE;

ALTER TABLE public."lesson_plan_stages" ADD CONSTRAINT "lesson_plan_stages_lesson_plan_id_order_index_key" UNIQUE (lesson_plan_id, order_index);

ALTER TABLE public."lesson_plans" ADD CONSTRAINT "lesson_plans_status_check" CHECK ((status = ANY (ARRAY['draft'::text, 'in_review'::text, 'approved'::text, 'published'::text, 'archived'::text])));

ALTER TABLE public."lesson_plans" ADD CONSTRAINT "lesson_plans_created_by_fkey" FOREIGN KEY (created_by) REFERENCES profiles(id) ON DELETE SET NULL;

ALTER TABLE public."lesson_plans" ADD CONSTRAINT "lesson_plans_lesson_id_fkey" FOREIGN KEY (lesson_id) REFERENCES lessons(id) ON DELETE CASCADE;

ALTER TABLE public."lesson_plans" ADD CONSTRAINT "lesson_plans_lesson_id_key" UNIQUE (lesson_id);

ALTER TABLE public."lesson_resources" ADD CONSTRAINT "lesson_resources_lesson_id_fkey" FOREIGN KEY (lesson_id) REFERENCES lessons(id) ON DELETE CASCADE;

ALTER TABLE public."lesson_resources" ADD CONSTRAINT "lesson_resources_resource_id_fkey" FOREIGN KEY (resource_id) REFERENCES resources(id) ON DELETE CASCADE;

ALTER TABLE public."lesson_texts" ADD CONSTRAINT "lesson_texts_lesson_id_fkey" FOREIGN KEY (lesson_id) REFERENCES lessons(id) ON DELETE CASCADE;

ALTER TABLE public."lesson_texts" ADD CONSTRAINT "lesson_texts_lesson_id_order_index_key" UNIQUE (lesson_id, order_index);

ALTER TABLE public."lessons" ADD CONSTRAINT "lessons_duration_minutes_check" CHECK ((duration_minutes > 0));

ALTER TABLE public."lessons" ADD CONSTRAINT "lessons_status_check" CHECK ((status = ANY (ARRAY['draft'::text, 'in_review'::text, 'approved'::text, 'published'::text, 'archived'::text])));

ALTER TABLE public."lessons" ADD CONSTRAINT "lessons_created_by_fkey" FOREIGN KEY (created_by) REFERENCES profiles(id) ON DELETE SET NULL;

ALTER TABLE public."lessons" ADD CONSTRAINT "lessons_domain_id_fkey" FOREIGN KEY (domain_id) REFERENCES domains(id) ON DELETE SET NULL;

ALTER TABLE public."lessons" ADD CONSTRAINT "lessons_week_id_fkey" FOREIGN KEY (week_id) REFERENCES weeks(id) ON DELETE CASCADE;

ALTER TABLE public."lessons" ADD CONSTRAINT "lessons_week_id_lesson_number_key" UNIQUE (week_id, lesson_number);

ALTER TABLE public."lessons" ADD CONSTRAINT "lessons_week_id_order_index_key" UNIQUE (week_id, order_index);

ALTER TABLE public."library_items" ADD CONSTRAINT "library_item_target_check" CHECK ((((item_type = 'resource'::text) AND (resource_id IS NOT NULL) AND (lesson_id IS NULL)) OR ((item_type = 'lesson'::text) AND (lesson_id IS NOT NULL) AND (resource_id IS NULL))));

ALTER TABLE public."library_items" ADD CONSTRAINT "library_items_item_type_check" CHECK ((item_type = ANY (ARRAY['resource'::text, 'lesson'::text])));

ALTER TABLE public."library_items" ADD CONSTRAINT "library_items_lesson_id_fkey" FOREIGN KEY (lesson_id) REFERENCES lessons(id) ON DELETE CASCADE;

ALTER TABLE public."library_items" ADD CONSTRAINT "library_items_resource_id_fkey" FOREIGN KEY (resource_id) REFERENCES resources(id) ON DELETE CASCADE;

ALTER TABLE public."library_items" ADD CONSTRAINT "library_items_teacher_context_id_fkey" FOREIGN KEY (teacher_context_id) REFERENCES teacher_academic_contexts(id) ON DELETE CASCADE;

ALTER TABLE public."profiles" ADD CONSTRAINT "profiles_role_check" CHECK ((role = ANY (ARRAY['teacher'::text, 'editor'::text, 'reviewer'::text, 'content_manager'::text, 'admin'::text])));

ALTER TABLE public."profiles" ADD CONSTRAINT "profiles_email_key" UNIQUE (email);

ALTER TABLE public."remediation_activities" ADD CONSTRAINT "remediation_activities_difficulty_check" CHECK (((difficulty IS NULL) OR (difficulty = ANY (ARRAY['easy'::text, 'medium'::text, 'advanced'::text]))));

ALTER TABLE public."remediation_activities" ADD CONSTRAINT "remediation_activities_lesson_id_fkey" FOREIGN KEY (lesson_id) REFERENCES lessons(id) ON DELETE CASCADE;

ALTER TABLE public."remediation_activities" ADD CONSTRAINT "remediation_activities_lesson_id_order_index_key" UNIQUE (lesson_id, order_index);

ALTER TABLE public."resources" ADD CONSTRAINT "resources_external_publication_review_check" CHECK (((external_source IS NULL) OR (status <> 'published'::text) OR (source_verified = true)));

ALTER TABLE public."resources" ADD CONSTRAINT "resources_file_location_check" CHECK ((((storage_bucket IS NOT NULL) AND (storage_path IS NOT NULL)) OR ((external_url IS NOT NULL) AND (external_url ~ '^https://'::text))));

ALTER TABLE public."resources" ADD CONSTRAINT "resources_file_size_check" CHECK (((file_size IS NULL) OR (file_size >= 0)));

ALTER TABLE public."resources" ADD CONSTRAINT "resources_resource_type_check" CHECK ((resource_type = ANY (ARRAY['pdf'::text, 'image'::text, 'worksheet'::text, 'flashcard'::text, 'poster'::text, 'audio'::text, 'document'::text, 'other'::text])));

ALTER TABLE public."resources" ADD CONSTRAINT "resources_status_check" CHECK ((status = ANY (ARRAY['draft'::text, 'in_review'::text, 'approved'::text, 'published'::text, 'archived'::text])));

ALTER TABLE public."resources" ADD CONSTRAINT "resources_created_by_fkey" FOREIGN KEY (created_by) REFERENCES profiles(id) ON DELETE SET NULL;

ALTER TABLE public."resources" ADD CONSTRAINT "resources_storage_bucket_storage_path_key" UNIQUE (storage_bucket, storage_path);

ALTER TABLE public."subjects" ADD CONSTRAINT "subjects_code_key" UNIQUE (code);

ALTER TABLE public."teacher_academic_contexts" ADD CONSTRAINT "teacher_academic_contexts_curriculum_id_fkey" FOREIGN KEY (curriculum_id) REFERENCES curricula(id) ON DELETE RESTRICT;

ALTER TABLE public."teacher_academic_contexts" ADD CONSTRAINT "teacher_academic_contexts_user_id_fkey" FOREIGN KEY (user_id) REFERENCES profiles(id) ON DELETE CASCADE;

ALTER TABLE public."teacher_academic_contexts" ADD CONSTRAINT "teacher_academic_contexts_user_id_curriculum_id_class_name_key" UNIQUE (user_id, curriculum_id, class_name);

ALTER TABLE public."teacher_class_pupils" ADD CONSTRAINT "teacher_class_pupils_full_name_check" CHECK (((char_length(full_name) >= 1) AND (char_length(full_name) <= 140)));

ALTER TABLE public."teacher_class_pupils" ADD CONSTRAINT "teacher_class_pupils_observations_check" CHECK ((char_length(observations) <= 1200));

ALTER TABLE public."teacher_class_pupils" ADD CONSTRAINT "teacher_class_pupils_order_index_check" CHECK (((order_index >= 1) AND (order_index <= 99)));

ALTER TABLE public."teacher_class_pupils" ADD CONSTRAINT "teacher_class_pupils_teacher_context_id_fkey" FOREIGN KEY (teacher_context_id) REFERENCES teacher_academic_contexts(id) ON DELETE CASCADE;

ALTER TABLE public."teacher_class_pupils" ADD CONSTRAINT "teacher_class_pupils_teacher_context_id_order_index_key" UNIQUE (teacher_context_id, order_index);

ALTER TABLE public."teacher_lesson_customizations" ADD CONSTRAINT "teacher_lesson_customizations_lesson_id_fkey" FOREIGN KEY (lesson_id) REFERENCES lessons(id) ON DELETE CASCADE;

ALTER TABLE public."teacher_lesson_customizations" ADD CONSTRAINT "teacher_lesson_customizations_teacher_context_id_fkey" FOREIGN KEY (teacher_context_id) REFERENCES teacher_academic_contexts(id) ON DELETE CASCADE;

ALTER TABLE public."teacher_lesson_customizations" ADD CONSTRAINT "teacher_lesson_customizations_teacher_context_id_lesson_id_key" UNIQUE (teacher_context_id, lesson_id);

ALTER TABLE public."teacher_lesson_progress" ADD CONSTRAINT "teacher_lesson_progress_completion_percent_check" CHECK (((completion_percent >= 0) AND (completion_percent <= 100)));

ALTER TABLE public."teacher_lesson_progress" ADD CONSTRAINT "teacher_lesson_progress_status_check" CHECK ((status = ANY (ARRAY['not_started'::text, 'in_progress'::text, 'completed'::text, 'partial'::text, 'postponed'::text, 'skipped'::text])));

ALTER TABLE public."teacher_lesson_progress" ADD CONSTRAINT "teacher_lesson_progress_lesson_id_fkey" FOREIGN KEY (lesson_id) REFERENCES lessons(id) ON DELETE CASCADE;

ALTER TABLE public."teacher_lesson_progress" ADD CONSTRAINT "teacher_lesson_progress_stopped_stage_id_fkey" FOREIGN KEY (stopped_stage_id) REFERENCES lesson_plan_stages(id) ON DELETE SET NULL;

ALTER TABLE public."teacher_lesson_progress" ADD CONSTRAINT "teacher_lesson_progress_teacher_context_id_fkey" FOREIGN KEY (teacher_context_id) REFERENCES teacher_academic_contexts(id) ON DELETE CASCADE;

ALTER TABLE public."teacher_lesson_progress" ADD CONSTRAINT "teacher_lesson_progress_teacher_context_id_lesson_id_key" UNIQUE (teacher_context_id, lesson_id);

ALTER TABLE public."teacher_professional_cards" ADD CONSTRAINT "professional_card_lengths" CHECK (((length(COALESCE(teacher_name, ''::text)) <= 120) AND (length(COALESCE(directorate, ''::text)) <= 150) AND (length(COALESCE(school_name, ''::text)) <= 180) AND (length(COALESCE(academic_qualification, ''::text)) <= 600) AND (length(COALESCE(professional_qualification, ''::text)) <= 600) AND (length(COALESCE(promotion_notes, ''::text)) <= 1500) AND (length(COALESCE(inspector_visit_notes, ''::text)) <= 1500)));

ALTER TABLE public."teacher_professional_cards" ADD CONSTRAINT "teacher_professional_cards_user_id_fkey" FOREIGN KEY (user_id) REFERENCES profiles(id) ON DELETE CASCADE;

ALTER TABLE public."teacher_register_records" ADD CONSTRAINT "teacher_register_records_notes_check" CHECK ((char_length(notes) <= 2000));

ALTER TABLE public."teacher_register_records" ADD CONSTRAINT "teacher_register_records_place_check" CHECK ((char_length(place) <= 180));

ALTER TABLE public."teacher_register_records" ADD CONSTRAINT "teacher_register_records_record_type_check" CHECK ((record_type = ANY (ARRAY['holiday'::text, 'occasion'::text, 'inspection'::text, 'training'::text, 'visit'::text])));

ALTER TABLE public."teacher_register_records" ADD CONSTRAINT "teacher_register_records_title_check" CHECK (((char_length(title) >= 1) AND (char_length(title) <= 180)));

ALTER TABLE public."teacher_register_records" ADD CONSTRAINT "teacher_register_records_teacher_context_id_fkey" FOREIGN KEY (teacher_context_id) REFERENCES teacher_academic_contexts(id) ON DELETE CASCADE;

ALTER TABLE public."teacher_timetables" ADD CONSTRAINT "teacher_timetables_teacher_context_id_fkey" FOREIGN KEY (teacher_context_id) REFERENCES teacher_academic_contexts(id) ON DELETE CASCADE;

ALTER TABLE public."timetable_slots" ADD CONSTRAINT "timetable_slot_time_check" CHECK ((end_time > start_time));

ALTER TABLE public."timetable_slots" ADD CONSTRAINT "timetable_slots_day_of_week_check" CHECK (((day_of_week >= 0) AND (day_of_week <= 6)));

ALTER TABLE public."timetable_slots" ADD CONSTRAINT "timetable_slots_timetable_id_fkey" FOREIGN KEY (timetable_id) REFERENCES teacher_timetables(id) ON DELETE CASCADE;

ALTER TABLE public."timetable_slots" ADD CONSTRAINT "timetable_slots_timetable_id_day_of_week_start_time_key" UNIQUE (timetable_id, day_of_week, start_time);

ALTER TABLE public."units" ADD CONSTRAINT "units_status_check" CHECK ((status = ANY (ARRAY['draft'::text, 'in_review'::text, 'approved'::text, 'published'::text, 'archived'::text])));

ALTER TABLE public."units" ADD CONSTRAINT "units_curriculum_id_fkey" FOREIGN KEY (curriculum_id) REFERENCES curricula(id) ON DELETE CASCADE;

ALTER TABLE public."units" ADD CONSTRAINT "units_curriculum_id_number_key" UNIQUE (curriculum_id, number);

ALTER TABLE public."units" ADD CONSTRAINT "units_curriculum_id_order_index_key" UNIQUE (curriculum_id, order_index);

ALTER TABLE public."weeks" ADD CONSTRAINT "weeks_status_check" CHECK ((status = ANY (ARRAY['draft'::text, 'in_review'::text, 'approved'::text, 'published'::text, 'archived'::text])));

ALTER TABLE public."weeks" ADD CONSTRAINT "weeks_unit_id_fkey" FOREIGN KEY (unit_id) REFERENCES units(id) ON DELETE CASCADE;

ALTER TABLE public."weeks" ADD CONSTRAINT "weeks_unit_id_number_key" UNIQUE (unit_id, number);

ALTER TABLE public."weeks" ADD CONSTRAINT "weeks_unit_id_order_index_key" UNIQUE (unit_id, order_index);

CREATE UNIQUE INDEX library_unique_resource_idx ON public.library_items USING btree (teacher_context_id, resource_id) WHERE (resource_id IS NOT NULL);

CREATE INDEX teacher_context_onboarding_idx ON public.teacher_academic_contexts USING btree (user_id, is_current, onboarding_completed_at);

CREATE INDEX resources_created_by_idx ON public.resources USING btree (created_by);

CREATE INDEX library_items_lesson_idx ON public.library_items USING btree (lesson_id) WHERE (lesson_id IS NOT NULL);

CREATE INDEX content_reviews_status_idx ON public.content_reviews USING btree (status, submitted_at);

CREATE INDEX resources_curriculum_locator_idx ON public.resources USING btree (curriculum_grade_code, curriculum_subject_code, sequence_number, lesson_number, status);

CREATE INDEX remediation_lesson_order_idx ON public.remediation_activities USING btree (lesson_id, order_index);

CREATE INDEX curricula_lookup_idx ON public.curricula USING btree (academic_year_id, grade_id, subject_id);

CREATE INDEX teacher_progress_stopped_stage_idx ON public.teacher_lesson_progress USING btree (stopped_stage_id) WHERE (stopped_stage_id IS NOT NULL);

CREATE UNIQUE INDEX library_unique_lesson_idx ON public.library_items USING btree (teacher_context_id, lesson_id) WHERE (lesson_id IS NOT NULL);

CREATE UNIQUE INDEX resources_external_source_file_idx ON public.resources USING btree (external_source, external_file_id) WHERE ((external_source IS NOT NULL) AND (external_file_id IS NOT NULL));

CREATE INDEX lesson_texts_lesson_order_idx ON public.lesson_texts USING btree (lesson_id, order_index);

CREATE INDEX assessments_lesson_order_idx ON public.assessments USING btree (lesson_id, order_index);

CREATE INDEX daily_journal_entries_journal_order_idx ON public.daily_journal_entries USING btree (journal_id, order_index);

CREATE INDEX lesson_plans_created_by_idx ON public.lesson_plans USING btree (created_by);

CREATE INDEX curricula_subject_idx ON public.curricula USING btree (subject_id);

CREATE UNIQUE INDEX academic_years_one_current_idx ON public.academic_years USING btree (is_current) WHERE (is_current = true);

CREATE UNIQUE INDEX teacher_timetable_one_active_idx ON public.teacher_timetables USING btree (teacher_context_id) WHERE (is_active = true);

CREATE INDEX content_reviews_submitted_by_idx ON public.content_reviews USING btree (submitted_by);

CREATE INDEX lessons_created_by_idx ON public.lessons USING btree (created_by);

CREATE INDEX lesson_activities_lesson_order_idx ON public.lesson_activities USING btree (lesson_id, order_index);

CREATE INDEX teacher_context_user_idx ON public.teacher_academic_contexts USING btree (user_id);

CREATE UNIQUE INDEX teacher_context_one_current_idx ON public.teacher_academic_contexts USING btree (user_id) WHERE (is_current = true);

CREATE INDEX timetable_slots_timetable_day_idx ON public.timetable_slots USING btree (timetable_id, day_of_week, order_index);

CREATE INDEX teacher_timetables_context_idx ON public.teacher_timetables USING btree (teacher_context_id);

CREATE INDEX resources_status_type_idx ON public.resources USING btree (status, resource_type);

CREATE INDEX lessons_week_order_idx ON public.lessons USING btree (week_id, order_index);

CREATE INDEX daily_journals_context_date_idx ON public.daily_journals USING btree (teacher_context_id, journal_date DESC);

CREATE INDEX units_curriculum_order_idx ON public.units USING btree (curriculum_id, order_index);

CREATE INDEX teacher_progress_lesson_idx ON public.teacher_lesson_progress USING btree (lesson_id);

CREATE INDEX lesson_resources_resource_idx ON public.lesson_resources USING btree (resource_id);

CREATE INDEX teacher_register_records_context_type_idx ON public.teacher_register_records USING btree (teacher_context_id, record_type, event_date);

CREATE INDEX library_context_idx ON public.library_items USING btree (teacher_context_id, created_at DESC);

CREATE INDEX lessons_domain_idx ON public.lessons USING btree (domain_id);

CREATE INDEX domains_subject_order_idx ON public.domains USING btree (subject_id, order_index);

CREATE INDEX teacher_customizations_lesson_idx ON public.teacher_lesson_customizations USING btree (lesson_id);

CREATE INDEX library_items_resource_idx ON public.library_items USING btree (resource_id) WHERE (resource_id IS NOT NULL);

CREATE INDEX curricula_created_by_idx ON public.curricula USING btree (created_by);

CREATE INDEX curricula_grade_idx ON public.curricula USING btree (grade_id);

CREATE INDEX content_reviews_reviewer_idx ON public.content_reviews USING btree (reviewer_id);

CREATE INDEX teacher_progress_context_status_idx ON public.teacher_lesson_progress USING btree (teacher_context_id, status);

CREATE INDEX lesson_plan_stages_plan_order_idx ON public.lesson_plan_stages USING btree (lesson_plan_id, order_index);

CREATE INDEX lesson_plans_lesson_idx ON public.lesson_plans USING btree (lesson_id);

CREATE INDEX teacher_context_curriculum_idx ON public.teacher_academic_contexts USING btree (curriculum_id);

CREATE INDEX daily_journal_entries_lesson_idx ON public.daily_journal_entries USING btree (lesson_id);

CREATE INDEX weeks_unit_order_idx ON public.weeks USING btree (unit_id, order_index);

COMMIT;
