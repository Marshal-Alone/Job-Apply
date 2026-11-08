# Handoff Report: Technical Survey of Profile & Device Management (Requirement R2)

## 1. Observation
1. **Profile Representation & Constants**:
   - `src/lib/types.ts:8-17`: Interface `Student` defines `{ id, name, email, avatar, college, branch, batch, skills }`.
   - `src/lib/db.ts:35-56`: `INITIAL_STUDENTS` contains exactly two records:
     - `id: 'marshal'`, `name: 'Marshal'`, CS 2025.
     - `id: 'vaishnavi'`, `name: 'Vaishnavi'`, IT 2025.
   - `data/db.json:2-39`: Persists the initial student records for local JSON storage.
   - `src/lib/db.ts:298`: `collection.deleteMany({ id: { $nin: ['marshal', 'vaishnavi'] } })` strictly enforces that only Marshal and Vaishnavi exist.
   - `src/components/JobCard.tsx:59-60`: Peer student calculation is hard-paired:
     ```typescript
     const peerStudentId = activeStudent?.id === 'marshal' ? 'vaishnavi' : 'marshal';
     const peerName = activeStudent?.id === 'marshal' ? 'Vaishnavi' : 'Marshal';
     ```

2. **Current Client-Side Selection & Hardcoded Default**:
   - `src/app/page.tsx:23`: React state holds the active student: `const [activeStudent, setActiveStudent] = useState<Student | null>(null);`.
   - `src/app/page.tsx:78-90`: `fetchStudents` loads the student list and checks `localStorage.getItem('peerapply_active_student_id')`:
     ```typescript
     const savedId = typeof window !== 'undefined'
       ? localStorage.getItem('peerapply_active_student_id')
       : null;

     const matched = json.data.find((s: Student) => s.id === savedId);
     // Default to Marshal if not set or found
     const chosen = matched || json.data.find((s: Student) => s.id === 'marshal') || json.data[0];
     setActiveStudent(chosen);
     if (typeof window !== 'undefined') {
       localStorage.setItem('peerapply_active_student_id', chosen.id);
     }
     ```
     Verbatim observation: Line 85 hardcodes `s.id === 'marshal'` whenever `savedId` is not found, causing every device to default to Marshal on initial load.
   - `src/app/page.tsx:119-125`: `handleSelectStudent` updates React state and persists the choice: `localStorage.setItem('peerapply_active_student_id', student.id)`.

3. **Backend API State**:
   - `src/app/api/students/route.ts`: `GET` endpoint returns `{ success: true, data: students }` without device awareness.
   - No device tracking, device registration tables, or device ID validation exist in the codebase.

4. **Component Decoupling**:
   - `src/components/StudentSwitcher.tsx`: A self-contained component taking `students: Student[]`, `activeStudent: Student | null`, and `onSelectStudent: (student: Student) => void`. It renders toggle buttons with active state indicators and checkmarks.
   - `src/components/Navbar.tsx`: Mounts `StudentSwitcher` at line 75, passing props from `page.tsx`.

---

## 2. Logic Chain
1. **From Observation 2 (Line 85 hardcoding `marshal`)**:
   Because `fetchStudents` falls back unconditionally to `s.id === 'marshal'` when `localStorage` has no saved ID, any device opening the website for the first time will always default to Marshal.
2. **From Observation 2 & Problem Requirements (Multi-Device in Production)**:
   In a deployed environment, Device 1 (Marshal) and Device 2 (Vaishnavi) both open the website with empty local storage. Because neither device has prior local state, client-side code alone cannot determine if it is the first or a subsequent device. Central server/database arbitration is strictly necessary.
3. **From Architectural Analysis (IP vs Client UUID)**:
   IP address alone is invalid because peers on the same campus or home Wi-Fi share a single external NAT IP. A high-entropy client UUID (`crypto.randomUUID()`) stored in `localStorage` + cookie and registered with the server uniquely identifies distinct browser instances across devices without privacy or network ambiguity.
4. **From Observation 1 & 3 (Database Architecture)**:
   `src/lib/db.ts` supports dual-tier storage (MongoDB + Local JSON fallback). Adding a `devices` collection in MongoDB and `devices: []` in `data/db.json` enables the server to count registered devices atomically.
   - If device count is 0: the incoming device is registered as the first device and assigned default profile `'marshal'`.
   - If device count > 0: any incoming unregistered device is registered as a subsequent device and assigned default profile `'vaishnavi'`.
   - If a registered device reconnects with its UUID, it receives its assigned default profile.
