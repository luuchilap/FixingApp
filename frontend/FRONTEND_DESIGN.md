## Frontend Product & UX Design (Inspired by Chợ Tốt)

This document defines the **frontend feature set and UX flows** for the FixingApp web application, using `[chotot.com](https://www.chotot.com/)` as a reference model and wiring every feature to the existing backend API.

---

## 1. Global Layout & Navigation

### 1.1. Header & Navigation Bar

**Goals**
- Provide a persistent shell similar to Chợ Tốt’s top bar with clear entry points for both **employers** and **workers**.
- Expose fast access to auth, posting jobs, job search, and notifications.

**UI Elements**
- **Logo & Brand**
  - FixingApp logo at top-left, navigates to home (`/`).
- **Primary Navigation (center)**
  - `Tìm việc làm` (for workers) → `/jobs`
  - `Tìm thợ sửa chữa` / `Đăng việc` (for employers) → `/jobs/new`
  - `Trang của tôi` (profile/dashboard) → `/dashboard`
- **User Actions (right)**
  - If **guest**:
    - `Đăng nhập` (opens login modal or `/login`)
    - `Đăng ký` (opens register modal or `/register`)
  - If **logged in**:
    - Avatar + name with dropdown:
      - `Hồ sơ cá nhân`
      - `Công việc của tôi` (role-aware)
      - `Đăng xuất`
  - Notification bell icon with unread badge.

**API Integration**
- On app load:
  - `GET /api/users/me`
    - **200**: store user in global state, render logged-in header with role (`EMPLOYER`, `WORKER`, `ADMIN`).
    - **401**: clear local auth state, render guest header.
- Notifications count:
  - `GET /api/notifications`
    - Use length of `notifications.filter(n => !n.read)` for badge.
    - On **401**: hide badge or show tooltip “Đăng nhập để xem thông báo”.

---

## 2. Authentication & Onboarding

### 2.1. Login & Registration Flows

**Screens / Components**
- `LoginModal` / `LoginPage`
- `RegisterEmployerModal` / `RegisterWorkerModal`

**UX Behavior**
- Tabbed or segmented UI:
  - Tab 1: `Nhà tuyển dụng` (Employer)
  - Tab 2: `Người lao động` (Worker)
- **Forms**
  - Employer registration:
    - Fields: `phone`, `password`, `fullName`, `address`
  - Worker registration:
    - Fields: `phone`, `password`, `fullName`, `address`, `skill`
  - Login (shared):
    - Fields: `phone`, `password`
- **Validation**
  - Required fields with inline error messages.
  - Basic phone format checks.
  - Password min length rules.

**API Integration**
- Employer register:
  - `POST /api/auth/register-employer`
  - On **201**:
    - Save `token` (localStorage).
    - Store returned `user` in global state.
    - Redirect to employer dashboard: `/dashboard/employer`.
  - On **400 / 500**:
    - Show `response.body.error` and optional `message` in a toast and under relevant fields.
- Worker register:
  - `POST /api/auth/register-worker` (same pattern).
- Login:
  - `POST /api/auth/login`
  - On **200**:
    - Save `token`.
    - Call `GET /api/users/me` to confirm role and hydration.
    - Route:
      - Worker → `/dashboard/worker`
      - Employer → `/dashboard/employer`
      - Admin → `/dashboard/admin`

**Global Auth Handling**
- All API calls use an HTTP client (e.g. Axios) with interceptor:
  - Attaches `Authorization: Bearer <token>`.
  - On **401**:
    - Clears token and user state.
    - Optionally shows “Phiên đăng nhập đã hết hạn” toast.
    - Redirects to `/login`.

---

## 3. Home Page & Job Discovery

### 3.1. Home Hero & Search Bar

**Goals**
- Mirror Chợ Tốt’s hero (“Giá tốt, gần bạn, chốt nhanh!”) with a fixing-job-centric tagline.
- Provide a **search + filters bar** at the top of main content.

**UI Elements**
- Tagline text: e.g. “Việc sửa chữa gần bạn, đặt thợ thật nhanh.”
- Search bar containing:
  - Keyword input: placeholder “Bạn cần thợ gì?”
  - Category / skill dropdown: Plumbing, Electrical, Carpentry, etc.
  - Location selector: “Chọn khu vực” (city & district, optional).
  - Search button: “Tìm kiếm”.

