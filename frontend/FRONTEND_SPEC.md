## Frontend Project Structure & API Integration Plan

This document defines:
- The **frontend project structure** (folders, pages, components, shared utilities).
- How **each backend API** is consumed in the frontend.
- The **parameters, query strings, and payloads** expected by the frontend so everything works end‑to‑end.

Assumed stack: **Next.js (App Router) + React + TypeScript + TailwindCSS**.

---

## 1. Project Structure

### 1.1. High-level layout

```text
frontend/
  package.json
  next.config.js
  tsconfig.json
  tailwind.config.js
  postcss.config.js
  src/
    app/
      layout.tsx
      page.tsx                     # Home (jobs discovery)
      login/
        page.tsx
      register/
        employer/page.tsx
        worker/page.tsx
      jobs/
        page.tsx                   # Jobs listing (search + filters)
        [id]/page.tsx              # Job detail
        new/page.tsx               # Create job (employer)
      dashboard/
        page.tsx                   # Redirect based on role
        employer/page.tsx
        worker/page.tsx
        admin/page.tsx
      profile/
        page.tsx
      notifications/
        page.tsx
      complaints/
        page.tsx                   # My complaints
      workers/
        [id]/page.tsx              # Public worker profile + reviews
      certificates/
        page.tsx                   # Worker certificate status + upload
    components/
      layout/
        Header.tsx
        Footer.tsx
        MainShell.tsx
      auth/
        LoginForm.tsx
        RegisterEmployerForm.tsx
        RegisterWorkerForm.tsx
      jobs/
        JobCard.tsx
        JobList.tsx
        JobFilters.tsx
        JobDetail.tsx
        JobApplicationsPanel.tsx
      dashboard/
        EmployerDashboard.tsx
        WorkerDashboard.tsx
        AdminDashboard.tsx
      reviews/
        ReviewList.tsx
        ReviewForm.tsx
      complaints/
        ComplaintList.tsx
        ComplaintForm.tsx
      certificates/
        CertificateList.tsx
        CertificateUploadForm.tsx
      notifications/
        NotificationsList.tsx
        NotificationBell.tsx
      common/
        Button.tsx
        Input.tsx
        Select.tsx
        Textarea.tsx
        Modal.tsx
        Tabs.tsx
        Pagination.tsx
        Skeleton.tsx
        Toast.tsx
    lib/
      api/
        http.ts                    # axios/fetch wrapper
        auth.ts
        users.ts
        jobs.ts
        applications.ts
        certificates.ts
        reviews.ts
        complaints.ts
        admin.ts
        notifications.ts
        system.ts
      types/
        auth.ts
        users.ts
        jobs.ts
        applications.ts
        certificates.ts
        reviews.ts
        complaints.ts
        notifications.ts
        system.ts
      hooks/
        useAuth.ts
        useNotifications.ts
        useJobsSearch.ts
        useToast.ts
    styles/
      globals.css
```

---

## 2. Shared API Client & Types

### 2.1. HTTP client (`lib/api/http.ts`)

Responsibilities:
- Attach `Authorization: Bearer <token>` when token is present.
- Centralized error handling for non‑2xx responses.

Pseudo‑signature:

```ts
export interface ApiError {
  status: number;
  message: string;
  error?: string;
}

export async function apiGet<T>(url: string, options?: { query?: Record<string, any>; auth?: boolean }): Promise<T>;
export async function apiPost<TReq, TRes>(url: string, body: TReq, options?: { auth?: boolean }): Promise<TRes>;
export async function apiPatch<TReq, TRes>(url: string, body: TReq, options?: { auth?: boolean }): Promise<TRes>;
export async function apiDelete<TRes>(url: string, options?: { auth?: boolean }): Promise<TRes>;
```

- `auth: true` → include JWT from `localStorage` (browser) or cookies (SSR).
- Query params serialized for `GET`.

### 2.2. Core types (examples)

