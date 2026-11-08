## 2026-11-08T10:15:53Z
You are an Explorer agent investigating the codebase for PeerApply Nexus.
Working directory: c:\Users\marsh\Downloads\Job-Apply\.agents\teamwork\explorer_survey_3\
Read ORIGINAL_REQUEST.md at: c:\Users\marsh\Downloads\Job-Apply\.agents\teamwork\ORIGINAL_REQUEST.md

Task:
Perform a comprehensive technical survey of In-House Background Web Notifications in the codebase, specifically focusing on Requirement R3:
- R3: In-House Background Web Notifications:
  When one student posts a job, the other student must be notified with the job title and company name via native browser desktop notifications (Web Notification API), including when the tab is backgrounded or when the user is in another application, without using third-party services.

Investigate:
1. Current polling/real-time setup in the project (is there SWR, polling intervals, SSE, WebSocket, or static fetch?).
2. How to implement in-house notifications without third-party services:
   - Server-Sent Events (SSE) route (e.g. `/api/notifications/stream` or `/api/events`) or lightweight polling endpoint `/api/notifications/poll` or similar.
   - Browser Web Notification API (`new Notification(...)`, `Notification.requestPermission()`).
   - Service Worker (`navigator.serviceWorker.register('/sw.js')` and `serviceWorkerRegistration.showNotification(...)`) which is essential for reliable desktop notifications when the tab is backgrounded or minimized, or Notification API in window when tab is backgrounded.
   - How the client detects that a *new* job was posted by the *other* student (filtering out notifications for the posting student's own submissions).
   - Audio chime / visual permission prompt / toggle.
3. Review Next.js App Router compatibility with Service Workers, public assets (`public/sw.js`), SSE endpoints, or polling.
4. Review VibeBreaker and design standards: WCAG AA, design tokens, error handling.

Deliverables:
- Write your detailed findings to `c:\Users\marsh\Downloads\Job-Apply\.agents\teamwork\explorer_survey_3\analysis.md`.
- Write your handoff report to `c:\Users\marsh\Downloads\Job-Apply\.agents\teamwork\explorer_survey_3\handoff.md`.
- Send a message to the orchestrator when complete.

Constraints:
- You are read-only regarding codebase source files. Do not modify source code.
- Do not create any test suites or test files.
- Never run git commit or git push.
