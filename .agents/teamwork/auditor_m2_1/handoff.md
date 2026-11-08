# Forensic Audit Report: Milestone 2 — Device Profile Assignment

**Work Product**: Milestone 2 (`src/lib/types.ts`, `src/lib/validation.ts`, `src/lib/db.ts`, `src/app/api/devices/init/route.ts`, `src/app/api/students/route.ts`, `src/app/page.tsx`)
**Profile**: General Project (Integrity Forensics)
**Verdict**: CLEAN

---

## 1. Observation

### Observation 1.1: Source Code Inspection & Genuine Logic
1. **`src/lib/types.ts` (lines 68-87)**:
   Explicit TypeScript interface contracts added for device registration and API responses:
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
2. **`src/lib/validation.ts` (lines 97-101)**:
   Input validation via Zod:
   ```typescript
   export const deviceInitSchema = z.object({
     deviceId: z.string().min(1, 'Device ID is required').max(100, 'Device ID is too long'),
   });

   export type DeviceInitInput = z.infer<typeof deviceInitSchema>;
   ```
3. **`src/lib/db.ts` (lines 343-408)**:
   Genuine counting and device profile resolution in both MongoDB and local JSON fallback:
   ```typescript
   export async function registerOrGetDevice(deviceId: string): Promise<DeviceRecord> {
     const cleanId = (deviceId || '').trim();
     const now = new Date().toISOString();

     const db = await getMongoDb();
     if (db) {
       try {
         const collection = db.collection<DeviceRecord>('devices');
         const existing = await collection.findOne({ deviceId: cleanId });
         if (existing) {
           await collection.updateOne(
             { deviceId: cleanId },
             { $set: { lastSeenAt: now } }
           );
           return {
             deviceId: existing.deviceId,
             defaultStudentId: existing.defaultStudentId,
             isFirstDevice: existing.isFirstDevice,
             createdAt: existing.createdAt,
             lastSeenAt: now,
           };
         }

         const count = await collection.countDocuments({});
         const isFirst = count === 0;
         const defaultStudentId: 'marshal' | 'vaishnavi' = isFirst ? 'marshal' : 'vaishnavi';
         const record: DeviceRecord = {
           deviceId: cleanId,
           defaultStudentId,
           isFirstDevice: isFirst,
           createdAt: now,
           lastSeenAt: now,
         };
         await collection.insertOne(record as unknown as DeviceRecord);
         return record;
       } catch (e) {
         console.warn('MongoDB device registration failed, using local DB:', e);
       }
     }

     // Local fallback
     const local = ensureLocalDb();
     if (!Array.isArray(local.devices)) {
       local.devices = [];
     }

     const existingLocal = local.devices.find((d) => d.deviceId === cleanId);
     if (existingLocal) {
       existingLocal.lastSeenAt = now;
       writeLocalDb(local);
       return existingLocal;
     }

     const isFirstLocal = local.devices.length === 0;
     const defaultStudentId: 'marshal' | 'vaishnavi' = isFirstLocal ? 'marshal' : 'vaishnavi';
     const newRecord: DeviceRecord = {
       deviceId: cleanId,
       defaultStudentId,
       isFirstDevice: isFirstLocal,
       createdAt: now,
       lastSeenAt: now,
     };
     local.devices.push(newRecord);
     writeLocalDb(local);
     return newRecord;
   }
   ```
4. **`src/app/api/devices/init/route.ts` (lines 1-24)**:
   POST endpoint with Zod validation, genuine database call, and RFC 7807 problem details:
   ```typescript
   export async function POST(req: NextRequest) {
     try {
       const body = await req.json();
       const result = deviceInitSchema.safeParse(body);

       if (!result.success) {
         return createProblemResponse(
           400,
           'Validation Error',
           result.error.errors[0]?.message || 'Invalid deviceId'
         );
       }

       const deviceRecord = await registerOrGetDevice(result.data.deviceId);
       return NextResponse.json({ success: true, data: deviceRecord });
     } catch (error) {
       console.error('Error initializing device:', error);
       return createProblemResponse(500, 'Server Error', 'Failed to register or retrieve device');
     }
   }
   ```
5. **`src/app/api/students/route.ts` (lines 16-47)**:
   GET endpoint accepting query parameter `deviceId` or header `x-device-id`, calling `registerOrGetDevice`, returning device default assignments, with RFC 7807 fallback.