```ts
// lib/types/auth.ts
export interface LoginRequest {
  phone: string;
  password: string;
}

export interface AuthUser {
  id: number;
  phone: string;
  fullName: string;
  address?: string | null;
  role: 'EMPLOYER' | 'WORKER' | 'ADMIN';
  createdAt: number;
}

export interface AuthResponse {
  token: string;
  user: AuthUser;
}

// lib/types/jobs.ts
export type JobStatus = 'CHUA_LAM' | 'DANG_BAN_GIAO' | 'DA_HOAN_THANH' | 'EXPIRED';

export interface Job {
  id: number;
  employerId: number;
  title: string;
  description: string;
  price: number;
  address: string;
  requiredSkill?: string | null;
  status: JobStatus;
  acceptedWorkerId?: number | null;
  handoverDeadline?: number | null;
  createdAt: number;
  updatedAt: number;
}
```

Types can be extended as we wire in more endpoints.

---

## 3. Auth APIs & Frontend Usage

### 3.1. Register Employer

- **Endpoint**: `POST /api/auth/register-employer`
- **Body**:

```json
{
  "phone": "string",
  "password": "string",
  "fullName": "string",
  "address": "string | null"
}
```

- **Success (201)**:

```json
{
  "token": "jwt-string",
  "user": {
    "id": 1,
    "phone": "0901234567",
    "fullName": "Nguyễn Văn A",
    "address": "HCM",
    "role": "EMPLOYER",
    "createdAt": 1734300000000
  }
}
```

- **Frontend usage**:
  - Component: `RegisterEmployerForm`.
  - On submit:
    - Call `apiPost<RegisterEmployerRequest, AuthResponse>('/api/auth/register-employer', body)`.
    - Save `token` and `user` in `useAuth` store.
    - Redirect to `/dashboard/employer`.
  - On 400/500:
    - Read `error` and `message` fields, show inline errors/toast.

### 3.2. Register Worker

- **Endpoint**: `POST /api/auth/register-worker`
- **Body**:

```json
{
  "phone": "string",
  "password": "string",
  "fullName": "string",
  "address": "string | null",
  "skill": "string"
}
```

- **Frontend usage**:
  - Component: `RegisterWorkerForm`.
  - Same pattern as employer, but redirect to `/dashboard/worker`.

### 3.3. Login

- **Endpoint**: `POST /api/auth/login`
- **Body**: `LoginRequest` (see types above).
- **Response**: `AuthResponse`.
- **Frontend usage**:
  - Component: `LoginForm`.
  - On success:
    - Save token.
    - Optionally call `GET /api/users/me` to refresh user.
    - Route by `user.role`.

### 3.4. Get Current User

- **Endpoint**: `GET /api/users/me`
- **Headers**: `Authorization: Bearer <token>`
- **Response**:

```json
{
  "id": 1,
  "phone": "0901234567",
  "fullName": "Nguyễn Văn A",
  "address": "HCM",
  "role": "EMPLOYER",
  "createdAt": 1734300000000,
  "profile": {
    // employer_profiles or worker_profiles fields
  }
}
```

- **Frontend usage**:
  - Used in `useAuth` hook to bootstrap session.
  - Used in `layout.tsx` to render header state.

### 3.5. Update Current User

- **Endpoint**: `PUT /api/users/me`
- **Body** (partial updates allowed; backend merges):

```json
{
  "fullName": "optional string",
  "address": "optional string"
}
```

- **Frontend usage**:
  - Page: `/profile`.
  - On save:
    - Update local user in `useAuth` store on success.

---

## 4. Jobs APIs & Frontend Usage

### 4.1. List Jobs (search & filters)

- **Endpoint**: `GET /api/jobs`
- **Query params**:
  - `q?: string` — search keyword (title/description).
  - `skill?: string` — required skill filter.
  - `status?: JobStatus` — job status filter.
  - `city?: string`
  - `district?: string`
  - `minPrice?: number`
  - `maxPrice?: number`
  - `sort?: 'createdAt_desc' | 'price_asc' | 'price_desc'`
  - `page?: number` (1‑based).
  - `limit?: number` (default e.g. 20).
- **Response** (example shape):

