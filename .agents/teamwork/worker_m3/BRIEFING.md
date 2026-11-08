# BRIEFING — 2026-11-08T10:59:00Z

## Mission
Implement Requirement R3: In-House Background Web Notifications (Native Web Notification API + Service Worker + Web Audio chime) when jobs are posted, with permission UI in Navbar and zero 3rd-party notification dependencies.

## 🔒 My Identity
- Archetype: worker
- Roles: implementer, qa, specialist
- Working directory: c:\Users\marsh\Downloads\Job-Apply\.agents\teamwork\worker_m3
- Original parent: a6a22807-dc45-49ba-addf-3ed8d2a39759
- Milestone: Milestone 3 - In-House Background Web Notifications

## 🔒 Key Constraints
- Focus strictly on coding the task directly in the application.
- DO NOT create any test suites, test files, or test documentation files.
- NEVER run git commit or git push.
- Follow Hallmark design standards (tokens at :root, no transition: all, WCAG AA, clean responsive layout).
- Exclusive file ownership: `public/sw.js`, `src/lib/notifications.ts`, `src/components/Navbar.tsx`, `src/app/page.tsx`.
- No third-party notification services (e.g., Pusher, OneSignal, FCM). Use native Web Notification API and Service Worker.
- Integrity: DO NOT CHEAT. Genuine implementation with real state and behavior.

## Current Parent
- Conversation ID: a6a22807-dc45-49ba-addf-3ed8d2a39759
- Updated: not yet

## Task Summary
- **What to build**: Service worker (`public/sw.js`), notification utility with Web Audio synth (`src/lib/notifications.ts`), permission bell button in `Navbar.tsx`, and background/poll detection with sound + desktop notification + toast in `src/app/page.tsx`.
- **Success criteria**: Next.js builds clean (`npm run build`), native Web Notification API works with service worker registration, chime plays on new job from peer, notification bell reflects status and triggers prompt.
- **Interface contracts**: PROJECT.md, ORIGINAL_REQUEST.md
- **Code layout**: Next.js App Router layout in `c:\Users\marsh\Downloads\Job-Apply\`

## Key Decisions Made
- Implemented hybrid desktop notification dispatch: checks for active Service Worker registration first (`showNotification`), with fallback to Window `Notification` constructor.
- Implemented zero-asset synthesized two-tone audio chime (C5 523.25Hz -> E5 659.25Hz) using `window.AudioContext` with exponential gain decay, preventing 404s or network dependency.
- Used `knownJobIdsRef` (Set<string>) and `isInitialLoadRef` to record initial jobs on mount so existing posts are never notified, and diff incoming jobs during the 5s polling cycle.
- Filtered notifications by `job.postedBy.studentId !== activeStudentRef.current?.id` so students are never self-notified of their own postings. Also registered newly added jobs into `knownJobIdsRef` synchronously in `handleJobAdded`.
- Added window focus listener in `src/app/page.tsx` for immediate diff checks when backgrounded tabs are re-focused.
- Designed Notification Bell in `Navbar.tsx` following Hallmark standard: tokens from `:root`, WCAG AA accessibility, proper `aria-label`, dynamic status indicators (emerald active dot, pulse on unprompted, muted BellOff on denied), and no `transition: all`.

## Artifact Index
- `DISPATCH.md` — assignment prompt
- `progress.md` — liveness heartbeat and progress tracker
- `handoff.md` — final 5-component handoff report

## Change Tracker
- **Files modified**:
  - `public/sw.js` — Service worker with install, activate, and notificationclick focus handling
  - `src/lib/notifications.ts` — Web Audio chime synth, permission helpers, hybrid desktop notification dispatcher, service worker registration
  - `src/components/Navbar.tsx` — Added accessible Notification Bell button with dynamic status and permission trigger
  - `src/app/page.tsx` — Registered service worker, initialized knownJobIdsRef diffing, set 5s polling loop, added focus listener, wired desktop notification and chime on peer job detection
- **Build status**: Pass (`npm run build` exited with code 0)
- **Pending issues**: None

## Quality Status
- **Build/test result**: Pass (0 errors, 8/8 routes compiled statically)
- **Lint status**: Clean (0 lint errors)
- **Tests added/modified**: None (per constraint: do not create test suites)

## Loaded Skills
- **Source**: C:\Users\marsh\.gemini\config\skills\hallmark\SKILL.md
- **Local copy**: C:\Users\marsh\.gemini\config\skills\hallmark\SKILL.md
- **Core methodology**: Design system rules, token usage, accessibility, zero generic AI tropes