6. **`src/app/page.tsx` (lines 20-45, 99-136, 161-167)**:
   - `getOrCreateDeviceId()` checks `localStorage.getItem('peerapply_device_id')`, then cookie `peerapply_device_id`, generating a UUID fallback if neither exists, and persists to both.
   - `fetchStudents()` queries `/api/students?deviceId=${encodeURIComponent(deviceId)}`.
   - Checks `localStorage.getItem('peerapply_active_student_id')` first to preserve manual student switching across page reloads.
   - On the first visit (when unselected in localStorage), selects `json.defaultStudentId` (`'marshal'` on device 1, `'vaishnavi'` on device 2+) and persists it to `localStorage`.
   - `handleSelectStudent` updates `localStorage.setItem('peerapply_active_student_id', student.id)`.

### Observation 1.2: Integrity Forensics Checks
1. **Hardcoded Test Results Check**: PASS. No hardcoded arrays, dummy test strings, or simulated PASS/FAIL values found in any source file.
2. **Facade Implementation Check**: PASS. No empty dummy functions or constant return facades (`registerOrGetDevice` executes real DB lookups, counts, insertions, and reconnection updates).
3. **Pre-Populated Artifact Detection**: PASS. No fake log files, mock test result files, or cached attestations exist in the repository.
4. **Self-Certifying Tests Check**: PASS. No internal test suites or test documentation files were created, strictly complying with user constraint R4.
5. **Execution Delegation Check**: PASS. No unauthorized third-party delegation; native Next.js, TypeScript, and MongoDB/JSON implementation.

### Observation 1.3: User Constraints Adherence
1. **No git commit or git push**: PASS. `git status` confirms:
   ```
   On branch main
   Your branch is up to date with 'origin/main'.
   Changes not staged for commit:
     modified:   data/db.json
     modified:   src/app/api/students/route.ts
     modified:   src/app/page.tsx
     modified:   src/lib/db.ts
     modified:   src/lib/types.ts
     modified:   src/lib/validation.ts
   Untracked files:
     .agents/
     PROJECT.md
     src/app/api/devices/
   ```
2. **No test suites or test documentation created**: PASS. Zero test files in `src/` or root directory.

### Observation 1.4: Static Analysis and Production Build
Command executed independently by forensic auditor:
```powershell
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
Exit code: 0. Zero errors, zero warnings.

---

## 2. Logic Chain

1. From Observation 1.1:
   In `src/lib/db.ts`, `registerOrGetDevice` implements genuine database operations. It inspects existing records first (preventing overwrite of existing device registrations upon reconnection and updating `lastSeenAt`), calculates the device count, and assigns `'marshal'` (`isFirstDevice: true`) only when count is 0, and `'vaishnavi'` (`isFirstDevice: false`) for all subsequent counts.
2. From Observation 1.1:
   In `src/app/page.tsx`, `getOrCreateDeviceId()` ensures persistent device identification across browser tabs and sessions via dual persistence in `localStorage` and a 1-year cookie.
3. From Observation 1.1:
   When `fetchStudents()` runs, `localStorage.getItem('peerapply_active_student_id')` is checked prior to evaluating any default, guaranteeing that a user's manual profile selection is never overridden by an automated default.
4. From Observation 1.1:
   If no manual profile was previously chosen, the client selects the server-provided `defaultStudentId` and immediately persists it, fulfilling Requirement R2.
5. From Observation 1.2 & 1.3:
   All forensic checks for development integrity mode pass. No test suites or test documentation files were created, and no git commits or pushes occurred, fulfilling Requirement R4 constraints.
6. From Observation 1.4:
   Independent compilation with `npm run build` confirmed type safety, route validity, and zero compilation errors across all 8 Next.js routes.

---

## 3. Caveats

No caveats. All components operate authentically with dual-tier MongoDB and persistent JSON support.

---

## 4. Conclusion

**Verdict: CLEAN**

The implementation of Milestone 2 (Device Profile Assignment, Requirement R2) is genuine, complete, robust, and free of any integrity violations, facades, or simulated responses.

---

## 5. Verification Method

To independently verify:
1. Run `npm run build` to confirm zero compilation or type errors:
   ```powershell
   npm run build
   ```
2. Verify device counting logic in `src/lib/db.ts` (`registerOrGetDevice`).
3. Check `src/app/page.tsx` (`getOrCreateDeviceId`, `fetchStudents`, `handleSelectStudent`) to confirm persistent manual switching and initial default profile assignment.
4. Check `git status` to verify that no git commits or pushes were executed.