**API Integration**
- On search submit:
  - Navigate to `/jobs` with query params: `q`, `skill`, `city`, `district`, `minPrice`, `maxPrice`, `status`, `sort`.
  - Trigger:
    - `GET /api/jobs?q=...&skill=...&city=...&district=...&minPrice=...&maxPrice=...&status=CHUA_LAM&sort=createdAt_desc`
  - Show loading skeletons for job cards.
  - On success: render list (see 3.2).
  - On empty result: show “Không tìm thấy công việc phù hợp với tiêu chí của bạn”.

### 3.2. Job Feed Tabs (Dành cho bạn / Mới nhất)

**UI Behavior**
- Tabs similar to Chợ Tốt:
  - `Dành cho bạn` (personalised / skill-based).
  - `Mới nhất`.
  - `Gần bạn` (if location known).
- Job cards grid:
  - Image (optional placeholder).
  - Title.
  - Price (formatted VNĐ).
  - Location (district, city).
  - Status badge:
    - “Đang nhận đơn” (`CHUA_LAM`)
    - “Đang bàn giao” (`DANG_BAN_GIAO`)
    - “Đã hoàn thành” (completed)
  - Relative time: “18 giờ trước”.

**API Integration**
- `Dành cho bạn` (worker logged in):
  - Get worker info from `GET /api/users/me` → `skill`.
  - Request: `GET /api/jobs?skill=<worker.skill>&status=CHUA_LAM`.
- `Mới nhất`:
  - `GET /api/jobs?sort=createdAt_desc`.
- `Gần bạn`:
  - After user selects location: `GET /api/jobs?city=<city>&district=<district>`.
- Pagination:
  - Use query params `page` and `limit` (if implemented).
  - “Xem thêm” button or infinite scroll → next page request.

---

## 4. Job Detail Page

### 4.1. Job Detail Layout

**Sections**
- **Header**
  - Job title.
  - Price (large, bold).
  - Status badge.
- **Gallery**
  - Carousel for job images (or a static hero with placeholder).
- **Main info**
  - Description (full text).
  - Required skill.
  - Address.
  - Created time and (if any) handover deadline (“Hạn bàn giao: …”).
- **Employer block**
  - Employer name.
  - Basic stats: number of jobs posted, completed jobs.
  - Employer rating (if available).
- **Actions**
  - For worker:
    - `Ứng tuyển ngay` (Apply).
    - Disabled state with text if:
      - Already applied.
      - Job completed.
      - Employer is same user (403 rule).
  - For employer (owner):
    - `Chỉnh sửa công việc`.
    - `Đánh dấu hoàn thành`.
    - `Đặt lại trạng thái`.
    - `Xem danh sách ứng viên`.

**API Integration**
- Load job:
  - `GET /api/jobs/:jobId`
  - Map server fields to UI:
    - `title`, `description`, `price`, `address`, `requiredSkill`, `status`, `handoverDeadline`, `createdAt`, `acceptedWorker`.
- Applications section (employer only):
  - `GET /api/jobs/:jobId/applications` or `GET /api/applications?jobId=:jobId`
  - Show table: worker name, rating, status, apply time, actions (accept/reject).
- Worker apply:
  - `POST /api/jobs/:jobId/apply`
  - On **201**:
    - Show success toast.
    - Update UI: button → “Đã ứng tuyển”.
  - On **400/403**:
    - Display specific backend `error` message:
      - Already applied.
      - Job completed.
      - Employer cannot apply to own job.
- Employer job status:
  - `POST /api/jobs/:jobId/complete` → on success update status badge & timeline.
  - `POST /api/jobs/:jobId/reset` → revert to open state.

---

## 5. Worker Experience

### 5.1. Worker Dashboard

**Overview**
- Route: `/dashboard/worker`.
- Cards at top:
  - “Đã ứng tuyển”: count of applications.
  - “Đang bàn giao”: jobs where worker is accepted and in handover.
  - “Đã hoàn thành”: completed jobs.
  - “Đánh giá trung bình”: overall rating.

**Lists**
- `Công việc đã ứng tuyển`
  - List each application with:
    - Job title.
    - Employer name.
    - Status: Pending / Accepted / Rejected.
    - Apply date.
  - Click through to job detail.
- `Công việc đã hoàn thành`
  - Used to navigate to job/review history.

**API Integration**
- Identify worker:
  - `GET /api/users/me` → `role === 'WORKER'`.
