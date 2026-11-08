# Handoff Report: Milestone 2 Empirical Verification — Device Profile Assignment

## 1. Observation
1. **Source Inspection**:
   - `src/lib/types.ts` defines `DeviceRecord`, `DeviceInitResponse`, and `StudentsApiResponse`.
   - `src/lib/validation.ts` defines `deviceInitSchema` enforcing `min(1)` and `max(100)` on `deviceId`.
   - `src/lib/db.ts`:
     - `ensureLocalDb()` safely initializes `devices: []` when missing or not an array.
     - `registerOrGetDevice(deviceId)` checks if devices count is 0. If 0, `isFirstDevice = true` and `defaultStudentId = 'marshal'`. If > 0, `isFirstDevice = false` and `defaultStudentId = 'vaishnavi'`. Reconnecting devices update `lastSeenAt` and retain their assigned profile.
     - Supports both MongoDB collection `devices` and persistent local JSON fallback (`data/db.json`).
   - `src/app/api/devices/init/route.ts`: validates body with `deviceInitSchema`, returns RFC 7807 problem details on 400 error, returns `{ success: true, data: deviceRecord }` on 200.
   - `src/app/api/students/route.ts`: accepts `deviceId` via URL query or `x-device-id` header; resolves default student via `registerOrGetDevice`. Falls back to `marshal` if no device ID is provided.
   - `src/app/page.tsx`:
     - `getOrCreateDeviceId()` checks `localStorage.getItem('peerapply_device_id')` and cookie `peerapply_device_id`; falls back to generating a UUID (`crypto.randomUUID()`) and stores to both localStorage and a 1-year cookie (`SameSite=Lax`).
     - `fetchStudents()` checks `localStorage.getItem('peerapply_active_student_id')` first to preserve manual student switching. If absent (first visit on this device), selects `json.defaultStudentId` and persists it to localStorage.
     - `handleSelectStudent()` writes active student to `localStorage.setItem('peerapply_active_student_id', student.id)`, preserving manual selection across reloads.

2. **Empirical Execution & Verification Results**:
   An empirical verification execution against `registerOrGetDevice` and API route handlers yielded:
   - Device #1 registration (`device-emp-1`):
     - `isFirstDevice`: `true`
     - `defaultStudentId`: `'marshal'`
   - Device #2 registration (`device-emp-2`):
     - `isFirstDevice`: `false`
     - `defaultStudentId`: `'vaishnavi'`
   - Device #3 registration (`device-emp-3`):
     - `isFirstDevice`: `false`
     - `defaultStudentId`: `'vaishnavi'`
   - Device #1 re-query (`device-emp-1`):
     - `isFirstDevice`: `true`
     - `defaultStudentId`: `'marshal'` (retains original assignment)
     - `lastSeenAt`: updated to newer timestamp
   - Device #2 re-query (`device-emp-2`):
     - `isFirstDevice`: `false`
     - `defaultStudentId`: `'vaishnavi'` (retains original assignment)
   - `POST /api/devices/init` with `device-emp-1`:
     - Status: `200`
     - Body: `{ success: true, data: { deviceId: 'device-emp-1', defaultStudentId: 'marshal', isFirstDevice: true, ... } }`
   - `POST /api/devices/init` with empty `deviceId`:
     - Status: `400`
     - Body: `{ type: 'about:blank', title: 'Validation Error', status: 400, detail: 'Device ID is required' }` (RFC 7807 compliant)
   - `GET /api/students?deviceId=device-emp-1`:
     - Status: `200`
     - Body: `{ success: true, data: [...], defaultStudentId: 'marshal', isFirstDevice: true }`
   - `GET /api/students?deviceId=device-emp-2`:
     - Status: `200`
     - Body: `{ success: true, data: [...], defaultStudentId: 'vaishnavi', isFirstDevice: false }`
   - `GET /api/students` with header `x-device-id: device-emp-2`:
     - Status: `200`
     - Body: `{ success: true, data: [...], defaultStudentId: 'vaishnavi', isFirstDevice: false }`
   - `GET /api/students` without device ID:
     - Status: `200`
     - Body: `{ success: true, data: [...], defaultStudentId: 'marshal', isFirstDevice: false }`

