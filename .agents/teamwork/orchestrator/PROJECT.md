# Project: PeerApply Nexus - Auto-Apply, Device Profiles & In-House Notifications

## Architecture
PeerApply Nexus is a Next.js (App Router) collaborative job hunting platform with a dual-tier database (MongoDB + Local JSON fallback).
The architecture comprises three core pillars:
1. **Job Application Lifecycle (R1)**:
   - When a student submits a job via `AddJobModal`, `createJob()` in `src/lib/db.ts` atomically records an application with status `'APPLIED'` for `jobData.postedBy.studentId`.
   - The returned job payload contains the application record, and `src/app/page.tsx` prepends it to state, causing `JobCard` to immediately render the `#10B981` Emerald "Applied" badge.
2. **Device Registration & Dynamic Profile Assignment (R2)**:
   - Client generates and persists a high-entropy `deviceId` (`crypto.randomUUID()`) in `localStorage` and a persistent cookie.
   - Dual-tier database (`src/lib/db.ts`) tracks registered devices: Device #1 defaults to `'marshal'`, subsequent devices default to `'vaishnavi'`.
   - `POST /api/devices/init` and `GET /api/students` resolve device defaults.
   - Client checks `localStorage.getItem('peerapply_active_student_id')` first so manual profile switching remains permanently preserved.
3. **In-House Background Web Notifications (R3)**:
   - Hybrid native notification dispatcher (`src/lib/notifications.ts`) using `ServiceWorkerRegistration.showNotification()` backed by `public/sw.js` and window `Notification` fallback.
   - Zero-asset Web Audio API chime synthesizer for audible alerts.
   - Adaptive client polling loop in `src/app/page.tsx` diffing incoming jobs against a known-jobs registry, filtering out submissions by the active student and triggering desktop alerts for peer submissions.
   - Hallmark-compliant Notification Bell toggle in `src/components/Navbar.tsx` for permission requests and state indication.

## Feature Inventory
Every feature from the Survey phase is mapped below with its assigned milestone:
| # | Feature | Description | Milestone | Source |
|---|---------|-------------|-----------|--------|
| 1 | Atomic Auto-Apply on Creation | `createJob()` automatically initializes the poster's application with status 'APPLIED' | M1 | survey_1 (DONE) |
| 2 | Immediate Applied UI Feedback | Frontend immediately reflects 'Applied' status with emerald badge on submission | M1 | survey_1 (DONE) |
| 3 | Device ID Generation & Storage | High-entropy UUID stored in localStorage and 1-year cookie | M2 | survey_2 (DONE) |
| 4 | Database Device Registry | Dual-tier device registry in MongoDB and Local JSON | M2 | survey_2 (DONE) |
| 5 | First vs Subsequent Device Assignment | Device #1 gets 'marshal', Device #2+ gets 'vaishnavi' | M2 | survey_2 (DONE) |
| 6 | Manual Profile Switch Retention | User manual switcher overrides default and persists in localStorage | M2 | survey_2 (DONE) |
| 7 | Device Init API Endpoint | Validated route `POST /api/devices/init` and `GET /api/students?deviceId=...` | M2 | survey_2 (DONE) |
| 8 | Service Worker & Background Notifications | `public/sw.js` and hybrid dual-dispatch desktop notifications | M3 | survey_3 (DONE) |
| 9 | In-House Web Audio Chime | Synthesized dual-tone chime without external audio assets | M3 | survey_3 (DONE) |
| 10 | Peer Job Diffing & Notification Trigger | Detects new jobs from peer and fires desktop alert when backgrounded | M3 | survey_3 (DONE) |
| 11 | Notification Bell & Permission Toggle | Hallmark-compliant navbar bell toggle for notification permissions | M3 | survey_3 (DONE) |
| 12 | End-to-End Build & Integration | Comprehensive verification of all three features operating together | M4 | survey (DONE) |

## Milestones
| # | Name | Scope | Dependencies | Status |
|---|------|-------|-------------|--------|
| 1 | M1: Auto-Apply on Job Submission | Update `createJob` in `db.ts` to initialize applications map; verify UI reflection | none | DONE |
| 2 | M2: Device Profile Assignment | Implement device tracking in types, validation, db.ts, API route, and page.tsx | M1 | DONE |
| 3 | M3: In-House Web Notifications | Implement public/sw.js, notifications.ts, Navbar bell toggle, page.tsx polling | M1, M2 | DONE |
| 4 | M4: Final Integration & Audit | Verify build, full multi-device flow, background alerts, and run forensic audit | M1, M2, M3 | DONE |

## Interface Contracts
### `createJob(jobData)` Contract
- **Input**: `Omit<Job, 'id' | 'createdAt' | 'updatedAt' | 'applications'>`
- **Output**: `Promise<Job>` with `applications[jobData.postedBy.studentId]` set to:
  ```typescript
  {
    studentId: jobData.postedBy.studentId,
    studentName: jobData.postedBy.studentName,
    studentAvatar: jobData.postedBy.studentAvatar,
    status: 'APPLIED',
    appliedAt: now,
    updatedAt: now
  }
  ```

### Device Registry Contract
- **Data Model**: `DeviceRecord { deviceId: string; defaultStudentId: 'marshal' | 'vaishnavi'; isFirstDevice: boolean; createdAt: string; lastSeenAt: string; }`
- **Endpoint**: `POST /api/devices/init`
  - Input: `{ deviceId: string }`
  - Output: `{ success: true, data: { deviceId: string, defaultStudentId: 'marshal' | 'vaishnavi', isFirstDevice: boolean } }`
- **Endpoint**: `GET /api/students?deviceId=...` (or `x-device-id` header)
  - Output: `{ success: true, data: Student[], defaultStudentId: 'marshal' | 'vaishnavi', isFirstDevice: boolean }`

### Notification Dispatch Contract
- **Module**: `src/lib/notifications.ts`
  - `initNotifications(): Promise<NotificationPermission>`
  - `playNotificationSound(): void`
  - `notifyNewJob(job: Job): Promise<void>`
- **Service Worker**: `public/sw.js`
  - Listens for `push` (optional fallback) and handles `notificationclick` to focus existing tab.

## Code Layout
- `src/lib/types.ts`: TypeScript contracts for Student, Job, Application, DeviceRecord.
- `src/lib/validation.ts`: Zod schemas for input validation (VibeBreaker Pass 01).
- `src/lib/db.ts`: Dual-tier MongoDB and Local JSON database layer.
- `src/lib/notifications.ts`: Native Web Notification API and Web Audio chime.
- `public/sw.js`: Service worker for background notification handling.
- `src/app/api/jobs/route.ts`: Jobs listing and creation.
- `src/app/api/students/route.ts`: Students listing with device default profile resolution.
- `src/app/api/devices/init/route.ts`: Device registration endpoint.
- `src/app/page.tsx`: Main dashboard, polling loop, peer diffing, student selection.
- `src/components/Navbar.tsx`: Header navigation with Notification Bell toggle and StudentSwitcher.
