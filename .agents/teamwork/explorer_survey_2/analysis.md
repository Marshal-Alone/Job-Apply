# Technical Survey: Profile & Device Management (Requirement R2)

## Executive Summary
This document presents a comprehensive technical survey and architectural blueprint for **Requirement R2: First-Device / Subsequent-Device Default Profile** in PeerApply Nexus:
> *"The first device that opens the deployed website must default to Marshal's profile (`marshal`), and any other device must default to Vaishnavi's profile (`vaishnavi`). Users must retain the ability to manually switch profiles at any time."*

Currently, the application hardcodes Marshal (`marshal`) as the default fallback for all devices in `src/app/page.tsx:85`. There is no device registration or multi-device awareness on either the client or the server. This survey details the existing state, explores multiple architectural options for device identification and tracking in a deployed environment, provides an end-to-end design for server-side arbitration and client persistence, and identifies the exact components and files requiring modification.

---

## 1. Current Representation of Profiles and Students

### 1.1 Data Contracts (`src/lib/types.ts`)
Students are represented by the `Student` interface in `src/lib/types.ts:8-17`:
```typescript
export interface Student {
  id: string;
  name: string;
  email: string;
  avatar: string;
  college?: string;
  branch?: string;
  batch?: string;
  skills: string[];
}
```
Related interfaces:
- `StudentApplication` (`src/lib/types.ts:19-28`): Tracks application status per student (`studentId`, `studentName`, `studentAvatar`, `status`, `appliedAt`, `updatedAt`, `notes`, `interviewDate`).
- `Job` (`src/lib/types.ts:32-58`):
  - `postedBy: { studentId: string; studentName: string; studentAvatar?: string; }`
  - `applications: Record<string, StudentApplication>` where the dictionary keys are student IDs (e.g. `'marshal'`, `'vaishnavi'`).

### 1.2 Seed Constants and Persistence Layer (`src/lib/db.ts`)
The application defines exactly two canonical students in `INITIAL_STUDENTS` (`src/lib/db.ts:35-56`):
1. **Marshal**:
   - `id`: `'marshal'`
   - `name`: `'Marshal'`
   - `email`: `'marshal@peerapply.local'`
   - `avatar`: `'https://api.dicebear.com/7.x/bottts/svg?seed=Marshal'`
   - `branch`: `'Computer Science'`
   - `batch`: `'2025'`
2. **Vaishnavi**:
   - `id`: `'vaishnavi'`
   - `name`: `'Vaishnavi'`
   - `email`: `'vaishnavi@peerapply.local'`
   - `avatar`: `'https://api.dicebear.com/7.x/bottts/svg?seed=Vaishnavi'`
   - `branch`: `'Information Technology'`
   - `batch`: `'2025'`

These two profiles are mirrored in `data/db.json:2-39`. The database layer functions transparently with MongoDB (when `MONGODB_URI` is provided) or falls back to local file storage (`data/db.json` locally or `/tmp/peerapply-data/db.json` when running in serverless environments like Netlify/Vercel). In `src/lib/db.ts:298`, `getStudents()` explicitly restricts the student collection to only `['marshal', 'vaishnavi']`.

---

## 2. Current Student Selection, Storage, and API Interaction

### 2.1 Client-Side State & Storage (`src/app/page.tsx`)
1. **React State**:
   - `activeStudent` is held in local React state: `const [activeStudent, setActiveStudent] = useState<Student | null>(null);` (`src/app/page.tsx:23`).
2. **Initialization Flow (`fetchStudents` in `src/app/page.tsx:71-94`)**:
   - `fetch('/api/students')` retrieves the student array.
   - The client inspects `localStorage.getItem('peerapply_active_student_id')`.
   - **Current Flaw**: Line 85 contains:
     ```typescript
     const chosen = matched || json.data.find((s: Student) => s.id === 'marshal') || json.data[0];
     ```
     Because any device with a clean `localStorage` evaluates `matched` to `undefined`, every single device currently defaults to `marshal`.
   - Once chosen, `localStorage.setItem('peerapply_active_student_id', chosen.id)` writes the ID to localStorage.
3. **Manual Switching Flow (`handleSelectStudent` in `src/app/page.tsx:119-125`)**:
   ```typescript
   const handleSelectStudent = (student: Student) => {
     setActiveStudent(student);
     if (typeof window !== 'undefined') {
       localStorage.setItem('peerapply_active_student_id', student.id);
     }
     showToast(`Active applicant set to ${student.name}`, 'info');
   };
   ```
   When the user switches students in the header, `localStorage` is updated immediately. On subsequent page visits, `matched` succeeds, preserving the manual selection.

