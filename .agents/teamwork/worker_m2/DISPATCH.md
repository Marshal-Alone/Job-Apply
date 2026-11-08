## 2026-11-08T10:36:48Z
You are a Worker agent assigned to Milestone 2: Device Profile Assignment.
Working directory: c:\Users\marsh\Downloads\Job-Apply\.agents\teamwork\worker_m2\

Read authoritative requirements and architecture:
- ORIGINAL_REQUEST.md: c:\Users\marsh\Downloads\Job-Apply\.agents\teamwork\ORIGINAL_REQUEST.md
- PROJECT.md: c:\Users\marsh\Downloads\Job-Apply\PROJECT.md
- Explorer 2 Survey Report: c:\Users\marsh\Downloads\Job-Apply\.agents\teamwork\explorer_survey_2\handoff.md

Objective:
Implement Requirement R2:
The first device that opens the deployed website must default to Marshal's profile (`marshal`), and any other / subsequent device must default to Vaishnavi's profile (`vaishnavi`). Users must retain the ability to manually switch profiles at any time.

Specific Implementation Tasks:
1. Write Ownership: You exclusively own `src/lib/types.ts`, `src/lib/validation.ts`, `src/lib/db.ts`, `src/app/api/devices/init/route.ts`, `src/app/api/students/route.ts`, and `src/app/page.tsx`.
2. In `src/lib/types.ts`:
   - Add `DeviceRecord` interface:
     ```typescript
     export interface DeviceRecord {
       deviceId: string;
       defaultStudentId: 'marshal' | 'vaishnavi';
       isFirstDevice: boolean;
       createdAt: string;
       lastSeenAt: string;
     }
     ```
   - Add `DeviceInitResponse` or related response types.
3. In `src/lib/validation.ts`:
   - Add `deviceInitSchema = z.object({ deviceId: z.string().min(1).max(100) })`.
4. In `src/lib/db.ts`:
   - Extend `LocalDb` to include `devices?: DeviceRecord[]`.
   - Implement `registerOrGetDevice(deviceId: string): Promise<DeviceRecord>`:
     - MongoDB branch:
       - Query collection `devices` for `deviceId`.
       - If exists, update `lastSeenAt` to now and return record.
       - If does NOT exist: count existing documents in `devices`. If count is 0, `isFirstDevice = true` and `defaultStudentId = 'marshal'`. If count > 0, `isFirstDevice = false` and `defaultStudentId = 'vaishnavi'`. Insert into `devices` and return.
     - Local JSON branch:
       - Read local DB. Initialize `local.devices = local.devices || []`.
       - Check if `deviceId` already exists in `local.devices`. If exists, update `lastSeenAt`, write, and return.
       - If does NOT exist: if `local.devices.length === 0`, `isFirstDevice = true` and `defaultStudentId = 'marshal'`. Else, `isFirstDevice = false` and `defaultStudentId = 'vaishnavi'`. Push `{ deviceId, defaultStudentId, isFirstDevice, createdAt: now, lastSeenAt: now }`, write to disk, and return.
5. In `src/app/api/devices/init/route.ts`:
   - Create POST route that accepts `{ deviceId }`, validates with `deviceInitSchema`, calls `registerOrGetDevice`, and returns `{ success: true, data: deviceRecord }`.
6. In `src/app/api/students/route.ts`:
   - Accept optional `deviceId` query parameter (or `x-device-id` header). If present and valid, call `registerOrGetDevice(deviceId)` and return `{ success: true, data: students, defaultStudentId: device.defaultStudentId, isFirstDevice: device.isFirstDevice }`. If not present, default cleanly.
7. In `src/app/page.tsx`:
   - Helper to get or create client persistent device ID:
     - Check `localStorage.getItem('peerapply_device_id')`. If absent, generate UUID (`crypto.randomUUID() || 'dev-' + Date.now() + '-' + Math.random().toString(36).slice(2, 9)`) and save to `localStorage.setItem('peerapply_device_id', id)` and cookie `document.cookie = 'peerapply_device_id=' + id + '; path=/; max-age=31536000'`.
   - In `fetchStudents()`:
     - Call `/api/students?deviceId=${encodeURIComponent(deviceId)}`.
     - Check `localStorage.getItem('peerapply_active_student_id')`.
     - If saved ID exists and matches a valid student: use the saved student (preserves manual switch!).
     - Else (first time on this device): use `json.defaultStudentId` (which is `'marshal'` for first device, `'vaishnavi'` for subsequent devices). Save it to `localStorage.setItem('peerapply_active_student_id', defaultStudent.id)`.
   - In `handleSelectStudent()`:
     - Update React state AND update `localStorage.setItem('peerapply_active_student_id', student.id)`.
8. Run `npm run build` using your shell tools to verify Next.js builds with zero errors.
