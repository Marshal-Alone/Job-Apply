## 2026-11-08T10:51:30Z

You are a Worker agent assigned to Milestone 3: In-House Background Web Notifications.
Working directory: c:\Users\marsh\Downloads\Job-Apply\.agents\teamwork\worker_m3\

Read authoritative requirements and architecture:
- ORIGINAL_REQUEST.md: c:\Users\marsh\Downloads\Job-Apply\.agents\teamwork\ORIGINAL_REQUEST.md
- PROJECT.md: c:\Users\marsh\Downloads\Job-Apply\PROJECT.md
- Explorer 3 Survey Report: c:\Users\marsh\Downloads\Job-Apply\.agents\teamwork\explorer_survey_3\handoff.md

Objective:
Implement Requirement R3:
When one student posts a job, the other student must be notified with the job title and company name via native browser desktop notifications (Web Notification API), including when the tab is backgrounded or when the user is in another application, without using third-party services.

Specific Implementation Tasks:
1. Write Ownership: You exclusively own `public/sw.js`, `src/lib/notifications.ts`, `src/components/Navbar.tsx`, and `src/app/page.tsx`.
2. In `public/sw.js`:
   - Implement service worker:
     - `self.addEventListener('install', (event) => self.skipWaiting());`
     - `self.addEventListener('activate', (event) => event.waitUntil(self.clients.claim()));`
     - `self.addEventListener('notificationclick', (event) => { ... focus matching client or open / ... });`
3. In `src/lib/notifications.ts`:
   - Web Audio chime synthesizer using `window.AudioContext` (e.g. pleasant two-tone chime 523Hz -> 659Hz) without external audio files.
   - `requestNotificationPermission(): Promise<NotificationPermission>`
   - `getNotificationPermission(): NotificationPermission`
   - `sendDesktopNotification(title: string, options: { body: string; tag?: string; icon?: string; data?: any }): Promise<void>`
     - Check permission is 'granted'.
     - Hybrid dispatch: if `'serviceWorker' in navigator`, await `navigator.serviceWorker.ready` and call `reg.showNotification(title, options)`.
     - Fallback to `new Notification(title, options)`.
4. In `src/components/Navbar.tsx`:
   - Add a Notification Bell button (Hallmark design tokens, accessible, subtle pulse when active or unmuted) that displays permission status and requests permission on click.
5. In `src/app/page.tsx`:
   - Register service worker (`/sw.js`) upon component mount.
   - Maintain `knownJobIdsRef = useRef<Set<string>>(new Set())` and `isInitialLoadRef = useRef<boolean>(true)`.
   - On initial jobs fetch: populate `knownJobIdsRef` with all existing job IDs and set `isInitialLoadRef.current = false`.
   - In the polling loop (set to 5 seconds):
     - When refreshed jobs arrive, detect any job whose ID is not in `knownJobIdsRef`.
     - For each newly detected job:
       - If `job.postedBy?.studentId && job.postedBy.studentId !== activeStudent?.id`:
         - Trigger desktop notification with title `New Job: ${job.title}` and body `${job.company} • Shared by ${job.postedBy.studentName || 'Peer'}`.
         - Play in-house Web Audio chime.
         - Show toast notification in-app as well.
       - Add `job.id` to `knownJobIdsRef`.
     - Update `jobs` state with new jobs.
6. Run `npm run build` using your shell tools to verify Next.js builds with zero errors.

MANDATORY INTEGRITY WARNING:
DO NOT CHEAT. All implementations must be genuine. DO NOT hardcode test results, create dummy/facade implementations, or circumvent the intended task. A teamwork_auditor will independently verify your work. Integrity violations WILL be detected and your work WILL be rejected.

Constraints:
- Focus strictly on coding the task directly in the application.
- DO NOT create any test suites, test files, or test documentation files.
- NEVER run git commit or git push.

Deliverables:
- Write changes to target files.
- Verify `npm run build` passes.
- Write handoff report to `c:\Users\marsh\Downloads\Job-Apply\.agents\teamwork\worker_m3\handoff.md`.
- Send a message to orchestrator upon completion.
