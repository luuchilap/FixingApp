/**
 * Seed app guides data
 */
require('dotenv').config({ path: require('path').join(__dirname, '..', '..', '.env') });
const db = require('../config/db');

const guides = [
  {
    title: 'Cách đăng ký tài khoản',
    summary: 'Hướng dẫn từng bước tạo tài khoản mới trên FixingApp cho chủ nhà và thợ.',
    content: `## Đăng ký tài khoản FixingApp

### Bước 1: Tải ứng dụng
Tải FixingApp từ App Store (iOS) hoặc Google Play (Android).

### Bước 2: Chọn vai trò
Khi mở app lần đầu, bạn sẽ được hỏi:
- **Chủ nhà (Employer)**: Đăng tin tìm thợ
- **Thợ (Worker)**: Nhận việc và làm việc

### Bước 3: Nhập số điện thoại
- Nhập số điện thoại Việt Nam (10 số)
- Số điện thoại dùng để đăng nhập sau này

### Bước 4: Tạo mật khẩu
- Mật khẩu ít nhất 6 ký tự
- Nên dùng kết hợp chữ và số

### Bước 5: Điền thông tin cá nhân
- Họ và tên đầy đủ
- Địa chỉ (để tìm việc/thợ gần bạn)
- Nếu là thợ: chọn kỹ năng chuyên môn

### Lưu ý
- Mỗi số điện thoại chỉ đăng ký được 1 tài khoản
- Thông tin có thể cập nhật sau trong mục Hồ sơ`,
    category: 'ACCOUNT',
    iconName: 'person.badge.plus',
    sortOrder: 1
  },
  {
    title: 'Cách đăng tin tìm thợ',
    summary: 'Hướng dẫn chủ nhà tạo và đăng tin công việc để tìm thợ phù hợp.',
    content: `## Đăng tin tìm thợ

### Bước 1: Vào trang chủ
Từ tab "Trang chủ", nhấn vào loại dịch vụ bạn cần (Thợ điện, Thợ nước, v.v.)

### Bước 2: Điền thông tin công việc
- **Tiêu đề**: Mô tả ngắn gọn (VD: "Sửa ống nước bị rò rỉ")
- **Mô tả chi tiết**: Càng chi tiết càng tốt
- **Giá đề xuất**: Mức giá bạn sẵn sàng trả
- **Địa chỉ**: Nơi cần thợ đến làm
- **Thời gian**: Ngày giờ mong muốn

### Bước 3: Đăng tin
Nhấn nút "Đăng tin" để hoàn tất.

### Bước 4: Chờ thợ ứng tuyển
- Bạn sẽ nhận thông báo khi có thợ ứng tuyển
- Xem hồ sơ, đánh giá của thợ
- Chọn thợ phù hợp nhất

### Mẹo đăng tin hiệu quả
- Chụp ảnh hiện trạng nếu có thể
- Đặt giá hợp lý theo thị trường
- Mô tả rõ ràng vấn đề cần sửa`,
    category: 'EMPLOYER',
    iconName: 'doc.badge.plus',
    sortOrder: 2
  },
  {
    title: 'Cách ứng tuyển và nhận việc',
    summary: 'Hướng dẫn thợ tìm kiếm, ứng tuyển và bắt đầu nhận việc trên app.',
    content: `## Ứng tuyển và nhận việc

### Tìm việc phù hợp
1. Vào tab **"Việc làm"** để xem danh sách
2. Lọc theo kỹ năng, khu vực, mức giá
3. Nhấn vào tin để xem chi tiết

### Ứng tuyển
1. Nhấn nút **"Ứng tuyển"** trên tin việc
2. Viết giới thiệu ngắn về bản thân
3. Đề xuất giá (nếu muốn thương lượng)
4. Chờ chủ nhà duyệt

### Khi được chọn
- Bạn nhận thông báo "Đã được chọn"
- Liên hệ chủ nhà qua tin nhắn trong app
- Xác nhận thời gian và địa điểm

### Hoàn thành công việc
1. Đến đúng địa điểm, đúng giờ
2. Hoàn thành công việc
3. Nhấn **"Bàn giao"** khi xong
4. Chủ nhà xác nhận hoàn thành
5. Nhận đánh giá và thanh toán

### Mẹo nhận nhiều việc
- Cập nhật hồ sơ đầy đủ
- Phản hồi nhanh
- Giữ đánh giá tốt`,
    category: 'WORKER',
    iconName: 'hammer.fill',
    sortOrder: 3
  },
  {
    title: 'Quản lý hồ sơ cá nhân',
    summary: 'Cách cập nhật thông tin, ảnh đại diện, xác minh danh tính trên FixingApp.',
    content: `## Quản lý hồ sơ cá nhân

### Cập nhật thông tin
1. Vào tab **"Hồ sơ"**
2. Nhấn vào thông tin muốn thay đổi:
   - Họ và tên
   - Địa chỉ
   - Kỹ năng (đối với thợ)

### Thay đổi ảnh đại diện
1. Nhấn vào ảnh đại diện trên trang Hồ sơ
2. Chọn ảnh từ thư viện hoặc chụp mới
3. Ảnh sẽ được cập nhật tự động

### Xác minh danh tính
Để tăng độ tin cậy, hãy xác minh tài khoản:
1. Vào mục **"Xác minh danh tính"** trong Hồ sơ
2. Chụp ảnh CMND/CCCD mặt trước
3. Tải lên và chờ admin duyệt
4. Khi được duyệt, hồ sơ hiển thị dấu ✓ xanh

### Đổi giao diện
FixingApp hỗ trợ nhiều theme:
- 🐝 **Bumblebee**: Phong cách sáng, năng động
- 🌙 **Nightshift**: Giao diện tối
- 🔧 **Industrial**: Phong cách công nghiệp

Vào Hồ sơ > chọn theme yêu thích`,
    category: 'PROFILE',
    iconName: 'person.text.rectangle',
    sortOrder: 4
  },
  {
    title: 'Hệ thống đánh giá và nhận xét',
    summary: 'Tìm hiểu cách đánh giá, xem nhận xét và tầm quan trọng của đánh giá.',
    content: `## Hệ thống đánh giá

### Đánh giá sau công việc
Sau khi công việc hoàn thành, cả hai bên đều có thể đánh giá:
- ⭐ **1 sao**: Rất không hài lòng
- ⭐⭐ **2 sao**: Không hài lòng
- ⭐⭐⭐ **3 sao**: Bình thường
- ⭐⭐⭐⭐ **4 sao**: Hài lòng
- ⭐⭐⭐⭐⭐ **5 sao**: Rất hài lòng

### Viết nhận xét
- Mô tả trải nghiệm thực tế
- Đánh giá khách quan, trung thực
- Không sử dụng ngôn từ thiếu văn hóa

### Xem đánh giá
- Đánh giá hiển thị trên hồ sơ công khai
- Điểm trung bình tính từ tất cả đánh giá
- Chủ nhà có thể xem đánh giá trước khi chọn thợ

### Tại sao đánh giá quan trọng?
- Thợ có đánh giá cao → được chọn nhiều hơn
- Chủ nhà uy tín → thu hút thợ giỏi
- Giúp cộng đồng minh bạch, đáng tin`,
    category: 'FEATURE',
    iconName: 'star.bubble',
    sortOrder: 5
  },
  {
    title: 'Tin nhắn và liên lạc',
    summary: 'Cách sử dụng tính năng nhắn tin trong app để liên lạc giữa chủ nhà và thợ.',
    content: `## Tin nhắn trong FixingApp

### Khi nào có thể nhắn tin?
Bạn có thể nhắn tin khi:
- Thợ đã ứng tuyển vào tin của bạn
- Hoặc bạn đã được chủ nhà chọn

### Cách gửi tin nhắn
1. Vào mục **"Thông báo"** > **"Tin nhắn"**
2. Chọn cuộc trò chuyện
3. Nhập và gửi tin nhắn

### Những gì nên trao đổi
- Xác nhận thời gian đến
- Hỏi chi tiết về công việc
- Thông báo nếu đến trễ
- Báo giá vật tư (nếu cần)

### Lưu ý
- Tin nhắn được lưu lại trong app
- Không chia sẻ thông tin cá nhân nhạy cảm
- Sử dụng ngôn từ lịch sự, chuyên nghiệp
- Phản hồi tin nhắn càng sớm càng tốt`,
    category: 'FEATURE',
    iconName: 'message.fill',
    sortOrder: 6
  },
  {
    title: 'Khiếu nại và hỗ trợ',
    summary: 'Cách gửi khiếu nại khi gặp vấn đề và liên hệ bộ phận hỗ trợ.',
    content: `## Khiếu nại và hỗ trợ

### Khi nào nên khiếu nại?
- Thợ không đến đúng hẹn
- Chất lượng công việc không đạt
- Giá thực tế khác với thỏa thuận
- Thái độ không chuyên nghiệp
- Chủ nhà không thanh toán

### Cách gửi khiếu nại
1. Vào chi tiết công việc liên quan
2. Nhấn **"Khiếu nại"**
3. Chọn lý do khiếu nại
4. Mô tả chi tiết vấn đề
5. Đính kèm hình ảnh (nếu có)
6. Gửi và chờ admin xử lý

### Quy trình xử lý
- Admin xem xét trong vòng 24-48 giờ
- Có thể liên hệ cả hai bên
- Đưa ra phương án giải quyết
- Thông báo kết quả qua app

### Liên hệ hỗ trợ
- Qua mục "Hồ sơ" > "Hỗ trợ"
- Email: support@fixingapp.vn
- Hotline: 1900-xxxx`,
    category: 'SUPPORT',
    iconName: 'exclamationmark.bubble',
    sortOrder: 7
  },
  {
    title: 'Mẹo sử dụng app hiệu quả',
    summary: 'Các mẹo và thủ thuật giúp bạn tận dụng tối đa các tính năng của FixingApp.',
    content: `## Mẹo sử dụng FixingApp

### Cho chủ nhà
1. **Đăng tin rõ ràng**: Mô tả chi tiết + ảnh = nhiều thợ ứng tuyển hơn
2. **Kiểm tra hồ sơ thợ**: Xem đánh giá, kinh nghiệm trước khi chọn
3. **Đặt giá hợp lý**: Tham khảo giá thị trường
4. **Phản hồi nhanh**: Thợ giỏi thường bận, trả lời sớm để không mất cơ hội

### Cho thợ
1. **Hoàn thiện hồ sơ**: Ảnh đại diện + xác minh = tăng độ tin cậy
2. **Ứng tuyển sớm**: Việc mới đăng thường ít cạnh tranh
3. **Giữ đánh giá 5 sao**: Đến đúng giờ, làm chất lượng, thái độ tốt
4. **Bật thông báo**: Không bỏ lỡ việc mới phù hợp

### Chung
- 📱 **Bật thông báo** để không bỏ lỡ tin nhắn
- 📍 **Cập nhật địa chỉ** để tìm việc/thợ gần nhất
- 🔐 **Bảo mật tài khoản**: Không chia sẻ mật khẩu
- 🔄 **Cập nhật app** thường xuyên để có tính năng mới`,
    category: 'TIPS',
    iconName: 'lightbulb.fill',
    sortOrder: 8
  }
];

async function seedGuides() {
  console.log('🌱 Seeding app guides...\n');
  
  const now = Date.now();
  
  for (const guide of guides) {
    const viewCount = Math.floor(Math.random() * 200) + 5;
    
    await db.query(
      `INSERT INTO app_guides (title, summary, content, category, icon_name, sort_order, is_published, view_count, created_at, updated_at)
       VALUES ($1, $2, $3, $4, $5, $6, TRUE, $7, $8, $9)`,
      [guide.title, guide.summary, guide.content, guide.category, guide.iconName, guide.sortOrder, viewCount, now, now]
    );
    
    console.log(`  ✓ ${guide.title}`);
  }
  
  console.log('\n✅ All app guides seeded successfully!');
  await db.pool.end();
}

seedGuides().catch(err => {
  console.error('Error:', err);
  process.exit(1);
});
