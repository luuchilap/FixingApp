---
alwaysApply: true
---

# Tổng quan ý tưởng

Dự án hướng tới việc phát triển một web application kết nối người lao động với người có nhu cầu thuê làm việc theo từng công việc cụ thể. Nền tảng tập trung vào nhóm lao động phổ thông và lao động có tay nghề như: thợ sửa chữa đồ gia dụng, thợ điện, thợ nước, thợ mộc, thợ hồ, nông dân, lao động khuân vác, dọn dẹp nhà cửa, sửa xe, vận chuyển ngắn hạn, v.v.

## Mục tiêu cốt lõi của ứng dụng

- Giúp người thuê nhanh chóng tìm được người phù hợp với nhu cầu công việc
- Giúp người lao động tiếp cận nguồn việc làm ổn định, minh bạch, có lịch sử và đánh giá rõ ràng
- Giảm thiểu rủi ro lừa đảo thông qua cơ chế xác thực, đánh giá và quản lý tập trung

# Các nhóm người dùng (Actors)

Hệ thống bao gồm ba nhóm người dùng chính:

## 2.1. Người thuê (Người đăng việc)

Là các cá nhân hoặc hộ gia đình có nhu cầu thuê người thực hiện công việc cụ thể, ví dụ: sửa chữa đồ hỏng, làm nông nghiệp, vận chuyển, dọn dẹp, hoặc các công việc thời vụ khác.

## 2.2. Người làm việc (Người tìm việc)

Là những người tìm kiếm việc làm thông qua nền tảng. Họ có thể là thợ có chuyên môn hoặc lao động phổ thông, chủ động lựa chọn và nhận các công việc phù hợp với kỹ năng và điều kiện của mình.

## 2.3. Admin quản lý

Là bộ phận vận hành hệ thống, chịu trách nhiệm:

- Kiểm duyệt nội dung bài đăng
- Xác thực trình độ người làm việc
- Quản lý khiếu nại, tranh chấp
- Theo dõi thống kê và hoạt động tổng thể của nền tảng

# Thông tin người dùng trên hệ thống

## 3.1. Thông tin người thuê

Mỗi tài khoản người thuê bao gồm:

- Họ và tên
- Ngày sinh
- Địa chỉ
- Số điện thoại
- Lịch sử hoạt động (thả cảm xúc, bình luận)
- Lịch sử các bài đăng công việc

## 3.2. Thông tin người làm việc

Mỗi tài khoản người làm việc bao gồm:

- Họ và tên
- Ngày sinh
- Địa chỉ
- Số điện thoại
- Chuyên môn/kỹ năng
- Điểm đánh giá trung bình (tối đa 5 sao)
- Danh sách đánh giá và nhận xét từ người thuê
- Lịch sử hoạt động (thả cảm xúc, bình luận)
- Lịch sử các công việc đã nhận

# Cơ chế xác thực trình độ người làm việc

Để đảm bảo chất lượng dịch vụ và độ tin cậy của hệ thống, nền tảng áp dụng cơ chế xác thực trình độ đối với người làm việc.

Người làm việc cần cung cấp hình ảnh chứng chỉ hành nghề hoặc giấy tờ chuyên môn liên quan khi đăng ký hoặc cập nhật hồ sơ. Các tài liệu này sẽ được admin kiểm tra thủ công thông qua các phương pháp nghiệp vụ nội bộ nhằm xác minh tính hợp lệ.

Sau khi xác thực thành công, tài khoản người làm việc sẽ được gắn nhãn "Đã xác thực". Nhãn này giúp người thuê dễ dàng nhận diện và ưu tiên lựa chọn người làm việc có trình độ đã được kiểm chứng.

# Bài đăng công việc (Job Post)

Người thuê có thể tạo bài đăng để tìm người làm việc. Mỗi bài đăng bao gồm:

- Mô tả chi tiết công việc hoặc vấn đề cần giải quyết
- Hình ảnh minh họa (01 ảnh chính và tối đa 03 ảnh phụ)
- Địa chỉ thực hiện công việc
- Các lưu ý đặc biệt
- Yêu cầu về trình độ hoặc kỹ năng
- Mức giá thuê dự kiến

