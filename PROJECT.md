# Miraj Ostadh — معراج الأستاذ

## Project Identity

- **Project Name:** Miraj Ostadh / معراج الأستاذ
- **Purpose:** منصة رقمية لأساتذة التعليم الابتدائي في الجزائر، تبدأ باللغة العربية للسنة الثالثة ابتدائي (3AP).
- **Repository:** `salempub1-dotcom/miraj-ostadh`
- **Default Branch:** `main`
- **Supabase Project Name:** `Miraj Ostadh`
- **Supabase Project Ref:** `ltcchvjxgdcdsvgrmtjb`
- **Supabase Region:** `eu-central-1` (Frankfurt)
- **Supabase Environment:** Development
- **Vercel Team:** `EL-miraj`
- **Vercel Team Slug:** `elmiraj1`
- **Vercel Team ID:** `team_IhCrW2DUZHDJHOxFDMIGVjL6`
- **Vercel Project Slug:** `miraj-ostadh`
- **Vercel Dashboard/Deployment Reference:** `https://vercel.com/elmiraj1/miraj-ostadh/6k2ZpPiHbnexiGbfUqQ7DqUbnvJo`
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

- Education stage: Primary school
- Initial grade: 3AP
- Initial subject: Arabic
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
- Grades
- Chat
- Marketplace
- Payments/subscriptions

## Security Rules

- Never commit `.env`, `.env.local`, database passwords, service-role keys, access tokens, or other secrets.
- Use `.env.example` only for variable names and placeholders.
- Enable and maintain Row Level Security for teacher-owned data.
- Official curriculum/content and teacher-private data must remain separated.

## Current Status

- GitHub repository initialized with Next.js/TypeScript project structure.
- Supabase identity verified: `Miraj Ostadh` / `ltcchvjxgdcdsvgrmtjb`.
- Database migrations 001–005 applied successfully.
- Core curriculum, lesson content, resources, teacher workspace, progress, library, and daily journal tables exist with RLS.
- Latest Supabase security advisor check: **0 security warnings**.
- Vercel project reference supplied for `elmiraj1/miraj-ostadh` and recorded here.
- Current Vercel connector session cannot enumerate this deployment yet (permission response), so deployment health is not being inferred from the dashboard URL alone.