### 2.2 Backend API Requests
Currently, API requests do NOT maintain server-side sessions, cookies, or auth headers:
- `POST /api/jobs`: Submits `postedBy: { studentId: activeStudent.id, ... }` in the JSON request body.
- `POST /api/jobs/[id]/apply`: Submits `{ studentId: activeStudent.id, status: 'APPLIED', ... }` in the JSON request body.
- `GET /api/jobs` and `GET /api/students`: Return all jobs and all students without any query parameters or headers. All peer filtering and personal status resolution is computed client-side (`job.applications?.[activeStudent.id]`).

---

## 3. Architectural Design for Requirement R2 (First-Device vs Subsequent-Device)

### 3.1 The Multi-Device Problem in Deployed Environments
When the application is deployed (e.g. Netlify, Vercel, or custom server):
- Two independent devices (Device 1 = Marshal's laptop/phone, Device 2 = Vaishnavi's laptop/phone) open the site URL.
- On first visit, both devices start with completely empty `localStorage` and zero cookies.
- A client cannot know whether it is the "first" or "second" device without querying a central source of truth.
- Therefore, **the server/database must register devices and arbitrate first-device status**.

### 3.2 Evaluation of Device Identification Mechanisms

| Mechanism | Viability | Pros | Cons | Verdict |
|---|---|---|---|---|
| **IP Address Only** | ❌ Rejected | Easy to read from request headers | Fails when peers share Wi-Fi (NAT); mobile cellular IPs rotate constantly | Unreliable for classmates who study or live together |
| **User-Agent Only** | ❌ Rejected | Readily available | Not unique; two iPhones or two Chrome on Windows instances share identical User-Agents | Insufficient uniqueness |
| **Browser Fingerprinting** | ⚠️ Not Recommended | No client state required | Fragile across browser updates; blocked by privacy extensions; heavy dependency | Unnecessary complexity |
| **Client UUID + Server Registration** | ✅ **Recommended** | High entropy (UUIDv4); deterministic; zero collisions; completely private | Requires one-time client storage (`localStorage` + cookie) | **Industry Standard & Robust** |

### 3.3 Proposed Architecture: Persistent Client UUID with Dual-Tier Server Registration

#### 1. Device Identity Lifecycle
- On the client, a persistent `deviceId` is generated on initial page load if not already present:
  `deviceId = crypto.randomUUID() || ('dev-' + Date.now() + '-' + Math.random().toString(36).slice(2, 9));`
- The `deviceId` is saved to:
  1. `localStorage.getItem('peerapply_device_id')`
  2. A persistent 1-year cookie `peerapply_device_id` (so it survives across sub-contexts and can be read by server middleware if needed).

#### 2. Database Layer (`src/lib/db.ts`)
Extend the dual-tier storage (MongoDB + Local JSON) to track registered devices:
```typescript
export interface DeviceRecord {
  deviceId: string;
  defaultStudentId: 'marshal' | 'vaishnavi';
  isFirstDevice: boolean;
  createdAt: string;
  lastSeenAt: string;
  userAgent?: string;
  ip?: string;
}
```

Add database helper function `registerOrGetDevice(deviceId, meta)`:
- **MongoDB**:
  - Check if `deviceId` already exists in `devices` collection.
  - If existing, update `lastSeenAt` and return `{ defaultStudentId: doc.defaultStudentId, isFirstDevice: doc.isFirstDevice }`.
  - If not existing:
    - Count documents in `devices` collection.
    - If `count === 0`:
      - `isFirstDevice = true`, `defaultStudentId = 'marshal'`.
    - If `count > 0`:
      - `isFirstDevice = false`, `defaultStudentId = 'vaishnavi'`.
    - Insert new record `{ deviceId, defaultStudentId, isFirstDevice, createdAt: now, lastSeenAt: now, ...meta }`.
    - Return `{ defaultStudentId, isFirstDevice }`.
- **Local JSON (`data/db.json` / `/tmp/peerapply-data/db.json`)**:
  - Mirror the identical logic in `ensureLocalDb()` and `writeLocalDb()`.
  - If `local.devices` is undefined, initialize as `[]`.
  - If `local.devices.length === 0`: device #1 gets `'marshal'`.
  - If `local.devices.length > 0`: device #2+ gets `'vaishnavi'`.

#### 3. API Integration: Dedicated Route + Single-Roundtrip Header
To maintain clean separation of concerns and maximum performance:
1. **Dedicated Endpoint `POST /api/devices/init` (or `GET /api/devices/init?deviceId=...`)**:
   - Validated with Zod schema (`deviceInitSchema = z.object({ deviceId: z.string().min(1) })`).
   - Returns RFC 7807 compliant responses on error, and `{ success: true, data: { deviceId, defaultStudentId, isFirstDevice } }` on success.
   - Sets `Set-Cookie: peerapply_device_id=...` and `Set-Cookie: peerapply_default_profile=...`.