5. **From Observation 2 & 4 (Preserving Manual Switching)**:
   In `fetchStudents`, if `localStorage.getItem('peerapply_active_student_id')` exists and matches a valid student, the user's manual selection is honored and takes precedence over the server's default profile. Only when `savedId` is absent does the device adopt its server-assigned default (`marshal` on device 1, `vaishnavi` on subsequent devices).
6. **From Observation 4 (Existing Components)**:
   `StudentSwitcher.tsx`, `Navbar.tsx`, `JobCard.tsx`, and `StatsBanner.tsx` are already dynamically parameterized. No structural or visual changes are required in those components; only `src/app/page.tsx`, `src/lib/db.ts`, `src/lib/types.ts`, `src/lib/validation.ts`, and the API layer need to be wired with device registration.

---

## 3. Caveats
1. **Incognito / Private Browsing**: If a user on Device 1 opens an Incognito/Private window (which does not inherit standard `localStorage` or cookies), that window will generate a new UUID and will be classified by the server as a subsequent device, defaulting to Vaishnavi. However, the user can switch to Marshal in 1 click via `StudentSwitcher`.
2. **Netlify Serverless Ephemeral `/tmp` without MongoDB**: In serverless production environments where `MONGODB_URI` is not configured, local JSON storage is written to `/tmp/peerapply-data/db.json`. Multiple serverless container instances may have separate `/tmp` directories. In production deployments, setting `MONGODB_URI` provides unified device registration across all serverless lambdas. Furthermore, setting a persistent 1-year cookie (`Set-Cookie: peerapply_device_id=...`) and caching the assigned profile in `localStorage` protects against serverless cold restarts.
3. **No Code Modification Constraint**: Per dispatch instructions, this investigation was strictly read-only. No source files were modified, and no test files were created.

---

## 4. Conclusion
Requirement R2 can be cleanly and reliably implemented without changing any UI component layouts.
The solution consists of:
1. Generating a client UUID (`peerapply_device_id`) on the client and storing it in `localStorage` and a persistent cookie.
2. Extending `src/lib/db.ts` with a `registerOrGetDevice` function that atomically assigns `'marshal'` to device #1 and `'vaishnavi'` to all subsequent devices across MongoDB and Local JSON.
3. Adding a device initialization API route (`POST /api/devices/init` and query parameter on `GET /api/students`) to return the device's default profile.
4. Updating `src/app/page.tsx:85` to use the server-returned `defaultStudentId` instead of the hardcoded `'marshal'` fallback, while retaining `localStorage.getItem('peerapply_active_student_id')` priority for manual switches.

---

## 5. Verification Method
When the implementer applies the changes, verify using the following steps:
1. **Inspection of Modified Files**:
   - Verify `src/lib/types.ts` contains `DeviceRecord` and `DeviceInitResponse`.
   - Verify `src/lib/validation.ts` validates `deviceId`.
   - Verify `src/lib/db.ts` contains `registerOrGetDevice` with dual-tier support.
   - Verify `src/app/page.tsx` initializes `deviceId` and selects `defaultStudentId` only when `savedId` is null.
2. **First Device Verification (Device 1)**:
   - Clear browser storage (`localStorage.clear()`, cookies cleared).
   - Ensure `db.json` has `devices: []` (or clear test devices).
   - Load `http://localhost:3000`.
   - Confirm active applicant in navbar defaults to **Marshal**.
   - Check `localStorage['peerapply_active_student_id']` is `'marshal'`.
3. **Subsequent Device Verification (Device 2)**:
   - Open a secondary browser (e.g. Edge, Firefox, or Chrome in a new profile / mobile emulator).
   - Load `http://localhost:3000`.
   - Confirm active applicant in navbar defaults to **Vaishnavi**.
   - Check `localStorage['peerapply_active_student_id']` is `'vaishnavi'`.
4. **Manual Switching Preservation Verification**:
   - On Device 1, click "Vaishnavi" in the switcher -> UI switches to Vaishnavi.
   - Reload page on Device 1 -> UI remains on Vaishnavi (manual choice preserved).
   - On Device 2, click "Marshal" in the switcher -> UI switches to Marshal.
   - Reload page on Device 2 -> UI remains on Marshal (manual choice preserved).
5. **Build Verification**:
   - Run `npm run build` to confirm zero TypeScript compilation errors.