# Trạng thái công việc

Mỗi bài đăng công việc có một trong ba trạng thái sau:

1. **Chưa làm**: Công việc đang mở, người làm việc có thể gửi yêu cầu nhận việc
2. **Đang bàn giao**: Người thuê và người làm việc đã đồng ý thực hiện công việc
3. **Đã xong**: Công việc đã hoàn thành

Người làm việc chỉ có thể nhận các công việc ở trạng thái "Chưa làm" hoặc "Đang bàn giao". Các công việc "Đã xong" sẽ tự động ẩn khỏi trang tìm việc chung nhưng vẫn được lưu trong lịch sử của người dùng.

# Quy trình thực hiện công việc

Quy trình một công việc trên hệ thống diễn ra như sau:

1. Người thuê đăng bài tìm người làm việc
2. Người làm việc xem danh sách công việc và gửi yêu cầu nhận việc
3. Người thuê xem xét và chấp nhận hoặc từ chối yêu cầu
4. Khi được chấp nhận, trạng thái công việc chuyển sang "Đang bàn giao"
5. Thời gian tối đa của trạng thái "Đang bàn giao" là 30 ngày

Trong thời gian này:

- Nếu người thuê không phản hồi, người làm việc vẫn được quyền tìm và nhận công việc khác
- Nếu người làm việc không phản hồi, người thuê có quyền hủy người làm việc sau 5 giờ kể từ lần liên hệ cuối cùng

Sau khi công việc được thực hiện:

- Nếu hoàn thành thành công, trạng thái chuyển sang "Đã xong"
- Nếu không hoàn thành, trạng thái được đưa về "Chưa làm"
- Sau khi hoàn thành, người thuê thực hiện đánh giá người làm việc bằng số sao và nhận xét

# Chỉnh sửa và tương tác bài đăng

- Người thuê và người làm việc có thể chỉnh sửa bài đăng của mình (mô tả, mức giá, địa chỉ, yêu cầu, …) khi công việc chưa có người nhận
- Khi công việc đã chuyển sang trạng thái "Đang bàn giao", các thông tin sẽ không thể chỉnh sửa
- Các bài đăng cho phép bình luận và thả cảm xúc

# Nhắn tin và giao tiếp

Người thuê và người làm việc có thể nhắn tin trực tiếp với nhau trên hệ thống để trao đổi chi tiết về công việc trước và trong quá trình thực hiện.

# Chính sách hủy việc và khiếu nại

Ứng dụng được thiết kế theo định hướng ưu tiên quyền lợi của người thuê, do đó người làm việc cần chấp nhận một mức rủi ro nhất định khi nhận việc.

## Cụ thể:

- Trong trường hợp người làm việc đã đến nơi nhưng người thuê hủy công việc, người làm việc vẫn phải chấp nhận việc hủy, kể cả khi công việc đang được thực hiện dang dở
- Cả người thuê và người làm việc đều có quyền gửi khiếu nại đến hệ thống

## Bằng chứng khiếu nại có thể bao gồm:

- Lịch sử hoạt động của người khiếu nại
- Lịch sử đăng hoặc nhận công việc
- Các dữ liệu liên quan được lưu trữ trong hệ thống

Admin sẽ căn cứ vào các thông tin trên để xem xét và đưa ra quyết định xử lý phù hợp theo quy định của nền tảng.

# Tính năng tìm kiếm và lọc

Hệ thống hỗ trợ các bộ lọc nhằm giúp người dùng dễ dàng tìm kiếm công việc phù hợp:

- Loại công việc (tag)
- Thời gian đăng bài
- Mức giá thuê
- Điểm đánh giá người làm việc

# Dashboard và thống kê

Hệ thống cung cấp dashboard dành cho admin và quản lý, bao gồm:

- Tổng số công việc đã được đăng
- Tỷ lệ các loại công việc (nhiều nhất, ít nhất)
- Danh sách người làm việc có số lượng công việc hoàn thành cao nhất

Dữ liệu được trực quan hóa bằng biểu đồ tròn (pie chart) và biểu đồ cột (bar chart) nhằm hỗ trợ việc theo dõi và ra quyết định.