```json
{
  "items": [ /* Job[] */ ],
  "total": 120,
  "page": 1,
  "limit": 20
}
```

- **Frontend usage**:
  - Page: `/jobs`.
  - `JobFilters` comp builds query string, updates URL, triggers `GET /api/jobs`.
  - `JobList` renders results, `Pagination` uses `total`, `page`, `limit`.

### 4.2. Get Job Detail

- **Endpoint**: `GET /api/jobs/:jobId`
- **Path params**:
  - `jobId: number`
- **Response**:

```json
{
  "id": 1,
  "employerId": 10,
  "title": "Sửa chữa đường ống nước",
  "description": "Chi tiết...",
  "price": 500000,
  "address": "Quận 1, TP.HCM",
  "requiredSkill": "Plumbing",
  "status": "CHUA_LAM",
  "acceptedWorkerId": null,
  "handoverDeadline": null,
  "createdAt": 1734300000000,
  "updatedAt": 1734300000000
}
```

- **Frontend usage**:
  - Page: `/jobs/[id]` (`JobDetail` component).
  - Used to:
    - Show job info.
    - Determine which actions to show (apply, manage, complete).

### 4.3. List Employer’s Jobs

- **Endpoint**: `GET /api/jobs/my`
- **Headers**: auth required (EMPLOYER).
- **Query params** (optional):
  - `status?: JobStatus`
  - `page?: number`
  - `limit?: number`
- **Response**: same paginated structure as `GET /api/jobs`.
- **Frontend usage**:
  - `/dashboard/employer`.
  - Tabs filter by `status` and re‑request.

### 4.4. Create Job

- **Endpoint**: `POST /api/jobs`
- **Headers**: auth required (EMPLOYER).
- **Body**:

```json
{
  "title": "string",
  "description": "string",
  "price": 500000,
  "address": "string",
  "requiredSkill": "string | null"
}
```

- **Response**:

```json
{
  "id": 1,
  "title": "...",
  "status": "CHUA_LAM",
  "...": "other job fields"
}
```

- **Frontend usage**:
  - Page: `/jobs/new`.
  - On success: redirect to `/jobs/:id`.

### 4.5. Update Job

- **Endpoint**: `PUT /api/jobs/:jobId`
- **Headers**: auth (EMPLOYER owner).
- **Body**:

```json
{
  "title": "optional string",
  "description": "optional string",
  "price": 600000,
  "address": "optional string",
  "requiredSkill": "optional string"
}
```

- **Frontend usage**:
  - Edit form on job detail or `/jobs/:id/edit` if added.

### 4.6. Delete Job

- **Endpoint**: `DELETE /api/jobs/:jobId`
- **Headers**: auth (EMPLOYER owner or ADMIN).
- **Frontend usage**:
  - From employer dashboard; on success remove job from list and toast.

### 4.7. Job Status Management

- **Mark as complete**:
  - `POST /api/jobs/:jobId/complete`
  - Body: usually empty `{}`.
- **Reset status**:
  - `POST /api/jobs/:jobId/reset`
  - Body: `{}`.
- **Get current status** (if separate from detail):
  - `GET /api/jobs/:jobId/status`
  - Response: `{ "status": JobStatus, "handoverDeadline": number | null }`
- **Frontend usage**:
  - Employer view on job detail: dedicated actions.
  - After success: refetch job detail or update status locally.

---

## 5. Applications APIs & Frontend Usage

### 5.1. Apply to Job (Worker)

- **Endpoint**: `POST /api/jobs/:jobId/apply`
- **Headers**: auth (WORKER).
- **Body**:

```json
{
  "note": "optional string"
}
```

- **Response (201)**:

```json
{
  "id": 123,
  "jobId": 1,
  "workerId": 20,
  "status": "PENDING",
  "createdAt": 1734300000000
}
```

- **Frontend usage**:
  - Button `Ứng tuyển ngay` on `/jobs/[id]`.
  - On error (400/403) show backend `error` (e.g., “Không thể ứng tuyển công việc đã hoàn thành”).

