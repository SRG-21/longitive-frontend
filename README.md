# Longevity Management System — Frontend

React 19 + Vite + Tailwind 4 client for [`longitive-backend`](https://github.com/SRG-21/longitive-backend).

## Getting started

```bash
npm install
cp .env.example .env   # VITE_API_URL defaults to http://localhost:3000/api/v1
npm run dev            # http://localhost:5173
```

`npm run build` type-checks and builds; `npm run lint` runs ESLint.

## Features

| Area | Route | Backend module |
| --- | --- | --- |
| Dashboard (health score, streak, latest measurements and labs) | `/` | analytics, sleep, exercise, progress |
| Daily checklist, streaks, weekly report, reminders | `/progress` | progress, reminders |
| Body composition (manual entry, OCR scan, trends) | `/body-composition` | body-composition |
| Lab reports (OCR/PDF upload, manual entry, verify, marker trends, comparison) | `/lab-reports` | lab-reports |
| Sleep & mood logs | `/sleep` | sleep |
| Exercise logs, stats, AI weekly plan | `/exercise` | exercise |
| Diet, supplement and hydration plans, daily schedule | `/nutrition` | health-chart |
| Medicine cabinet (stock, reorder and expiry alerts) | `/inventory` | inventory |
| AI chat, insights, biological age, what-if, first aid | `/ai/*` | ai |
| Profile, medical history, lifestyle, goals | `/profile` | user |
| Notification preferences, two-factor setup | `/settings` | notifications, auth |
| Journey trackers: start/proposed end date, targets, daily vs weekly fields, missed-day backfill, weekly check-ins, chart setup | `/journey-trackers` | journey-tracker |
| Login (with 2FA step), register, forgot / reset password | `/login` … | auth |

## Layout

- `src/hooks/` — TanStack Query hooks, one file per backend area (`useHealthData`, `usePlans`, `useAi`, `useProfile`, `useJourneyTracker`).
- `src/types/` — response shapes mirroring the backend Prisma schema.
- `src/components/ui/` — shared primitives (cards, fields, buttons, tabs, badges).
- `src/components/AiContent.tsx` — safe renderer for AI output (Markdown-ish text or JSON).
- `src/lib/date.ts` — calendar dates are stored as UTC midnight; format them with `formatDate`, not `toLocaleDateString`.
- Signed-in routes are lazy-loaded in `src/router.tsx`.

Large photos are compressed client-side before OCR upload (`src/lib/upload.ts`) to stay under serverless request-size limits.