3. **Production Build Verification**:
   - Command: `Use-Node18; npm run build`
   - Output:
     ```
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
   - Exit Code: `0` (clean build with 0 errors).

4. **Integrity & Clean State**:
   - All temporary verification files were deleted.
   - `data/db.json` was restored to its pristine condition.
   - Zero test suite files or test documentation files were committed or retained.
   - No git commits or git pushes were executed.

---

## 2. Logic Chain
1. From Observation 1 & 2:
   `registerOrGetDevice` correctly evaluates the count of registered devices. When count is 0, device #1 receives `defaultStudentId: 'marshal'` and `isFirstDevice: true`. For any subsequent device (count > 0), devices #2 and #3 receive `defaultStudentId: 'vaishnavi'` and `isFirstDevice: false`.
2. From Observation 2:
   Re-querying an existing device ID returns the existing record without overwriting `defaultStudentId` or `isFirstDevice`, ensuring device #1 permanently retains `marshal` and device #2 permanently retains `vaishnavi`.
3. From Observation 1:
   In `src/app/page.tsx`, `fetchStudents` checks `localStorage.getItem('peerapply_active_student_id')` before applying `json.defaultStudentId`. When a user manually changes profiles via the navbar switcher, `localStorage` is updated and persists across sessions, satisfying the requirement that manual switching overrides the default.
4. From Observation 2:
   Both `POST /api/devices/init` and `GET /api/students` return expected status codes and payloads, including RFC 7807 error envelopes for invalid inputs.
5. From Observation 3:
   `npm run build` succeeds cleanly under Node 18 with 0 TypeScript or linting errors across all routes and pages.

---

## 3. Caveats
- Next.js 14 requires running under Node 18/20 in this environment (`Use-Node18`). Running under Node 25 can cause Windows file rename issues during static export.
- Testing on a clean deployment requires `data/db.json` devices array to be empty (or MongoDB devices collection empty) so device #1 is assigned to Marshal.

---

## 4. Conclusion
**VERDICT: APPROVE**

Milestone 2 (Device Profile Assignment, Requirement R2) satisfies all requirements:
1. Device #1 receives `isFirstDevice: true` and `defaultStudentId: 'marshal'`.
2. Device #2 and #3 receive `isFirstDevice: false` and `defaultStudentId: 'vaishnavi'`.
3. Device #1 upon re-query idempotently retains `defaultStudentId: 'marshal'`.
4. API endpoints `POST /api/devices/init` and `GET /api/students?deviceId=...` function correctly with input validation and RFC 7807 error formatting.
5. Manual profile switching is permanently retained in client storage.
6. `npm run build` passes cleanly with exit code 0.

---

## 5. Verification Method
To reproduce this verification:
1. Run clean production build:
   ```powershell
   Use-Node18; npm run build
   ```
   Verify exit code is 0.
2. In PowerShell / Node 18, verify device registration:
   - Call `registerOrGetDevice('dev-1')` -> returns `marshal`, `isFirstDevice: true`.
   - Call `registerOrGetDevice('dev-2')` -> returns `vaishnavi`, `isFirstDevice: false`.
   - Call `registerOrGetDevice('dev-1')` -> returns `marshal`, `isFirstDevice: true`.
3. Test API endpoint:
   - Send `POST` to `/api/devices/init` with `{"deviceId": "dev-1"}` -> 200 with device data.
   - Send `GET` to `/api/students?deviceId=dev-1` -> 200 with `defaultStudentId: "marshal"`.
   - Send `GET` to `/api/students?deviceId=dev-2` -> 200 with `defaultStudentId: "vaishnavi"`.
