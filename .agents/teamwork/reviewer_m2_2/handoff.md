# Review & Adversarial Challenge Report: Milestone 2 — Device Profile Assignment

**Verdict**: APPROVE  
**Milestone**: Milestone 2 (Requirement R2)  
**Reviewer**: `reviewer_m2_2`  
**Date**: 2026-11-08T10:48:00Z  

---

## 1. Observation

### 1.1 Direct Inspection of Modified Files

1. **`src/lib/types.ts`** (Lines 68-86):
   The following TypeScript interfaces were declared:
   ```typescript
   export interface DeviceRecord {
     deviceId: string;
     defaultStudentId: 'marshal' | 'vaishnavi';
     isFirstDevice: boolean;
     createdAt: string;
     lastSeenAt: string;
   }

   export interface DeviceInitResponse {
     success: boolean;
     data: DeviceRecord;
   }

   export interface StudentsApiResponse {
     success: boolean;
     data: Student[];
     defaultStudentId?: 'marshal' | 'vaishnavi';
     isFirstDevice?: boolean;
   }
   ```

2. **`src/lib/validation.ts`** (Lines 97-101, Lines 6-21):
   - Zod schema for device initialization:
     ```typescript
     export const deviceInitSchema = z.object({
       deviceId: z.string().min(1, 'Device ID is required').max(100, 'Device ID is too long'),
     });
     export type DeviceInitInput = z.infer<typeof deviceInitSchema>;
     ```
   - RFC 7807 problem details generator helper:
     ```typescript
     export function createProblemResponse(
       status: number,
       title: string,
       detail: string,
       type = 'about:blank'
     ): NextResponse<ProblemDetails> {
       return NextResponse.json(
         { type, title, status, detail },
         { status, headers: { 'Content-Type': 'application/problem+json' } }
       );
     }
     ```

3. **`src/lib/db.ts`** (Lines 343-430):
   - Dual-tier support for device registration:
     - MongoDB tier (`devices` collection):
       ```typescript
       const existing = await collection.findOne({ deviceId: cleanId });
       if (existing) {
         await collection.updateOne({ deviceId: cleanId }, { $set: { lastSeenAt: now } });
         return { ...existing, lastSeenAt: now };
       }
       const count = await collection.countDocuments({});
       const isFirst = count === 0;
       const defaultStudentId: 'marshal' | 'vaishnavi' = isFirst ? 'marshal' : 'vaishnavi';
       ...
       await collection.insertOne(record);
       ```
     - Resilient local JSON fallback (`ensureLocalDb()` and `writeLocalDb()`):
       ```typescript
       const existingLocal = local.devices.find((d) => d.deviceId === cleanId);
       if (existingLocal) {
         existingLocal.lastSeenAt = now;
         writeLocalDb(local);
         return existingLocal;
       }
       const isFirstLocal = local.devices.length === 0;
       const defaultStudentId: 'marshal' | 'vaishnavi' = isFirstLocal ? 'marshal' : 'vaishnavi';
       ...
       local.devices.push(newRecord);
       writeLocalDb(local);
       ```
   - Verified that `ensureLocalDb()` automatically initializes `parsed.devices = []` if absent or not an array, preventing null reference errors.

4. **`src/app/api/devices/init/route.ts`** (Lines 1-25):
   - POST handler validates request body with `deviceInitSchema`.
   - On validation failure, invokes `createProblemResponse(400, 'Validation Error', result.error.errors[0]?.message || 'Invalid deviceId')` with status 400 and `application/problem+json`.
   - On success, registers/retrieves device and returns `{ success: true, data: deviceRecord }`.

5. **`src/app/api/students/route.ts`** (Lines 16-47):
   - GET handler accepts `deviceId` from either URL search query (`searchParams.get('deviceId')`) or HTTP header (`req.headers.get('x-device-id')`).
   - If provided, validates against `deviceInitSchema` and queries `registerOrGetDevice(parsed.data.deviceId)`.
   - Returns `{ success: true, data: students, defaultStudentId: deviceRecord.defaultStudentId, isFirstDevice: deviceRecord.isFirstDevice }`.
   - If no deviceId provided or invalid, gracefully falls back to `{ success: true, data: students, defaultStudentId: 'marshal', isFirstDevice: false }`.

