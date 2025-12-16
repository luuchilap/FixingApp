# Nguyên tắc thiết kế

- Phục vụ MVP, nhưng đủ chuẩn để mở rộng
- Chuẩn hóa đến 3NF
- Tách rõ User – Role – Business Data
- Job có state machine rõ ràng
- Có log & lịch sử cho khiếu nại / xác thực

# Tổng quan các bảng

## Nhóm User & Auth

- `users`
- `roles`
- `user_roles`

## Nhóm Worker

- `worker_profiles`
- `worker_certificates`
- `worker_reviews`

## Nhóm Employer

- `employer_profiles`

## Nhóm Job

- `jobs`
- `job_images`
- `job_applications`
- `job_status_logs`

## Nhóm Khiếu nại & Admin

- `complaints`
- `complaint_evidences`

## Nhóm System

- `notifications`

# Chi tiết từng bảng

## 3.1. roles

| Field | Type | Note |
|-------|------|------|
| id | BIGINT PK | |
| name | VARCHAR(20) | EMPLOYER / WORKER / ADMIN |

## 3.2. users

| Field | Type | Note |
|-------|------|------|
| id | BIGINT PK | |
| phone | VARCHAR(15) | UNIQUE |
| password_hash | VARCHAR(255) | |
| full_name | VARCHAR(100) | |
| address | TEXT | |
| created_at | TIMESTAMP | |
| updated_at | TIMESTAMP | |

## 3.3. user_roles

| Field | Type | Note |
|-------|------|------|
| user_id | BIGINT FK -> users.id | |
| role_id | BIGINT FK -> roles.id | |

**Primary Key:** `(user_id, role_id)`

# Employer & Worker Profiles

## 4.1. employer_profiles

| Field | Type | Note |
|-------|------|------|
| user_id | BIGINT PK FK -> users.id | |
| activity_score | INT | Like / react |

## 4.2. worker_profiles

| Field | Type | Note |
|-------|------|------|
| user_id | BIGINT PK FK -> users.id | |
| skill | VARCHAR(100) | |
| avg_rating | DECIMAL(2,1) | Max 5.0 |
| is_verified | BOOLEAN | Chỉ true khi cert OK |

## 4.3. worker_certificates

| Field | Type | Note |
|-------|------|------|
| id | BIGINT PK | |
| worker_id | BIGINT FK -> users.id | |
| image_url | TEXT | |
| status | VARCHAR(20) | PENDING / APPROVED / REJECTED |
| reviewed_by | BIGINT FK -> users.id | Admin |
| reviewed_at | TIMESTAMP | |

# Job Domain

## 5.1. jobs

| Field | Type | Note |
|-------|------|------|
| id | BIGINT PK | |
| employer_id | BIGINT FK -> users.id | |
| title | VARCHAR(150) | |
| description | TEXT | |
| price | BIGINT | |
| address | TEXT | |
| required_skill | VARCHAR(100) | |
| status | VARCHAR(20) | CHUA_LAM / DANG_BAN_GIAO / DA_XONG |
| accepted_worker_id | BIGINT FK -> users.id | nullable |
| handover_deadline | TIMESTAMP | +30 ngày |
| created_at | TIMESTAMP | |
| updated_at | TIMESTAMP | |

## 5.2. job_images

| Field | Type | Note |
|-------|------|------|
| id | BIGINT PK | |
| job_id | BIGINT FK -> jobs.id | |
| image_url | TEXT | |
| is_primary | BOOLEAN | |

## 5.3. job_applications

| Field | Type | Note |
|-------|------|------|
| id | BIGINT PK | |
| job_id | BIGINT FK -> jobs.id | |
| worker_id | BIGINT FK -> users.id | |
| status | VARCHAR(20) | APPLIED / ACCEPTED / REJECTED |
| applied_at | TIMESTAMP | |

**Unique:** `(job_id, worker_id)`

## 5.4. job_status_logs

| Field | Type | Note |
|-------|------|------|
| id | BIGINT PK | |
| job_id | BIGINT FK -> jobs.id | |
| old_status | VARCHAR(20) | |
| new_status | VARCHAR(20) | |
| changed_by | BIGINT FK -> users.id | |
| changed_at | TIMESTAMP | |

# Review & Rating

## 6.1. worker_reviews

| Field | Type | Note |
|-------|------|------|
| id | BIGINT PK | |
| job_id | BIGINT FK -> jobs.id | |
| worker_id | BIGINT FK -> users.id | |
| employer_id | BIGINT FK -> users.id | |
| stars | INT | 1–5 |
| comment | TEXT | |
| created_at | TIMESTAMP | |

**Unique:** `(job_id)`

# Khiếu nại

## 7.1. complaints

| Field | Type | Note |
|-------|------|------|
| id | BIGINT PK | |
| job_id | BIGINT FK -> jobs.id | |
| created_by | BIGINT FK -> users.id | |
| reason | TEXT | |
| status | VARCHAR(20) | PENDING / RESOLVED |
| decision | VARCHAR(20) | ACCEPT / REJECT |
| resolved_by | BIGINT FK -> users.id | Admin |
| resolved_at | TIMESTAMP | |

## 7.2. complaint_evidences

| Field | Type | Note |
|-------|------|------|
| id | BIGINT PK | |
| complaint_id | BIGINT FK -> complaints.id | |
| evidence_type | VARCHAR(20) | IMAGE / LOG |
| evidence_url | TEXT | |

# Notifications

## 8.1. notifications

| Field | Type | Note |
|-------|------|------|
| id | BIGINT PK | |
| user_id | BIGINT FK -> users.id | |
| content | TEXT | |
| is_read | BOOLEAN | |
| created_at | TIMESTAMP | |

# Quan hệ chính (ERD mô tả)

- `users` 1–1 `employer_profiles`
- `users` 1–1 `worker_profiles`
- `users` 1–N `jobs` (employer)
- `users` 1–N `job_applications` (worker)
- `jobs` 1–N `job_images`
- `jobs` 1–N `job_status_logs`
- `jobs` 1–1 `worker_reviews`
- `jobs` 1–N `complaints`

# Đánh giá mức độ hoàn thiện

Schema này:

- Đủ để code backend ngay
- Đủ chặt để không vỡ khi scale
- Thể hiện tư duy system design thực tế, không phải bài học lý thuyết

Nếu cần, có thể:

- Chuyển sang SQL DDL (MySQL/Postgres)
- Vẽ ER Diagram bằng PlantUML
- Rà soát lại để giảm scope cho MVP siêu gọn