2. **Optimization on `GET /api/students`**:
   - `GET /api/students` accepts an optional `x-device-id` header or `?deviceId=...` query parameter.
   - When provided, `/api/students` automatically registers or queries the device and returns:
     ```json
     {
       "success": true,
       "data": [ ...students ],
       "defaultStudentId": "marshal" | "vaishnavi",
       "isFirstDevice": true | false
     }
     ```
   - This eliminates an extra HTTP round trip during page initialization!

#### 4. Client-Side Selection & Manual Switch Retention (`src/app/page.tsx`)
In `src/app/page.tsx`:
```
On page load:
  1. Retrieve deviceId from localStorage or create new UUID.
  2. Check localStorage for 'peerapply_active_student_id'.
  3. Call /api/students with deviceId.
  4. If localStorage has a valid studentId ('marshal' or 'vaishnavi'):
     -> Use the saved studentId (User previously selected or manually switched).
  5. Else (first visit on this device):
     -> Use defaultStudentId from server response ('marshal' on device 1, 'vaishnavi' on device 2+).
     -> Save to localStorage: localStorage.setItem('peerapply_active_student_id', defaultStudentId).
  6. When user manually clicks StudentSwitcher:
     -> handleSelectStudent updates React state AND overwrites localStorage.
     -> On subsequent reloads, step 4 matches, so the manual switch is permanently preserved.
```

---

## 4. Component Inventory & Required Modifications

### 4.1 UI Components Analysis

| Component File | Role | Changes Needed for R2 | Complexity |
|---|---|---|---|
| `src/components/StudentSwitcher.tsx` | Profile toggle button pill in navbar | **None needed**. Already takes `students`, `activeStudent`, and `onSelectStudent`. Renders buttons for each student with checkmarks and avatars. | Low (0 changes) |
| `src/components/Navbar.tsx` | Top application header | **None needed**. Passes props to `StudentSwitcher`. | Low (0 changes) |
| `src/components/JobCard.tsx` | Job display card with peer status badge | **None needed**. Lines 59-60 already compute peer dynamically: `activeStudent?.id === 'marshal' ? 'vaishnavi' : 'marshal'`. | Low (0 changes) |
| `src/components/StatsBanner.tsx` | Metric badge banner | **None needed**. Computes stats based on `activeStudent.id`. | Low (0 changes) |
| `src/components/JobModal.tsx` | Detail view and apply popup | **None needed**. Operates on `activeStudent`. | Low (0 changes) |
| `src/components/AddJobModal.tsx` | Job submission drawer | **None needed for R2**. (Will be modified for R1 auto-apply). | Low (0 changes) |

### 4.2 Application Logic & Backend Files Requiring Changes

| File | Proposed Changes |
|---|---|
| `src/lib/types.ts` | Add `DeviceRecord` and `DeviceInitResponse` types. |
| `src/lib/validation.ts` | Add `deviceInitSchema = z.object({ deviceId: z.string().min(1) })`. |
| `src/lib/db.ts` | Add `devices` collection / JSON array; implement `registerOrGetDevice(deviceId, meta)`. |
| `src/app/api/devices/init/route.ts` | New API route for explicit device registration and default profile query. |
| `src/app/api/students/route.ts` | Support `x-device-id` header / query param to return `defaultStudentId` and `isFirstDevice`. |
| `src/app/page.tsx` | Add `getOrCreateDeviceId()`, update `fetchStudents` to use server-provided `defaultStudentId` when no profile is saved in `localStorage`. |

---

## 5. Security & Edge Case Handling (VibeBreaker Compliance)

1. **Pass 01 (Untrusted Input)**:
   - Device IDs passed in API requests must be validated with Zod (string, alphanumeric + hyphens, max 100 chars). Malformed IDs must be rejected with RFC 7807 responses.
2. **Pass 03 / Pass 17 (IDOR & State Isolation)**:
   - Devices only receive a default profile recommendation. The active student identity is explicitly chosen and stored per-device. Mutations remain scoped to the student ID passed in the payload.
3. **Pass 11 (Resilience & Graceful Degradation)**:
   - If the database is unreachable or device registration fails, the API route catches errors and falls back to `'marshal'` safely rather than crashing the page.
   - If `localStorage` is disabled in the browser (private mode restrictions), in-memory state and cookies ensure graceful degradation.
4. **Race Conditions on First Connect**:
   - In MongoDB, atomic upsert or unique index on `isFirstDevice: true` guarantees only one device can ever win the first-device slot.
   - In Local JSON, Node.js single-threaded event loop with synchronous file operations guarantees deterministic serial registration.

---

## 6. Implementation Readiness & Recommendations

The architecture described above meets 100% of the acceptance criteria for Requirement R2:
- First device connecting receives `marshal`.
- Any subsequent device connecting receives `vaishnavi`.
- Both devices can manually switch profiles with 1 click in `StudentSwitcher`.
- Manual profile choice is preserved permanently in `localStorage`.
- No breaking changes to existing components or schemas.
- Dual-tier support for both MongoDB and Local JSON fallback out-of-the-box.
