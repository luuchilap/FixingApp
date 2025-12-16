# Tổng quan

Tài liệu này liệt kê toàn bộ các use case của web application kết nối người thuê và người làm việc, được phân loại theo từng nhóm người dùng (actors). Danh sách use case này có thể dùng cho:

- Phân tích yêu cầu hệ thống (SRS)
- Vẽ Use Case Diagram (UML)
- Xác định phạm vi MVP và các giai đoạn phát triển tiếp theo

# Actor: Người thuê (Người đăng việc)

## 2.1. Quản lý tài khoản

- **UC-01**: Đăng ký tài khoản người thuê
- **UC-02**: Đăng nhập / đăng xuất
- **UC-03**: Cập nhật thông tin cá nhân
- **UC-04**: Xác thực số điện thoại
- **UC-05**: Xem hồ sơ cá nhân

## 2.2. Quản lý bài đăng công việc

- **UC-06**: Tạo bài đăng công việc mới
- **UC-07**: Xem danh sách bài đăng của bản thân
- **UC-08**: Chỉnh sửa bài đăng (khi chưa có người nhận)
- **UC-09**: Xóa / hủy bài đăng (khi chưa có người nhận)
- **UC-10**: Xem chi tiết một bài đăng công việc

## 2.3. Tuyển chọn người làm việc

- **UC-11**: Xem danh sách người làm việc đã gửi yêu cầu nhận việc
- **UC-12**: Xem hồ sơ chi tiết người làm việc
- **UC-13**: Chấp nhận người làm việc
- **UC-14**: Từ chối người làm việc
- **UC-15**: Hủy người làm việc do không phản hồi sau 5 giờ

## 2.4. Thực hiện và hoàn tất công việc

- **UC-16**: Theo dõi trạng thái công việc (Chưa làm / Đang bàn giao / Đã xong)
- **UC-17**: Xác nhận công việc đã hoàn thành
- **UC-18**: Đưa công việc về trạng thái "Chưa làm" nếu không hoàn thành

## 2.5. Đánh giá và phản hồi

- **UC-19**: Đánh giá người làm việc bằng số sao
- **UC-20**: Viết nhận xét (review) cho người làm việc

## 2.6. Giao tiếp và tương tác

- **UC-21**: Nhắn tin với người làm việc
- **UC-22**: Bình luận bài đăng
- **UC-23**: Thả cảm xúc (like/react) bài đăng

## 2.7. Khiếu nại và hỗ trợ

- **UC-24**: Gửi khiếu nại đối với người làm việc
- **UC-25**: Cung cấp bằng chứng khiếu nại
- **UC-26**: Theo dõi trạng thái xử lý khiếu nại

## 2.8. Tìm kiếm và lọc

- **UC-27**: Tìm kiếm công việc đã đăng
- **UC-28**: Lọc bài đăng theo trạng thái

# Actor: Người làm việc (Người tìm việc)

## 3.1. Quản lý tài khoản

- **UC-29**: Đăng ký tài khoản người làm việc
- **UC-30**: Đăng nhập / đăng xuất
- **UC-31**: Cập nhật thông tin cá nhân
- **UC-32**: Xem hồ sơ cá nhân

## 3.2. Xác thực trình độ

- **UC-33**: Tải lên ảnh chứng chỉ hành nghề
- **UC-34**: Cập nhật / thay đổi chứng chỉ
- **UC-35**: Xem trạng thái xác thực (Đã xác thực / Chưa xác thực)

## 3.3. Tìm kiếm và nhận việc

- **UC-36**: Xem danh sách công việc đang mở
- **UC-37**: Tìm kiếm công việc theo từ khóa
- **UC-38**: Lọc công việc theo loại, mức giá, thời gian
- **UC-39**: Xem chi tiết bài đăng công việc
- **UC-40**: Gửi yêu cầu nhận việc

## 3.4. Quản lý công việc đã nhận

- **UC-41**: Theo dõi trạng thái công việc đã nhận
- **UC-42**: Nhận thông báo khi được chấp nhận hoặc từ chối
- **UC-43**: Bị hủy do không phản hồi sau 5 giờ
- **UC-44**: Tự do nhận công việc khác khi người thuê không phản hồi

## 3.5. Thực hiện công việc

- **UC-45**: Trao đổi với người thuê qua tin nhắn
- **UC-46**: Thực hiện công việc tại địa điểm đã thỏa thuận

## 3.6. Đánh giá và phản hồi

- **UC-47**: Xem đánh giá và nhận xét của người thuê
- **UC-48**: Theo dõi điểm đánh giá trung bình

## 3.7. Tương tác

- **UC-49**: Bình luận bài đăng
- **UC-50**: Thả cảm xúc (like/react) bài đăng

## 3.8. Khiếu nại và hỗ trợ

- **UC-51**: Gửi khiếu nại đối với người thuê
- **UC-52**: Cung cấp bằng chứng khiếu nại
- **UC-53**: Theo dõi trạng thái xử lý khiếu nại

# Actor: Admin quản lý

## 4.1. Quản lý người dùng

- **UC-54**: Xem danh sách người dùng
- **UC-55**: Xem chi tiết hồ sơ người dùng
- **UC-56**: Khóa / mở khóa tài khoản

## 4.2. Kiểm duyệt và xác thực

- **UC-57**: Kiểm duyệt bài đăng công việc
- **UC-58**: Từ chối / cho phép hiển thị bài đăng
- **UC-59**: Kiểm tra chứng chỉ hành nghề
- **UC-60**: Phê duyệt xác thực người làm việc
- **UC-61**: Thu hồi nhãn "Đã xác thực"

## 4.3. Quản lý công việc

- **UC-62**: Theo dõi trạng thái tất cả công việc
- **UC-63**: Can thiệp thay đổi trạng thái công việc khi cần thiết

## 4.4. Quản lý khiếu nại

- **UC-64**: Xem danh sách khiếu nại
- **UC-65**: Xem chi tiết khiếu nại và bằng chứng
- **UC-66**: Ra quyết định xử lý khiếu nại

## 4.5. Thống kê và báo cáo

- **UC-67**: Xem dashboard tổng quan
- **UC-68**: Xem thống kê số lượng công việc
- **UC-69**: Xem thống kê theo loại công việc
- **UC-70**: Xem danh sách người làm việc có số job hoàn thành cao nhất

# Use Case hệ thống (System Use Cases)

- **UC-71**: Tự động cập nhật trạng thái công việc theo thời gian
- **UC-72**: Gửi thông báo (notification) cho người dùng
- **UC-73**: Ẩn công việc đã hoàn thành khỏi trang tìm việc chung
- **UC-74**: Lưu trữ lịch sử hoạt động và lịch sử công việc
- **UC-75**: Ghi log phục vụ kiểm tra và xử lý tranh chấp

# Ghi chú

- Các use case từ **UC-01** đến **UC-75** bao phủ toàn bộ chức năng hiện tại của hệ thống
- Có thể dùng danh sách này để vẽ Use Case Diagram UML bằng cách gom các nhóm UC theo từng actor
- Trong giai đoạn MVP, có thể loại bỏ hoặc hoãn các use case nâng cao như dashboard chi tiết, react, thống kê chuyên sâu