- Applications:
  - `GET /api/applications/my` (or equivalent worker-scoped route).
- Worker’s reviews:
  - `GET /api/reviews/worker/:workerId` (from `users/me`).
  - Display average rating and count for dashboard.

### 5.2. Certificates & Verification

**UI**
- Certificate status panel on worker dashboard or separate page `/worker/certificates`:
  - Badge: `Đã xác minh` / `Chưa xác minh` based on `isVerified`.
  - List of certificates:
    - Thumbnail image.
    - Status badge: `PENDING`, `APPROVED`, `REJECTED`.
    - Reviewed time (if any).
- Upload form:
  - Upload or paste image URL of certificate.
  - Optional description field.
  - Submit button with progress indicator.

**API Integration**
- Status:
  - `GET /api/workers/certificates/status`
  - Expected response: `{ certificates: [...], isVerified: boolean }`.
- Submit:
  - `POST /api/workers/certificates`
  - On success:
    - Append new cert to list with `PENDING` status.
    - Show toast “Giấy chứng nhận đã được gửi, vui lòng chờ duyệt”.
- After admin approval:
  - Admin uses `POST /api/admin/certificates/:id/approve`.
  - Worker UI on next refresh:
    - `isVerified` set to `true`.
    - Show success banner “Tài khoản đã được xác minh”.

---

## 6. Employer Experience

### 6.1. Employer Dashboard & “Đăng việc”

**Overview**
- Route: `/dashboard/employer`.

**Dashboard widgets**
- “Công việc đang đăng”.
- “Đang bàn giao”.
- “Đã hoàn thành”.
- Quick action card “Đăng việc mới”.

**My Jobs List**
- Tabs:
  - `Tất cả`
  - `Đang đăng`
  - `Đang bàn giao`
  - `Đã hoàn thành`
- Each row/card:
  - Title.
  - Status.
  - Number of applications.
  - Last updated time.
  - Actions: `Xem chi tiết`, `Chỉnh sửa`, `Đánh dấu hoàn thành`.

**Create Job Flow (Đăng việc)**
- Route: `/jobs/new`.
- Form fields:
  - `title`
  - `description`
  - `price`
  - `address`
  - `requiredSkill`
  - Optional: upload images.
- Live preview card resembling job card in listing.

**API Integration**
- Employer verification:
  - `GET /api/users/me` → `role === 'EMPLOYER'`.
- My jobs:
  - `GET /api/jobs/my` with optional `status` filter.
- Create job:
  - `POST /api/jobs`
  - On **201**:
    - Redirect to `/jobs/:jobId`.
    - Show toast “Công việc đã được đăng”.

### 6.2. Worker Selection & Job Management

**Applications Management**
- Within job detail for employer:
  - `Danh sách ứng viên` section.
  - Rows:
    - Worker name.
    - Worker skill.
    - Worker rating (from reviews API).
    - Application time.
    - Status (pending / accepted / rejected).
    - Actions: `Chấp nhận`, `Từ chối`.

**API Integration**
- Applications for job:
  - `GET /api/jobs/:jobId/applications` (or `GET /api/applications?jobId=...`).
- Accept/reject:
  - `POST /api/applications/:applicationId/accept`
  - `POST /api/applications/:applicationId/reject`
  - On success:
    - Update application row status.
    - Update job’s `acceptedWorker` if accepted.

---

## 7. Reviews & Ratings

### 7.1. Leaving Reviews (Employer → Worker)

**UX**
- On completed job where a worker has been accepted:
  - Show `Đánh giá thợ` button visible only to employer who owns the job.
- Review modal:
  - Star rating control (1–5).
  - Textarea for comment.
  - Submit button.

**API Integration**
- Submit review:
  - `POST /api/reviews`
  - Body: `{ workerId, jobId, rating, comment }`.
  - On **201**:
    - Close modal.
    - Show toast “Cảm ơn bạn đã đánh giá”.
    - Refresh worker rating on job detail and worker profile.
  - On **400** (one review per job rule):
    - Show descriptive error “Bạn đã đánh giá công việc này rồi”.

### 7.2. Viewing Reviews (Worker Profile)

**UI**
- Worker profile page `/workers/:workerId`:
  - Overall rating (stars + numeric).
  - Review count.
  - List of reviews:
    - Employer name.
    - Rating.
    - Comment.
    - Date.

**API Integration**
- `GET /api/reviews/worker/:workerId`
  - Aggregate average rating and list of reviews.

