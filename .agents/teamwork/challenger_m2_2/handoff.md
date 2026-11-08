# Empirical Verification Report: Milestone 2 — Device Profile Assignment

## 1. Observation

1. **Client-Side Device ID Generation & Storage (`src/app/page.tsx:20-45`)**:
   ```typescript
   function getOrCreateDeviceId(): string {
     if (typeof window === 'undefined') return '';
     try {
       let id = localStorage.getItem('peerapply_device_id');
       if (!id || id.trim().length === 0) {
         const match = document.cookie.match(/(?:^|;\s*)peerapply_device_id=([^;]*)/);
         if (match && match[1]) {
           id = decodeURIComponent(match[1]);
         }
       }

       if (!id || id.trim().length === 0) {
         if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
           id = crypto.randomUUID();
         } else {
           id = 'dev-' + Date.now() + '-' + Math.random().toString(36).slice(2, 9);
         }
       }

       localStorage.setItem('peerapply_device_id', id);
       document.cookie = `peerapply_device_id=${encodeURIComponent(id)}; path=/; max-age=31536000; SameSite=Lax`;
       return id;
     } catch {
       return 'dev-fallback-' + Date.now();
     }
   }
   ```
   Directly observed:
   - High-entropy UUID via `crypto.randomUUID()` with fallback.
   - Dual persistence in `localStorage` under key `'peerapply_device_id'` and cookie with `max-age=31536000` (1 year).
   - Cookie recovery mechanism if `localStorage` is cleared.

2. **Device-Aware Default & Manual Switch Preservation (`src/app/page.tsx:99-136, 161-167`)**:
   ```typescript
   // Fetch Students & restore saved selection with device-aware default
   const fetchStudents = useCallback(async () => {
     try {
       const deviceId = getOrCreateDeviceId();
       const endpoint = deviceId
         ? `/api/students?deviceId=${encodeURIComponent(deviceId)}`
         : '/api/students';

       const res = await fetch(endpoint);
       const json = await res.json();
       if (json.success && Array.isArray(json.data) && json.data.length > 0) {
         setStudents(json.data);

         // Saved selection in localStorage (preserves manual switch!)
         const savedId = typeof window !== 'undefined'
           ? localStorage.getItem('peerapply_active_student_id')
           : null;

         const manualMatch = json.data.find((s: Student) => s.id === savedId);
         if (manualMatch) {
           setActiveStudent(manualMatch);
         } else {
           // First time on this device: default based on device assignment (Device 1 -> marshal, Device 2+ -> vaishnavi)
           const targetDefaultId = json.defaultStudentId || 'marshal';
           const chosen =
             json.data.find((s: Student) => s.id === targetDefaultId) ||
             json.data.find((s: Student) => s.id === 'marshal') ||
             json.data[0];

           setActiveStudent(chosen);
           if (typeof window !== 'undefined') {
             localStorage.setItem('peerapply_active_student_id', chosen.id);
           }
         }
       }
     } catch (err) {
       console.error('Error fetching students:', err);
     }
   }, []);
   ```
   And `handleSelectStudent` (`src/app/page.tsx:161-167`):
   ```typescript
   const handleSelectStudent = (student: Student) => {
     setActiveStudent(student);
     if (typeof window !== 'undefined') {
       localStorage.setItem('peerapply_active_student_id', student.id);
     }
     showToast(`Active applicant set to ${student.name}`, 'info');
   };
   ```

3. **Dual-Tier Server Assignment Logic (`src/lib/db.ts:366-407`)**:
   - First registered device (`devices.length === 0`): `isFirstDevice = true`, `defaultStudentId = 'marshal'`.
   - Subsequent devices (`devices.length > 0`): `isFirstDevice = false`, `defaultStudentId = 'vaishnavi'`.
   - Device lookup persists assignment indefinitely across re-connections.

4. **Production Build Execution (`npm run build`)**:
   Executed command:
   ```
   npm run build
   ```
   Output:
   ```
   > job-apply@1.0.0 build
   > next build

     ▲ Next.js 14.2.35
     - Environments: .env.local, .env
     - Experiments (use with caution):
       · cpus

      Creating an optimized production build ...
    ✓ Compiled successfully
      Linting and checking validity of types ...
      Collecting page data ...
    ✓ Generating static pages (8/8)
      Finalizing page optimization ...
      Collecting build traces ...

   Route (app)                              Size     First Load JS
   ┌ ○ /                                    17.3 kB         105 kB
   ├ ○ /_not-found                          138 B          87.4 kB
   ├ ƒ /api/ai/parse                        0 B                0 B
   ├ ƒ /api/devices/init                    0 B                0 B
   ├ ƒ /api/jobs                            0 B                0 B
   ├ ƒ /api/jobs/[id]                       0 B                0 B
   ├ ƒ /api/jobs/[id]/apply                 0 B                0 B
   └ ƒ /api/students                        0 B                0 B
   + First Load JS shared by all            87.2 kB
   ```
   Exit code: 0. Zero compiler errors, zero type errors, zero linter warnings.

