# معراج الأستاذ — Miraj Ostadh

منصة رقمية متجاوبة مخصصة لأساتذة التعليم الابتدائي في الجزائر. يبدأ الإصدار الأول بالسنة الثالثة ابتدائي ومادة اللغة العربية.

## V1

- Arabic RTL responsive web app
- Teacher onboarding
- Today / يومي
- Planning & progress
- Prepare lesson
- Resources & personal library
- Daily journal + A4 print/PDF views
- Teacher account & timetable
- Admin content workflow

## Project safety

Before migrations, builds, deploys, or publishing, run:

```bash
npm run check-project
```

The expected project identity is documented in [`PROJECT.md`](./PROJECT.md).

## Local environment

Create `.env.local` from `.env.example` and fill the values locally. Never commit secrets.

## Current implementation status

- Project identity guard: added
- Git ignore / env template: added
- Next.js + TypeScript scaffold: started
- Arabic RTL responsive design system: added
- First `/today` dashboard: added
- Supabase database schema: pending identity verification before first migration
