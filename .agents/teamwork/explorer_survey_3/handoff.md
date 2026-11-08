# Handoff Report: In-House Background Web Notifications (Requirement R3)

**Agent**: Explorer Survey 3  
**Working Directory**: `c:\Users\marsh\Downloads\Job-Apply\.agents\teamwork\explorer_survey_3\`  
**Target Requirement**: R3 — In-House Background Web Notifications  
**Status**: Survey Complete (Hard Handoff)  

---

## 1. Observation

Direct observations from the codebase investigation:

1. **Current Polling Mechanism (`src/app/page.tsx:110-115`)**:
   ```tsx
   // Auto-refresh interval (polling for peer updates every 15s)
   const interval = setInterval(() => {
     fetchJobs(true);
   }, 15000);

   return () => clearInterval(interval);
   ```
   `fetchJobs(true)` calls `GET /api/jobs` and sets `setJobs(json.data)` unconditionally (lines 50–68). It does not diff previous jobs vs. new jobs, does not record seen job IDs, and triggers no notifications.
2. **Data Structure (`src/lib/types.ts:32-58`)**:
   `Job` includes:
   - `id: string` (`job-${Date.now()}-${random}`)
   - `title: string`
   - `company: string`
   - `postedBy: { studentId: string; studentName: string; studentAvatar?: string; }`
   - `createdAt: string`
   - `applications: Record<string, StudentApplication>`
3. **Dual-Tier Database Layer (`src/lib/db.ts:29-33, 120-185`)**:
   ```typescript
   const isServerless = Boolean(process.env.NETLIFY || process.env.AWS_LAMBDA_FUNCTION_NAME || process.env.VERCEL);
   const DATA_DIR = isServerless ? path.join('/tmp', 'peerapply-data') : path.join(process.cwd(), 'data');
   const DB_FILE = path.join(DATA_DIR, 'db.json');
   ```
   Uses MongoDB if `MONGODB_URI` is set, otherwise falls back to local JSON (`data/db.json` or `/tmp/peerapply-data/db.json`).
4. **Deployment Environment (`netlify.toml:1-11`)**:
   Deploys on Netlify using `@netlify/plugin-nextjs`. Functions run in serverless container environments where lambdas are ephemeral and isolated.
5. **No Existing Service Worker or Public Assets**:
   Inspection via `list_dir` on `c:\Users\marsh\Downloads\Job-Apply\public` confirmed the directory does not yet exist.
6. **Build Integrity**:
   Ran `npm run build`:
   ```text
   ✓ Compiled successfully
   Linting and checking validity of types ...
   ✓ Generating static pages (7/7)
   Finalizing page optimization ...
   Command exited with code 0.
   ```
   Next.js 14.2.35 builds with 0 errors.

---

## 2. Logic Chain

1. **Evaluation of Real-Time Transports (SSE vs. Polling)**:
   - *Observation*: `netlify.toml` and `src/lib/db.ts` show that PeerApply Nexus is targeted for Netlify serverless deployment and supports local file fallback (`data/db.json`).
   - *Reasoning*: Server-Sent Events (SSE) require persistent long-lived connections and a shared pub-sub bus. In serverless environments, individual client HTTP connections land on separate, short-lived lambda instances that do not share memory or process state. Furthermore, when running without MongoDB (local JSON fallback), file watching or multi-process events fail across lambdas.
   - *Inference*: Dedicated Server-Sent Events (SSE) will be fragile or fail in serverless. Conversely, client-driven adaptive polling (`GET /api/jobs` every 5–10s) executes standard stateless HTTP requests directly against MongoDB or disk storage, making it 100% reliable across serverless, multi-device, and local development with zero external dependencies.

2. **Evaluation of Notification APIs (Window `new Notification` vs. Service Worker)**:
   - *Observation*: Requirement R3 requires desktop notifications when the tab is backgrounded or when the user is working in another desktop application.
   - *Reasoning*:
     - `new Notification(title, options)` can trigger OS notifications when permitted, but modern Chromium/Edge engines and Android restrict `new Notification()` constructors in Document context.
     - `ServiceWorkerRegistration.showNotification(title, options)` is universally supported across modern desktop and mobile browsers, executes reliably in background contexts, and supports the `notificationclick` event to bring the tab into focus.
   - *Inference*: A hybrid dual-dispatch approach (`navigator.serviceWorker.ready -> reg.showNotification(...)` with fallback to `new Notification(...)`) ensures maximum reliability across all browser environments.

3. **Peer Detection & Filtering**:
   - *Observation*: Each job records `postedBy.studentId` (`'marshal'` or `'vaishnavi'`), and `activeStudent` tracks the currently logged-in student.
   - *Reasoning*: To notify the *other* student when a job is posted without self-notifying:
     - On initial page load, all existing job IDs are registered into a `knownJobIdsRef` Set so existing posts are never notified.
     - On subsequent poll responses, any job whose ID is not in `knownJobIdsRef` is a newly created job.
     - If `job.postedBy.studentId !== activeStudent.id`, it was posted by the peer.
     - The client triggers the desktop notification (`"${job.title}" at "${job.company}" posted by ${job.postedBy.studentName}`), plays the in-house audio chime, and registers the job ID as seen.
     - If `job.postedBy.studentId === activeStudent.id`, the notification is suppressed.

4. **Zero-Asset Web Audio Synthesizer**:
   - *Observation*: External audio files (.mp3) can fail to load or generate 404s.
   - *Reasoning*: The Web Audio API (`window.AudioContext`) allows synthesizing an instant, pleasant dual-tone chime (523Hz -> 659Hz) with 0kb payload, zero network latency, and no external files.

---

## 3. Caveats

1. **Browser Permission Gate**:
   - The browser strictly requires `Notification.requestPermission()` to be triggered by an explicit user gesture (e.g. clicking a Notification Bell toggle in the Navbar). It cannot be forced silently on initial load without user interaction.
2. **OS-Level Focus Assist / Do Not Disturb**:
   - Native OS settings (Windows Focus Assist or macOS Do Not Disturb) can suppress notification banners visually. The in-house Web Audio chime and in-app toast ensure the user is still alerted even if OS banners are silenced.
3. **Tab Severely Throttled by OS Memory Saver**:
   - If a background tab is kept hidden for hours and the browser's aggressive tab-discarding (Memory Saver) puts it to sleep, timers are paused until the tab is clicked or focused. The `window.addEventListener('focus', ...)` handler immediately detects any missed jobs the instant the tab is revisited.

---

## 4. Conclusion

Requirement R3 can be completely satisfied in-house without any third-party services using:
1. **Adaptive Client Polling (5s interval)** in `src/app/page.tsx`, building directly on the existing polling loop.
2. **Public Service Worker (`public/sw.js`)** handling background notification clicks and tab focus.
3. **Notification Utility (`src/lib/notifications.ts`)** implementing the hybrid dual-dispatch notification trigger, permission manager, and zero-asset Web Audio chime.
4. **Peer Filter in `src/app/page.tsx`** verifying `job.postedBy.studentId !== activeStudent?.id` against a deduplication cache (`knownJobIdsRef` + `localStorage`).
5. **Hallmark Notification Bell Toggle (`src/components/Navbar.tsx`)** allowing the user to grant permission, toggle alerts, and view status.

---

## 5. Verification Method

To independently verify the implementation when built:

1. **Build Validation**:
   ```powershell
   npm run build
   ```
   Must pass with exit code 0 and 0 TypeScript/ESLint warnings.

2. **Functional Multi-Device / Two-Tab Simulation**:
   - Open Tab A on `http://localhost:3000` with active profile **Marshal**.
   - Open Tab B (incognito or second browser) on `http://localhost:3000` with active profile **Vaishnavi**.
   - In Tab B, click the Notification Bell in the Navbar and grant permission.
   - Minimize Tab B or switch focus to another application (e.g. Notepad).
   - In Tab A, submit a new job (e.g. "Frontend Engineer" at "Acme Corp").
   - **Expected Result**: Within 5 seconds, Tab B receives a native desktop notification: `"New Job: Frontend Engineer" - "Acme Corp • Shared by Marshal"`, plays the chime, and clicking the notification focuses Tab B.
   - In Tab A (the submitting user), verify that NO notification was triggered for their own submission.
