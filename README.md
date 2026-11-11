# TechNeeds IGDTUW: Reimagathon submission

Redesigned frontend, admin/mentor/mentee flow hardening, and an **AI-generated profile page**.

## Run locally
```bash
# 1. backend (port 8000)
cd backend
cp .env.example .env        # fill MONGO_URI, JWT_SECRET, ADMIN_EMAIL, ADMIN_PASSWORD (+ optional AI key)
npm install
node scripts/seed.js --reset   # optional demo data
node index.js

# 2. frontend (port 3000)
cd frontend
cp .env.local.example .env.local   # NEXT_PUBLIC_API_URL=http://localhost:8000
npm install
npm run dev
```

## Demo logins (after seeding)
| Role | Login |
|---|---|
| Admin | the `ADMIN_EMAIL` / `ADMIN_PASSWORD` from `.env` (page: `/admin`) |
| Mentor | `mentor@demo.com` / `Mentor@123` (page: `/mentor`) |
| Mentee | `DEMO001` ... `DEMO006` / `Demo@123` (page: `/mentee`). DEMO001 has the richest profile, DEMO006 is brand new |

## AI profile (`/profile`)
- **Endpoint:** `GET /api/profile/mentee` (also `GET /api/profile/mentor`, `PUT /api/profile/mentee/interests`).
- **Facts are computed by rules** from the database: points, rank, streak, quiz average, on-time rate, per-type completion. These drive the level, five skill scores (radar chart and avatar ring), badges and "up next" list.
- **The written summary** (headline, strengths, next steps) comes from an LLM when `ANTHROPIC_API_KEY` or `GEMINI_API_KEY` is set. The model only sees the computed facts. If there is no key, the call fails or times out (12 s), a rule-based writer produces the text, so the page never breaks.
- Results are cached on the mentee document and only regenerated when the underlying facts change (or on "Rewrite").
- **Avatar:** generated SVG (seeded gem plus initials, ring arcs = skill scores). No external service.

## Other changes
- Backend URL is one setting (`NEXT_PUBLIC_API_URL`), not hardcoded in 10 files. Fixed the `hhttps://` typo that broke project submission.
- Admin login (`POST /api/admin/login`) and admin-only program/mentor creation. Mentor password hashes are no longer returned by the API.
- Closed a scoring hole: `/resources/:id/complete` now accepts videos only, so quizzes and projects can't be self-completed for full marks.
- Mentor "verify project" used the wrong token key and never worked. Fixed.
- New design system (`app/globals.css`), role-aware navbar, home page, leaderboard (podium, live refresh), mentee dashboard, admin and mentor panels.
- The repo's committed `.env` (with someone's Mongo URI and JWT secret) was replaced with placeholders. `.env` is now git-ignored.