---

## 8. Complaints & Dispute Management

### 8.1. Filing Complaints (Employer or Worker)

**Entry Points**
- From job detail: `Gửi khiếu nại`.
- From dashboards: `Khiếu nại` list.

**Complaint Form**
- Select job (pre-filled when coming from job detail).
- Select target (`Người thuê` / `Người làm`).
- Type (`Thợ không đến`, `Không thanh toán`, `Chất lượng kém`, etc.).
- Description.
- Upload evidence images (optional).

**API Integration**
- Submit complaint:
  - `POST /api/complaints`
  - On success:
    - Redirect to `/complaints/my`.
    - Show toast “Khiếu nại đã được gửi. Bộ phận hỗ trợ sẽ xem xét trong thời gian sớm nhất”.
- My complaints:
  - `GET /api/complaints/my`
  - Show status, resolution, and timestamps.

### 8.2. Admin Complaint Resolution UI

**Admin Dashboard**
- Route: `/dashboard/admin/complaints`.
- Filters:
  - Status: `PENDING`, `RESOLVED`, etc.
  - Date range.
- Complaint detail:
  - Job info.
  - Parties involved.
  - Evidence images.
  - History of status changes.

**API Integration**
- Pending complaints:
  - `GET /api/admin/complaints/pending` (or filtered complaints endpoint).
- Resolve complaint:
  - `POST /api/admin/complaints/:id/resolve`
  - On success:
    - Update list and detail view.
    - Trigger notifications to involved parties.

---

## 9. Notifications & Real-Time UX

### 9.1. Notification Center

**UI**
- Bell icon in header with unread badge.
- Dropdown:
  - Most recent notifications with:
    - Icon representing type (application, review, complaint, certificate, system).
    - Short message.
    - Time ago.
- Full page `Thông báo`:
  - Tabs: `Tất cả`, `Chưa đọc`.
  - Grouped by date.

**API Integration**
- List notifications:
  - `GET /api/notifications`
  - Render as cards or list items.
- Mark as read:
  - `POST /api/notifications/:id/read` (or similar)
  - On click:
    - Optimistically mark as read and decrease unread count.
    - If API fails, revert state and show error.

---

## 10. System Tasks & Status Indicators

### 10.1. Job Expiry / System Status

**UI**
- Job detail and job cards:
  - If status indicates expiry (e.g. from `expireHandoverJobs` job):
    - Show badge “Quá hạn bàn giao”.
    - Tooltip explaining that the job was auto-updated by the system.
- Simple system status page for debugging:
  - Fetches `/health` or `/api/system/health` (if exposed).

**API Integration**
- The frontend does **not** call `/api/system/jobs/expire-handover` in production.
  - It only reflects job `status` and `handoverDeadline` provided by other job APIs.

---

## 11. Cross-Cutting Concerns

### 11.1. HTTP Client & Error Handling

**HTTP Client**
- Centralized wrapper (e.g. Axios instance or `fetch` wrapper):
  - Adds `Authorization` header when token exists.
  - Parses JSON and handles non-2xx responses consistently.

**Error Handling Strategy**
- For known business-rule errors:
  - Display backend `error` string translated or directly (if already user-friendly).
  - Example: “Không thể ứng tuyển công việc đã hoàn thành”.
- For unknown errors:
  - Generic message: “Đã xảy ra lỗi, vui lòng thử lại sau”.
- 401 handling:
  - Global redirect to login with toast.

### 11.2. Loading & Empty States

**Loading**
- Use skeletons for:
  - Job cards on listing pages.
  - Job detail sections.
  - Dashboard widgets while fetching data.

**Empty States**
- My jobs:
  - “Bạn chưa đăng công việc nào. Bắt đầu bằng cách `Đăng việc`.”
- My applications:
  - “Bạn chưa ứng tuyển công việc nào.”
- Notifications:
  - “Chưa có thông báo mới.”
- Complaints:
  - “Bạn chưa gửi khiếu nại nào.”

---

## 12. Next Steps

1. Define the concrete frontend tech stack (e.g. Next.js + React + TailwindCSS).
2. Map each feature area above to pages and components (e.g. `/jobs`, `/jobs/[id]`, `/dashboard/*`).
3. Implement a typed API client layer that corresponds to all backend endpoints referenced here.
4. Add basic route guards and role-based frontend access using `GET /api/users/me`.

