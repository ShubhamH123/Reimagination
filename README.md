# TechNeeds — Reimagined

A redesign of the TechNeeds IGDTUW mentorship platform for the Reimagathon: a light, friendly, production-ready
frontend for the **Admin → Mentor → Mentee** flow, an **AI-generated profile page**, and backend hardening.

## Quick start

```bash
# 1 · Backend  (http://localhost:8000)
cd backend
cp .env.example .env        # add MONGO_URI, JWT_SECRET, ADMIN_EMAIL, ADMIN_PASSWORD
npm install
npm run seed                # optional: demo cohort, mentor and 8 mentees
npm run dev

# 2 · Frontend (http://localhost:3000)
cd frontend
cp .env.example .env.local  # NEXT_PUBLIC_API_URL defaults to http://localhost:8000
npm install
npm run dev
```

**No database handy?** Open the site and click **Explore the live demo** (or "Try the demo" on any login page).
Every screen runs on in-browser sample data, so the product can always be shown.

### Demo logins after `npm run seed`
| Role   | Login |
|--------|-------|
| Mentee | `TN2026001` / `demo123` (…up to `TN2026008`) |
| Mentor | `mentor@techneeds.dev` / `mentor123` |
| Admin  | `ADMIN_EMAIL` / `ADMIN_PASSWORD` from `backend/.env` |

## What's new

**Design system** (`frontend/src/styles/tn.css`): light theme, soft gradients, rounded cards, toasts instead of `alert()`,
skeleton loaders, keyboard-accessible controls, reduced-motion support, responsive down to phones.

**Role panels**
- **Admin** (`/admin`): real login, create programs, onboard mentors (password generator), assign mentors to programs.
- **Mentor** (`/mentor`): program switcher, add mentees with **auto-generated enrollment numbers and passwords** (shown once,
  copy button), password reset, resource builder for **videos / quizzes (full question editor) / projects** with deadlines and
  max scores, quiz lock/unlock, project review queue with scoring.
- **Mentee** (`/dashboard`): stats, overall progress, to-do / done filters, deadline chips, in-app quiz runner with result
  screen, project submission, live leaderboard with podium.

**AI profile** (`/profile`): dynamic generated avatar (changes with persona), persona, skill radar and levels, achievement
badges plus **interest-driven skill badges**, a written performance summary, rank-gap insight, ranked recommendations
(deadline + interests + weakest skill), points-over-time chart. The engine (`src/lib/aiProfile.js`) is deterministic and runs
in the browser so it never fails; if `ANTHROPIC_API_KEY` is set, `POST /api/m/ai-summary` upgrades the summary text to an
LLM-written one.

**Backend fixes and additions**
- Admin auth (`POST /api/admin/login`); create-program / create-mentor / assign-mentor now require an admin token.
- Mentee passwords are **hashed** (legacy plain-text accounts are upgraded on next login) and never returned by the API.
- Enrollment numbers auto-generated; `POST /api/mentees/:id/reset-password`.
- **Quizzes were created locked with no way to unlock them** → `PATCH /api/resources/:id/lock`.
- **Anyone could tick off a quiz/project for full marks** → `/complete` is now videos-only.
- Dashboard returns email, interests, completed-resource history and quiz windows; `PUT /api/m/interests`.
- Frontend bugs fixed: `hhttps://` project-submit URL, wrong mentor token key, profile expecting data that was never sent,
  `/mentors/me` route that didn't exist, API URL hard-coded in ~10 files (now one config).
- `backend/.env` was committed; `.gitignore` now excludes it. **Rotate any secrets that were in it.**

## Evaluation map
| Criterion | Where |
|---|---|
| Frontend UI/UX & redesign creativity (10) | `styles/tn.css`, `components/tn/*`, landing page |
| User role flow & multi-panel integration (10) | `/admin` → `/mentor` → `/dashboard`, one API layer |
| AI profile feature & innovation (8) | `/profile`, `lib/aiProfile.js`, `components/tn/mentee/AIProfile.js` |
| Backend integration & functionality (7) | `backend/routes/*`, `seed.js` |
| Code quality, responsiveness, presentation (5) | single API client, demo mode, responsive layouts |

## 3-minute demo script
1. Landing → **Explore the live demo** (mentee). Mark a video complete, take the quiz, submit the project.
2. **Leaderboard** tab: show your rank move. **AI Profile** tab: pick interests, watch badges and summary update.
3. Log out → **Mentor demo**: add a mentee (credentials modal), build a quiz, review the project you just submitted.
4. **Admin demo**: create a program and assign a mentor. Mention hashed passwords, admin auth and the demo-mode fallback.

## Project layout
```
frontend/src
  app/                 routes (/, /login, /mentee, /dashboard, /profile, /leaderboard, /mentor, /admin)
  components/tn/       design-system components, role apps, AI profile
  lib/                 api.js (real+demo switch), demo.js (in-browser backend), aiProfile.js, session.js
  styles/tn.css        design tokens + components
backend/               Express + MongoDB (routes/, models/, middleware/, seed.js)
```
