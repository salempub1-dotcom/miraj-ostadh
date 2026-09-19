# Miraj Ostadh — معراج الأستاذ

## Project Identity

- **Project Name:** Miraj Ostadh / معراج الأستاذ
- **Purpose:** منصة رقمية لأساتذة التعليم الابتدائي في الجزائر، تبدأ باللغة العربية لجميع سنوات الابتدائي من 1AP إلى 5AP.
- **Repository:** `salempub1-dotcom/miraj-ostadh`
- **Default Branch:** `main`
- **Supabase Project Name:** `Miraj Ostadh`
- **Supabase Project Ref:** `ltcchvjxgdcdsvgrmtjb`
- **Supabase Region:** `eu-central-1` (Frankfurt)
- **Vercel Team:** `EL-miraj`
- **Vercel Team Slug:** `elmiraj1`
- **Vercel Team ID:** `team_IhCrW2DUZHDJHOxFDMIGVjL6`
- **Vercel Project Slug:** `miraj-ostadh`
- **Canonical Production URL:** `https://miraj-ostadh.vercel.app`
- **Git Branch URL:** `https://miraj-ostadh-git-main-elmiraj1.vercel.app`
- **Frontend:** Next.js + TypeScript
- **Backend:** Supabase (PostgreSQL, Auth, Storage, RLS)
- **Primary UI:** Arabic RTL, responsive web/PWA

## Strict Project Isolation

This project is completely independent from all other projects, including:

- Al Miraj / Al Miraj Education
- NadhafaDZ
- Any previous Supabase, Expo, Vercel, or GitHub project

Never reuse credentials, project refs, environment files, migrations, or configuration from another project.

Before any sensitive operation such as database migration, reset, deploy, build, publish, or production data change, verify all of the following:

1. GitHub repository is `salempub1-dotcom/miraj-ostadh`.
2. Supabase project ref is exactly `ltcchvjxgdcdsvgrmtjb`.
3. Vercel team is `EL-miraj` / `team_IhCrW2DUZHDJHOxFDMIGVjL6` when deploying.
4. Vercel project slug is exactly `miraj-ostadh`.
5. Environment is the intended environment.
6. No `.env` or secret file belongs to another project.

If any identity check fails, stop before making changes.

## V1 Scope

- Education stage: Algerian Primary School
- Grades: 1AP, 2AP, 3AP, 4AP, 5AP
- Initial subject: Arabic
- Arabic RTL interface
- Teacher authentication and onboarding
- Today / My Day
- Planning and progress tracking
- Prepare My Lesson
- Resources and My Library
- Daily Journal with A4/PDF print view
- Account, timetable, printing preferences
- Admin curriculum/content workflow

## Out of Scope for V1

- AI assistant
- Parents
- Students
- Attendance
- Grades/marks management
- Chat
- Marketplace
- Payments/subscriptions

## Security Rules

- Never commit `.env`, `.env.local`, database passwords, service-role keys, access tokens, or other secrets.
- Use `.env.example` only for variable names and placeholders.
- Enable and maintain Row Level Security for teacher-owned data.
- Official curriculum/content and teacher-private data must remain separated.
- Public Supabase URL/publishable key may be exposed to the browser; service-role/secret keys must never be public.

## Current Status

- GitHub repository initialized with Next.js/TypeScript project structure.
- Supabase identity verified before the latest migration: `Miraj Ostadh` / `ltcchvjxgdcdsvgrmtjb`.
- Database migrations **001–009** applied successfully.
- Seed/reference data exists for `2026–2027`, Arabic, 8 Arabic domains, and **five published primary Arabic curricula** for `1AP` through `5AP`.
- Core curriculum, lesson content, resources, teacher workspace, progress, library, and daily journal tables exist with RLS.
- Auth flow tested successfully: Register → Email confirmation → Login → Profile → Grade → Timetable → Progress → Complete → Today.
- The first real teacher account completed onboarding and reached `/today` successfully.
- `/today` V2 is implemented as an Arabic RTL dashboard with dynamic teacher/grade/subject/year data, timetable, next lesson logic, quick actions, curriculum progress, and lesson preparation preview.
- The teacher shell/sidebar and Account page are grade-aware instead of hardcoded to 3AP.
- Onboarding now supports choosing any grade from **1AP to 5AP**, with Arabic as the V1 subject.
- A first `/lessons/[lessonId]` preparation workspace scaffold exists with tabs for memo, text, resources, activities, assessment, and remediation.
- Current curriculum units/weeks/lessons are still empty; the next implementation stage is importing the official Arabic curriculum content for the five grades.
- Vercel deployment for the V2 interface build reported success.
- Supabase Security Advisor currently has one Auth-level warning: leaked-password protection is disabled; this does not block the application flow and can be enabled separately.