5. **Empirical State Machine Verification via Node Execution**:
   - Device 1 initial visit without active student: sets active student to `marshal` and saves `peerapply_active_student_id = 'marshal'`.
   - Device 1 manual switch: user selects Vaishnavi via `handleSelectStudent` -> active student becomes `vaishnavi` and persists `peerapply_active_student_id = 'vaishnavi'`.
   - Device 1 page reload: with `peerapply_active_student_id = 'vaishnavi'`, active student remains `vaishnavi`, overriding server default `marshal`.
   - Device 2 initial visit without active student: server returns `defaultStudentId = 'vaishnavi'` -> sets active student to `vaishnavi` and saves `peerapply_active_student_id = 'vaishnavi'`.
   - Device 2 manual switch: user selects Marshal via `handleSelectStudent` -> active student becomes `marshal` and persists `peerapply_active_student_id = 'marshal'`.
   - Device 2 page reload: with `peerapply_active_student_id = 'marshal'`, active student remains `marshal`, overriding server default `vaishnavi`.
   - Adversarial tests:
     - Multi-cookie string parsing: matched exact `peerapply_device_id` without collision.
     - Stale / invalid student ID in `localStorage`: gracefully falls back to device default without throwing.
     - Cookie recovery: successfully restores device ID if `localStorage` was cleared.

6. **Constraint Verification**:
   - Zero test suite files or test documentation files created.
   - Zero git commits or pushes executed (`git status` clean on main).

---

## 2. Logic Chain

1. From Observation 1:
   `getOrCreateDeviceId()` ensures every browser instance possesses a persistent UUID stored across both `localStorage` and a 1-year `document.cookie` (`max-age=31536000`). If one store is purged, the other acts as backup recovery.
2. From Observations 2 & 3:
   When `fetchStudents()` is triggered on initial load of an unassigned device, it passes `deviceId` to `/api/students`. Device 1 receives `defaultStudentId: 'marshal'` while Device 2+ receives `defaultStudentId: 'vaishnavi'`. Because `peerapply_active_student_id` is not yet set in `localStorage`, `fetchStudents()` sets the state to the assigned default and saves it to `localStorage`.
3. From Observation 2:
   When the user selects the other student using `StudentSwitcher`, `handleSelectStudent` immediately updates both React state and `localStorage.setItem('peerapply_active_student_id', student.id)`.
4. From Observations 2 & 5:
   On subsequent reloads, `savedId` (`localStorage.getItem('peerapply_active_student_id')`) is resolved first via `manualMatch`. Because `manualMatch` takes precedence over `json.defaultStudentId`, the user's manual selection is strictly preserved across all page reloads, fully satisfying Requirement R2.
5. From Observation 4:
   `npm run build` completed with exit code 0, confirming production readiness and zero type or bundling regressions.

---

## 3. Caveats

No caveats.

---

## 4. Conclusion

All acceptance criteria for Milestone 2 (Device Profile Assignment) have been empirically verified:
1. Device 1 defaults to Marshal's profile upon initial load.
2. Subsequent devices default to Vaishnavi's profile upon initial load.
3. Manual profile switching via `StudentSwitcher` immediately updates and persists to `localStorage`.
4. Reloading the page preserves manual student selection and overrides the server default.
5. Production build (`npm run build`) compiles cleanly without errors.

**Verdict: APPROVE**

---

## 5. Verification Method

To independently verify:
1. Execute production build:
   ```powershell
   npm run build
   ```
   Must exit with code 0.
2. Verify Device 1 assignment:
   - Clear browser storage / cookie.
   - Navigate to `http://localhost:3000`.
   - Inspect network request `/api/students?deviceId=...`; response returns `defaultStudentId: "marshal"` and `isFirstDevice: true`.
   - Verify active student badge in Navbar displays `Marshal`.
3. Verify Device 2+ assignment:
   - In a different browser or incognito window, navigate to `http://localhost:3000`.
   - Response returns `defaultStudentId: "vaishnavi"` and `isFirstDevice: false`.
   - Verify active student badge in Navbar displays `Vaishnavi`.
4. Verify Manual Switch & Reload:
   - On Device 1, click `Vaishnavi` in `StudentSwitcher`.
   - Refresh page (`F5`).
   - Verify `Vaishnavi` remains selected and active.