### 5.2. List Applications for Current Worker

- **Endpoint**: `GET /api/applications/my`
- **Headers**: auth (WORKER).
- **Query params**:
  - `status?: 'PENDING' | 'ACCEPTED' | 'REJECTED'`
  - `page?: number`
  - `limit?: number`
- **Response**: paginated list of applications with embedded job fields.
- **Frontend usage**:
  - `/dashboard/worker` to populate “Công việc đã ứng tuyển”.

### 5.3. List Applications for a Job (Employer)

- **Endpoint**: `GET /api/jobs/:jobId/applications`  
  or  
  `GET /api/applications?jobId=:jobId`
- **Headers**: auth (EMPLOYER owner or ADMIN).
- **Response**:

```json
{
  "items": [
    {
      "id": 1,
      "jobId": 1,
      "workerId": 20,
      "status": "PENDING",
      "createdAt": 1734300000000,
      "worker": {
        "id": 20,
        "fullName": "Lê Văn C",
        "skill": "Plumbing",
        "avgRating": 4.7
      }
    }
  ]
}
```

- **Frontend usage**:
  - `JobApplicationsPanel` on job detail for employer.

### 5.4. Accept / Reject Application

- **Accept**:
  - `POST /api/applications/:applicationId/accept`
  - Body: `{}`.
- **Reject**:
  - `POST /api/applications/:applicationId/reject`
  - Body: `{}`.
- **Frontend usage**:
  - Buttons in `JobApplicationsPanel`.
  - On success:
    - Update status of that row.
    - If accepted, also update job detail’s `acceptedWorkerId`.

---

## 6. Certificates APIs & Frontend Usage

### 6.1. Worker Certificate Status

- **Endpoint**: `GET /api/workers/certificates/status`
- **Headers**: auth (WORKER).
- **Response**:

```json
{
  "isVerified": true,
  "certificates": [
    {
      "id": 1,
      "workerId": 20,
      "imageUrl": "/static/certificates/plumber-cert-001.jpg",
      "status": "APPROVED",
      "reviewedBy": 1,
      "reviewedAt": 1734300000000
    }
  ]
}
```

- **Frontend usage**:
  - `/certificates` panel.
  - Show verification badge and certificate list.

### 6.2. Submit Certificate

- **Endpoint**: `POST /api/workers/certificates`
- **Headers**: auth (WORKER).
- **Body** (assuming URL-based for MVP):

```json
{
  "imageUrl": "string"
}
```

- **Frontend usage**:
  - `CertificateUploadForm`.
  - On success:
    - Append new `PENDING` certificate to state.

### 6.3. Admin Review Certificates

- **Pending list**:
  - `GET /api/admin/certificates/pending`
- **Approve**:
  - `POST /api/admin/certificates/:id/approve`
- **Reject**:
  - `POST /api/admin/certificates/:id/reject`
- **Frontend usage**:
  - In `/dashboard/admin` for managing worker verification.

---

## 7. Reviews APIs & Frontend Usage

### 7.1. Submit Review

- **Endpoint**: `POST /api/reviews`
- **Headers**: auth (EMPLOYER who owns completed job).
- **Body**:

```json
{
  "workerId": 20,
  "jobId": 1,
  "rating": 5,
  "comment": "Làm việc rất tốt"
}
```

- **Frontend usage**:
  - `ReviewForm` opened from completed job detail.
  - On error due to business rule (one review per job), show returned `error`.

### 7.2. Get Reviews for Worker

- **Endpoint**: `GET /api/reviews/worker/:workerId`
- **Response**:

```json
{
  "workerId": 20,
  "avgRating": 4.7,
  "reviews": [
    {
      "id": 1,
      "jobId": 1,
      "employer": {
        "id": 10,
        "fullName": "Nguyễn Văn A"
      },
      "rating": 5,
      "comment": "Rất hài lòng",
      "createdAt": 1734300000000
    }
  ]
}
```

- **Frontend usage**:
  - On `/workers/[id]` and worker dashboard.

---

## 8. Complaints APIs & Frontend Usage

