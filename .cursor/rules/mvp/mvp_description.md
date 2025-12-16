# Mục tiêu tài liệu

Tài liệu này liệt kê các use case thuộc phạm vi MVP (Minimum Viable Product) của web application kết nối người thuê và người làm việc. Các use case được chọn nhằm đảm bảo:

- Hệ thống hoạt động end-to-end (đăng việc → nhận việc → hoàn thành)
- Giải quyết được bài toán cốt lõi của sản phẩm
- Tránh dư thừa chức năng trong giai đoạn đầu

# Nguyên tắc chọn use case cho MVP

Các use case MVP phải đáp ứng ít nhất một trong các tiêu chí sau:

- Bắt buộc để luồng nghiệp vụ chính vận hành
- Tác động trực tiếp đến trải nghiệm cốt lõi của người dùng
- Liên quan đến độ tin cậy và kiểm soát rủi ro của hệ thống

# Actor: Người thuê (Người đăng việc)

## 3.1. Quản lý tài khoản cơ bản

- **MVP-UC-01**: Đăng ký tài khoản người thuê
- **MVP-UC-02**: Đăng nhập / đăng xuất

## 3.2. Đăng và quản lý công việc

- **MVP-UC-03**: Tạo bài đăng công việc
- **MVP-UC-04**: Xem danh sách bài đăng của bản thân
- **MVP-UC-05**: Chỉnh sửa bài đăng (khi chưa có người nhận)
- **MVP-UC-06**: Hủy bài đăng (khi chưa có người nhận)

## 3.3. Tuyển chọn người làm việc

- **MVP-UC-07**: Xem danh sách người làm việc gửi yêu cầu nhận việc
- **MVP-UC-08**: Xem hồ sơ người làm việc
- **MVP-UC-09**: Chấp nhận người làm việc
- **MVP-UC-10**: Từ chối người làm việc

## 3.4. Hoàn tất công việc

- **MVP-UC-11**: Xác nhận công việc hoàn thành
- **MVP-UC-12**: Đưa công việc về trạng thái "Chưa làm" nếu không hoàn thành

## 3.5. Đánh giá

- **MVP-UC-13**: Đánh giá người làm việc (số sao + nhận xét)

# Actor: Người làm việc (Người tìm việc)

## 4.1. Quản lý tài khoản cơ bản

- **MVP-UC-14**: Đăng ký tài khoản người làm việc
- **MVP-UC-15**: Đăng nhập / đăng xuất

## 4.2. Xác thực trình độ

- **MVP-UC-16**: Tải lên ảnh chứng chỉ hành nghề
- **MVP-UC-17**: Xem trạng thái xác thực (Đã xác thực / Chưa xác thực)

## 4.3. Tìm và nhận việc

- **MVP-UC-18**: Xem danh sách công việc đang mở
- **MVP-UC-19**: Xem chi tiết bài đăng công việc
- **MVP-UC-20**: Gửi yêu cầu nhận việc

## 4.4. Quản lý công việc đã nhận

- **MVP-UC-21**: Theo dõi trạng thái công việc đã nhận
- **MVP-UC-22**: Nhận thông báo được chấp nhận hoặc bị từ chối

# Actor: Admin quản lý

## 5.1. Kiểm duyệt và xác thực

- **MVP-UC-23**: Kiểm duyệt bài đăng công việc
- **MVP-UC-24**: Kiểm tra chứng chỉ hành nghề
- **MVP-UC-25**: Phê duyệt / từ chối xác thực người làm việc

## 5.2. Quản lý công việc

- **MVP-UC-26**: Theo dõi trạng thái các công việc
- **MVP-UC-27**: Can thiệp thay đổi trạng thái công việc khi cần

## 5.3. Xử lý khiếu nại

- **MVP-UC-28**: Tiếp nhận khiếu nại
- **MVP-UC-29**: Xem lịch sử hoạt động liên quan đến khiếu nại
- **MVP-UC-30**: Ra quyết định xử lý khiếu nại

# Use Case hệ thống (bắt buộc cho MVP)

- **MVP-UC-31**: Quản lý trạng thái công việc (Chưa làm / Đang bàn giao / Đã xong)
- **MVP-UC-32**: Tự động ẩn công việc "Đã xong" khỏi danh sách tìm việc
- **MVP-UC-33**: Lưu trữ lịch sử công việc và đánh giá

# Những use case KHÔNG thuộc MVP (để Phase 2)

Các chức năng sau không bắt buộc cho MVP và có thể triển khai sau:

- Thả cảm xúc (like / react)
- Bình luận bài đăng
- Dashboard thống kê nâng cao
- Bộ lọc nâng cao (theo sao, theo bán kính)
- Chat thời gian thực (có thể thay bằng thông tin liên hệ cơ bản trong MVP)

# Kết luận

Danh sách use case MVP trên đảm bảo:

- Sản phẩm chạy được luồng nghiệp vụ chính
- Giữ phạm vi gọn, dễ triển khai
- Phù hợp cho demo, nộp bài học phần hoặc phát triển sản phẩm thử nghiệm
