# Mục tiêu tài liệu

Tài liệu này liệt kê toàn bộ các API cần thiết cho giai đoạn MVP của web application kết nối người thuê và người làm việc. Danh sách API được xây dựng dựa trên:

- Use case MVP đã xác định
- Luồng nghiệp vụ end-to-end của hệ thống
- Mức tối thiểu để hệ thống vận hành ổn định

API được mô tả ở mức endpoint + chức năng, phù hợp cho việc thiết kế backend RESTful.

# Nhóm API Xác thực & Tài khoản (Auth / Account)

## 2.1. Đăng ký & đăng nhập

- `POST /api/auth/register-employer` – Đăng ký tài khoản người thuê
- `POST /api/auth/register-worker` – Đăng ký tài khoản người làm việc
- `POST /api/auth/login` – Đăng nhập
- `POST /api/auth/logout` – Đăng xuất

## 2.2. Hồ sơ người dùng

- `GET /api/users/me` – Lấy thông tin hồ sơ cá nhân
- `PUT /api/users/me` – Cập nhật thông tin cá nhân

# Nhóm API Xác thực trình độ người làm việc

- `POST /api/workers/certificates` – Tải lên ảnh chứng chỉ hành nghề
- `GET /api/workers/certificates/status` – Xem trạng thái xác thực (Chờ duyệt / Đã xác thực / Bị từ chối)

*(Admin sử dụng API ở mục 7)*

# Nhóm API Công việc (Job Post)

## 4.1. Quản lý bài đăng công việc (Người thuê)

- `POST /api/jobs` – Tạo bài đăng công việc mới
- `GET /api/jobs/my` – Xem danh sách công việc đã đăng
- `GET /api/jobs/{jobId}` – Xem chi tiết bài đăng công việc
- `PUT /api/jobs/{jobId}` – Chỉnh sửa bài đăng (khi chưa có người nhận)
- `DELETE /api/jobs/{jobId}` – Hủy / xóa bài đăng (khi chưa có người nhận)

## 4.2. Tìm kiếm công việc (Người làm việc)

- `GET /api/jobs` – Xem danh sách công việc đang mở ("Chưa làm", "Đang bàn giao")

**Query params:** `keyword`, `category`, `minPrice`, `maxPrice`

# Nhóm API Nhận việc & Trạng thái công việc

## 5.1. Nhận việc

- `POST /api/jobs/{jobId}/apply` – Người làm việc gửi yêu cầu nhận việc
- `GET /api/jobs/{jobId}/applications` – Người thuê xem danh sách người ứng tuyển

## 5.2. Duyệt người làm việc

- `POST /api/jobs/{jobId}/accept/{workerId}` – Chấp nhận người làm việc
- `POST /api/jobs/{jobId}/reject/{workerId}` – Từ chối người làm việc

## 5.3. Quản lý trạng thái công việc

- `GET /api/jobs/{jobId}/status` – Xem trạng thái công việc
- `POST /api/jobs/{jobId}/complete` – Xác nhận công việc hoàn thành
- `POST /api/jobs/{jobId}/reset` – Đưa công việc về trạng thái "Chưa làm"

# Nhóm API Đánh giá (Rating / Review)

- `POST /api/jobs/{jobId}/review` – Người thuê đánh giá người làm việc
- `GET /api/workers/{workerId}/reviews` – Xem danh sách đánh giá của người làm việc

# Nhóm API Khiếu nại (Dispute / Complaint)

- `POST /api/complaints` – Gửi khiếu nại
- `GET /api/complaints/my` – Xem danh sách khiếu nại của bản thân

# Nhóm API Admin (MVP)

## 8.1. Kiểm duyệt và xác thực

- `GET /api/admin/jobs/pending` – Xem danh sách bài đăng chờ duyệt
- `POST /api/admin/jobs/{jobId}/approve` – Duyệt bài đăng
- `POST /api/admin/jobs/{jobId}/reject` – Từ chối bài đăng
- `GET /api/admin/certificates/pending` – Xem danh sách chứng chỉ chờ duyệt
- `POST /api/admin/certificates/{certId}/approve` – Phê duyệt xác thực
- `POST /api/admin/certificates/{certId}/reject` – Từ chối xác thực

## 8.2. Xử lý khiếu nại

- `GET /api/admin/complaints` – Xem tất cả khiếu nại
- `GET /api/admin/complaints/{complaintId}` – Xem chi tiết khiếu nại
- `POST /api/admin/complaints/{complaintId}/resolve` – Ra quyết định xử lý

# Nhóm API Hệ thống (System APIs)

- `GET /api/notifications` – Lấy danh sách thông báo
- `POST /api/system/jobs/expire-handover` – Job tự động xử lý trạng thái "Đang bàn giao" quá hạn (30 ngày)

# Ghi chú kiến trúc

- Toàn bộ API tuân theo mô hình RESTful
- Authentication sử dụng JWT / Session Token
- Phân quyền theo role: Employer / Worker / Admin
- MVP chưa bắt buộc realtime (WebSocket có thể để Phase 2)

# Kết luận

Danh sách API trên là đủ và cần thiết để triển khai MVP, đảm bảo:

- Luồng nghiệp vụ đầy đủ
- Dễ mở rộng cho các giai đoạn tiếp theo
- Phù hợp cho demo, học tập và triển khai thử nghiệm