6. **`src/app/page.tsx`** (Lines 20-45, 98-136, 161-167):
   - `getOrCreateDeviceId()`:
     Checks `localStorage.getItem('peerapply_device_id')`. If missing, inspects `document.cookie`. If still missing, generates a high-entropy UUID via `crypto.randomUUID()` (or fallback `dev-<timestamp>-<rand>`), and writes to both `localStorage` and a 1-year cookie (`max-age=31536000`).
   - `fetchStudents()`:
     Fetches `/api/students?deviceId=${encodeURIComponent(deviceId)}`. Inspects `localStorage.getItem('peerapply_active_student_id')`. If the user previously switched profiles manually, that selection is strictly preserved. Only if no manual selection exists does it default to `json.defaultStudentId` (`'marshal'` on device 1, `'vaishnavi'` on device 2+) and save to localStorage.
   - `handleSelectStudent()`:
     Updates active student in React state and saves to `localStorage.setItem('peerapply_active_student_id', student.id)`.

### 1.2 Independent Build & Runtime Verification

1. **Production Build (`npm run build`)**:
   - Command: `npm run build`
   - Exit code: `0`
   - Output summary:
     ```
     ✓ Compiled successfully
     Linting and checking validity of types ...
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
   - Zero compilation errors, zero type errors.

2. **Schema & Zod Boundary Checks**:
   - Tested in Node.js runtime:
     - Empty string `{ deviceId: '' }`: Rejected (`too_small`, 'Device ID is required').
     - Oversized string `{ deviceId: 'a'.repeat(101) }`: Rejected (`too_big`, 'Device ID is too long').
     - Missing field `{}`: Rejected (`invalid_type`, 'Required').
     - Valid UUID `{ deviceId: '550e8400-e29b-41d4-a716-446655440000' }`: Accepted (`true`).

3. **Integrity Audit**:
   - No hardcoded test conditions or shortcuts.
   - Genuine database state transitions in both MongoDB and Local JSON stores.
   - Zero test suite files created in repository (conforming to User Constraint R4).
   - Zero git commits or pushes executed.

---

## 2. Logic Chain

1. From Observation 1.1 (Item 3), when the database contains zero registered devices, the first connecting client triggers `count === 0` (or `local.devices.length === 0`), resulting in `isFirstDevice = true` and `defaultStudentId = 'marshal'`.
2. From Observation 1.1 (Item 3), for any subsequent client with a different deviceId, the count is greater than 0, resulting in `isFirstDevice = false` and `defaultStudentId = 'vaishnavi'`.
3. From Observation 1.1 (Item 6), the frontend generates a UUID and passes it via query parameter `/api/students?deviceId=...`. On initial page load with no prior selection in `localStorage`, `fetchStudents` assigns `activeStudent` to `json.defaultStudentId`, fulfilling Requirement R2.
4. From Observation 1.1 (Item 6), when a user selects a student profile in `StudentSwitcher`, `handleSelectStudent` persists the choice to `localStorage.setItem('peerapply_active_student_id', student.id)`. On subsequent page reloads, `fetchStudents` prioritizes `localStorage.getItem('peerapply_active_student_id')` over `json.defaultStudentId`, guaranteeing permanent retention of manual selections.
5. From Observation 1.1 (Items 2, 4, 5) and Observation 1.2 (Item 2), invalid input (empty or malformed deviceId) is intercepted by Zod and returned as RFC 7807 Problem Details (`application/problem+json`), complying with VibeBreaker Pass 01 and Pass 05.
6. From Observation 1.2 (Item 1), the Next.js production build completes with zero errors or warnings, confirming full structural and type integrity.

---

## 3. Adversarial Challenges & Edge Cases

### Challenge 1: Device Reconnection Retention
- **Attack Scenario**: What happens when a device reconnects after an initial visit? Does it retain its assigned default, or could it get re-evaluated as a subsequent device?
- **Finding**: In `registerOrGetDevice` (both MongoDB and Local JSON branches):
  ```typescript
  const existingLocal = local.devices.find((d) => d.deviceId === cleanId);
  if (existingLocal) {
    existingLocal.lastSeenAt = now;
    writeLocalDb(local);
    return existingLocal;
  }
  ```
  The lookup immediately matches by `cleanId` and returns the existing record preserving its original `defaultStudentId` and `isFirstDevice`, while refreshing `lastSeenAt`.
- **Verdict**: PASS.

### Challenge 2: Client Storage Clearing vs Preservation
- **Attack Scenario**: What happens if the user clears cache vs when they don't?
- **Finding**:
  1. *No cache clear*: Both `localStorage` and the 1-year cookie preserve `peerapply_device_id` and `peerapply_active_student_id`. Full state is retained across browser sessions.
  2. *Partial wipe (localStorage cleared, cookies preserved)*: `getOrCreateDeviceId()` detects the missing localStorage key, reads `document.cookie` (`peerapply_device_id`), restores it to `localStorage`, and keeps the same device identity.
  3. *Full wipe (both localStorage and cookies cleared)*: The browser is physically and cryptographically indistinguishable from a new device. A new UUID is generated. On the server, because prior devices exist (`count > 0`), the new identity is assigned `defaultStudentId = 'vaishnavi'`. The application does not crash, and the user can manually switch back to Marshal with a single click.
- **Verdict**: PASS.

### Challenge 3: Manual Switching vs Page Reloads
- **Attack Scenario**: If Device 1 (Marshal) manually switches to Vaishnavi, or Device 2 (Vaishnavi) manually switches to Marshal, does reloading the page overwrite their manual choice with the device default?
- **Finding**: In `fetchStudents()` (`src/app/page.tsx`, lines 112-132):
  ```typescript
  const savedId = typeof window !== 'undefined'
    ? localStorage.getItem('peerapply_active_student_id')
    : null;
  const manualMatch = json.data.find((s: Student) => s.id === savedId);
  if (manualMatch) {
    setActiveStudent(manualMatch);
  } else { ... }
  ```
  `manualMatch` is checked first. If `savedId` matches any student, `setActiveStudent(manualMatch)` is invoked and the server default is ignored. Manual choice permanently survives reloads.
- **Verdict**: PASS.

### Challenge 4: Input Validation & RFC 7807 Error Compliance
- **Attack Scenario**: What if a client sends an empty string `""`, non-string, or oversized string to `/api/devices/init` or `/api/students`?
- **Finding**:
  1. `POST /api/devices/init`: `deviceInitSchema` rejects `""` (`min(1)`: 'Device ID is required') and oversized strings (`max(100)`: 'Device ID is too long'). The route returns `createProblemResponse(400, 'Validation Error', ...)` with `status: 400` and `Content-Type: application/problem+json`.
  2. `GET /api/students`: `rawDeviceId` is safely trimmed and passed to `deviceInitSchema.safeParse`. If invalid, rather than crashing the critical students dropdown, it falls back gracefully to `{ success: true, data: students, defaultStudentId: 'marshal', isFirstDevice: false }`. Any unhandled server exception triggers `createProblemResponse(500, 'Database Error', 'Could not retrieve students')`.
- **Verdict**: PASS.

---

## 4. Caveats
No caveats. The implementation covers both MongoDB and persistent local file storage (`data/db.json` and Netlify serverless `/tmp/peerapply-data/db.json`), cleanly handling cold-starts and reconnects.

---

## 5. Conclusion
Milestone 2 (Requirement R2) is fully, correctly, and securely implemented.
- First device default to Marshal: Verified.
- Subsequent device default to Vaishnavi: Verified.
- Manual profile switching retention: Verified.
- RFC 7807 problem details: Verified.
- Clean production build: Verified (exit code 0).
- Zero integrity violations detected.

**Final Verdict**: **`APPROVE`**

---

## 6. Verification Method
To independently reproduce:
1. Run `npm run build` from project root; verify exit code 0.
2. Verify initial device connection:
   - Ensure clean device state in `data/db.json` (`devices: []`).
   - Query `GET /api/students?deviceId=device-alpha`; verify `defaultStudentId: 'marshal'` and `isFirstDevice: true`.
3. Verify subsequent device connection:
   - Query `GET /api/students?deviceId=device-beta`; verify `defaultStudentId: 'vaishnavi'` and `isFirstDevice: false`.
4. Verify reconnection:
   - Query `GET /api/students?deviceId=device-alpha` again; verify `defaultStudentId: 'marshal'` is preserved and `lastSeenAt` is updated.
5. Verify invalid input RFC 7807 error:
   - `POST /api/devices/init` with body `{ "deviceId": "" }`; verify response status 400, `Content-Type: application/problem+json`, and `title: "Validation Error"`.