### 8.1. Submit Complaint

- **Endpoint**: `POST /api/complaints`
- **Headers**: auth (EMPLOYER/WORKER).
- **Body**:

```json
{
  "jobId": 1,
  "targetUserId": 20,
  "type": "NO_SHOW",
  "description": "Thợ không đến như đã hẹn",
  "evidenceUrls": ["string", "string"]
}
```

- **Frontend usage**:
  - `ComplaintForm` accessible from job detail.

### 8.2. List My Complaints

- **Endpoint**: `GET /api/complaints/my`
- **Headers**: auth.
- **Response**:

```json
{
  "items": [
    {
      "id": 1,
      "jobId": 1,
      "complainantId": 10,
      "targetUserId": 20,
      "type": "NO_SHOW",
      "status": "PENDING",
      "resolution": null,
      "createdAt": 1734300000000
    }
  ]
}
```

- **Frontend usage**:
  - `/complaints` shows history and status.

### 8.3. Admin Resolve Complaints

- **Endpoint**: `POST /api/admin/complaints/:id/resolve`
- **Headers**: auth (ADMIN).
- **Body**:

```json
{
  "status": "RESOLVED",
  "resolutionNote": "Hoàn tiền cho người thuê"
}
```

- **Frontend usage**:
  - `AdminDashboard` complaints tab.

---

## 9. Admin Job Management APIs & Frontend Usage

### 9.1. Pending Jobs / Approvals (if applicable)

If the backend exposes job approval:

- `GET /api/admin/jobs/pending`
- `POST /api/admin/jobs/:id/approve`
- `POST /api/admin/jobs/:id/reject`

Frontend:
- Admin dashboard section for reviewing job postings.

---

## 10. Notifications APIs & Frontend Usage

### 10.1. List Notifications

- **Endpoint**: `GET /api/notifications`
- **Headers**: auth.
- **Response**:

```json
{
  "notifications": [
    {
      "id": 1,
      "userId": 10,
      "type": "APPLICATION_RECEIVED",
      "title": "Bạn có ứng viên mới",
      "body": "Công việc Sửa ống nước có 1 ứng viên mới",
      "isRead": false,
      "createdAt": 1734300000000,
      "metadata": {
        "jobId": 1,
        "applicationId": 123
      }
    }
  ]
}
```

- **Frontend usage**:
  - `NotificationBell` uses `notifications.filter(n => !n.isRead).length`.
  - `/notifications` page renders full list; clicking may navigate based on `metadata`.

### 10.2. Mark Notification as Read

- **Endpoint**: `POST /api/notifications/:id/read`
- **Headers**: auth.
- **Body**: `{}`.
- **Frontend usage**:
  - On click of a notification item, call this endpoint, then navigate.

---

## 11. System & Health APIs

### 11.1. Health Check

- **Endpoint**: `GET /health`
- **Response**:

```json
{
  "status": "ok",
  "timestamp": 1734300000000
}
```

- **Frontend usage**:
  - Optional debug/status page, or used in monitoring UI.

### 11.2. System Tasks

- **Endpoint**: `POST /api/system/jobs/expire-handover`
- Public in backend but **not** used in public frontend UI in production (only via admin/tools if needed).
- Frontend mainly reflects job status as already updated by backend.

---

## 12. Routing & Guarding Strategy

- **Route guards**:
  - `useAuth` checks role and redirects:
    - Employer‑only pages: `/dashboard/employer`, `/jobs/new`, employer job management.
    - Worker‑only pages: `/dashboard/worker`, `/certificates`, application list.
    - Admin‑only pages: `/dashboard/admin`, admin complaints/certificates/jobs.
- **SSR vs CSR**:
  - Public pages (`/`, `/jobs`, `/jobs/[id]`) can use SSR or SSG + client fetch.
  - Auth‑dependent dashboards use CSR with `GET /api/users/me` on mount.

This spec should cover all current backend APIs and how the frontend will consume them, with clear parameters, query strings, and expected response shapes so we can implement a robust, type‑safe client layer. 

