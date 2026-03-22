/**
 * Database seed script
 * Populates the database with sample data for testing
 */

require('dotenv').config();
const db = require('../config/db');
const bcrypt = require('bcryptjs');

// Sample data
const sampleEmployers = [
  {
    phone: '0901234567',
    password: 'password123',
    fullName: 'Nguyễn Văn A',
    address: '123 Đường ABC, Quận 1, TP.HCM',
    role: 'EMPLOYER'
  },
  {
    phone: '0902345678',
    password: 'password123',
    fullName: 'Trần Thị B',
    address: '456 Đường XYZ, Quận 2, TP.HCM',
    role: 'EMPLOYER'
  }
];

const sampleWorkers = [
  {
    phone: '0913456789',
    password: 'password123',
    fullName: 'Lê Văn C',
    address: '789 Đường DEF, Quận 3, TP.HCM',
    role: 'WORKER',
    skill: 'PLUMBING'
  },
  {
    phone: '0914567890',
    password: 'password123',
    fullName: 'Phạm Thị D',
    address: '321 Đường GHI, Quận 4, TP.HCM',
    role: 'WORKER',
    skill: 'ELECTRICAL'
  },
  {
    phone: '0915678901',
    password: 'password123',
    fullName: 'Hoàng Văn E',
    address: '654 Đường JKL, Quận 5, TP.HCM',
    role: 'WORKER',
    skill: 'CARPENTRY'
  },
  {
    phone: '0916789012',
    password: 'password123',
    fullName: 'Nguyễn Thị F',
    address: '987 Đường MNO, Quận 6, TP.HCM',
    role: 'WORKER',
    skill: 'PAINTING'
  },
  {
    phone: '0917890123',
    password: 'password123',
    fullName: 'Trần Văn G',
    address: '654 Đường PQR, Quận 7, TP.HCM',
    role: 'WORKER',
    skill: 'AC_REPAIR'
  }
];

const sampleAdmins = [
  {
    phone: '0999999999',
    password: 'admin123',
    fullName: 'Admin User',
    address: 'Admin Office',
    role: 'ADMIN'
  }
];

const sampleJobs = [
  {
    employerPhone: '0901234567',
    title: 'Sửa chữa đường ống nước bị rò rỉ',
    description: 'Cần thợ sửa chữa đường ống nước trong nhà bị rò rỉ. Công việc cần hoàn thành trong 2 ngày.',
    price: 500000,
    address: '123 Đường ABC, Quận 1, TP.HCM',
    requiredSkill: 'PLUMBING',
    status: 'CHUA_LAM'
  },
  {
    employerPhone: '0901234567',
    title: 'Lắp đặt hệ thống điện mới',
    description: 'Cần thợ điện lắp đặt hệ thống điện cho căn hộ mới. Diện tích 80m2.',
    price: 3000000,
    address: '123 Đường ABC, Quận 1, TP.HCM',
    requiredSkill: 'ELECTRICAL',
    status: 'CHUA_LAM'
  },
  {
    employerPhone: '0902345678',
    title: 'Đóng tủ bếp gỗ',
    description: 'Cần thợ mộc đóng tủ bếp gỗ theo thiết kế. Kích thước 3m x 0.6m.',
    price: 8000000,
    address: '456 Đường XYZ, Quận 2, TP.HCM',
    requiredSkill: 'CARPENTRY',
    status: 'CHUA_LAM'
  },
  {
    employerPhone: '0902345678',
    title: 'Sửa chữa vòi nước bị hỏng',
    description: 'Vòi nước trong phòng tắm bị hỏng, cần thay mới.',
    price: 300000,
    address: '456 Đường XYZ, Quận 2, TP.HCM',
    requiredSkill: 'PLUMBING',
    status: 'DANG_BAN_GIAO'
  },
  {
    employerPhone: '0901234567',
    title: 'Sơn lại tường phòng khách',
    description: 'Cần thợ sơn lại tường phòng khách, diện tích 30m2.',
    price: 2000000,
    address: '123 Đường ABC, Quận 1, TP.HCM',
    requiredSkill: 'PAINTING',
    status: 'CHUA_LAM'
  },
  {
    employerPhone: '0902345678',
    title: 'Sửa máy lạnh không lạnh',
    description: 'Máy lạnh trong phòng ngủ không lạnh, cần kiểm tra và sửa chữa.',
    price: 1500000,
    address: '456 Đường XYZ, Quận 2, TP.HCM',
    requiredSkill: 'AC_REPAIR',
    status: 'CHUA_LAM'
  }
];

const sampleCertificates = [
  {
    workerPhone: '0913456789',
    imageUrl: '/static/certificates/plumber-cert-001.jpg',
    status: 'APPROVED'
  },
  {
    workerPhone: '0914567890',
    imageUrl: '/static/certificates/electrician-cert-001.jpg',
    status: 'PENDING'
  }
];

const sampleKnowledgeArticles = [
  {
    title: '10 mẹo dọn dẹp nhà cửa nhanh chóng và hiệu quả',
    summary: 'Những mẹo đơn giản giúp bạn dọn dẹp nhà cửa sạch sẽ chỉ trong 30 phút mỗi ngày.',
    content: `## 10 mẹo dọn dẹp nhà cửa nhanh chóng\n\n### 1. Dọn theo từng phòng\nThay vì dọn cả nhà cùng lúc, hãy chia nhỏ công việc theo từng phòng. Bắt đầu từ phòng quan trọng nhất.\n\n### 2. Quy tắc 2 phút\nNếu việc gì mất dưới 2 phút, hãy làm ngay. Rửa chén sau khi ăn, lau bàn sau khi dùng.\n\n### 3. Sử dụng giấm trắng\nGiấm trắng là chất tẩy rửa tự nhiên tuyệt vời. Pha loãng với nước để lau kính, bồn rửa.\n\n### 4. Dọn dẹp từ trên xuống dưới\nBắt đầu từ trần nhà, quạt trần, rồi xuống bàn ghế, cuối cùng là sàn nhà.\n\n### 5. Phân loại đồ đạc\nChia đồ thành 3 nhóm: giữ lại, cho đi, vứt bỏ. Giảm đồ đạc = giảm dọn dẹp.\n\n### 6. Lịch dọn dẹp hàng tuần\nMỗi ngày dọn 1 khu vực nhỏ thay vì dọn tổng thể cuối tuần.\n\n### 7. Sử dụng hộp đựng\nĐầu tư vào các hộp đựng đồ giúp nhà cửa gọn gàng hơn.\n\n### 8. Làm sạch bồn cầu bằng coca\nĐổ coca vào bồn cầu, để 30 phút rồi chà sạch.\n\n### 9. Giặt ga giường định kỳ\nGiặt ga giường mỗi tuần để tránh vi khuẩn và mạt bụi.\n\n### 10. Thông thoáng nhà cửa\nMở cửa sổ 15-30 phút mỗi ngày để không khí lưu thông.`,
    category: 'CLEANING',
    authorName: 'Admin'
  },
  {
    title: 'Cách xử lý khi ổ điện bị chập cháy tại nhà',
    summary: 'Hướng dẫn an toàn khi gặp sự cố chập cháy điện và cách phòng tránh hiệu quả.',
    content: `## Xử lý sự cố chập cháy điện\n\n### Dấu hiệu nhận biết\n- Ổ điện nóng bất thường\n- Có mùi khét hoặc khói\n- Đèn nhấp nháy liên tục\n- Aptomat tự ngắt nhiều lần\n\n### Cách xử lý khẩn cấp\n1. **Ngắt aptomat tổng** ngay lập tức\n2. **Không chạm vào ổ điện** bằng tay trần\n3. Sử dụng bình chữa cháy CO2 nếu có lửa\n4. Gọi thợ điện chuyên nghiệp\n\n### Phòng tránh\n- Không cắm quá nhiều thiết bị vào một ổ điện\n- Kiểm tra dây điện định kỳ\n- Sử dụng ổ cắm có công tắc\n- Lắp aptomat chống giật (ELCB)\n\n### Khi nào cần gọi thợ?\n- Ổ điện bị đen, cháy xém\n- Dây điện cũ, bong tróc vỏ\n- Aptomat tự ngắt liên tục\n- Muốn lắp thêm ổ cắm mới`,
    category: 'ELECTRICAL',
    authorName: 'Admin'
  },
  {
    title: 'Hướng dẫn tự sửa vòi nước bị rò rỉ đơn giản',
    summary: 'Cách khắc phục vòi nước nhỏ giọt tại nhà mà không cần gọi thợ.',
    content: `## Tự sửa vòi nước rò rỉ\n\n### Nguyên nhân phổ biến\n- Gioăng cao su bị mòn\n- Van nước bị lỏng\n- Đầu vòi bị tắc cặn\n\n### Dụng cụ cần thiết\n- Mỏ lết hoặc kìm\n- Gioăng cao su thay thế\n- Băng keo ống nước (Teflon)\n- Tuốc nơ vít\n\n### Các bước thực hiện\n1. **Khóa van nước tổng**\n2. Mở vòi để xả hết nước còn lại\n3. Tháo tay vặn vòi nước\n4. Kiểm tra gioăng cao su\n5. Thay gioăng mới nếu bị mòn\n6. Quấn băng Teflon vào ren\n7. Lắp lại và kiểm tra\n\n### Lưu ý quan trọng\n- Không vặn quá chặt tránh làm hỏng ren\n- Nếu vẫn rò rỉ sau khi sửa, hãy gọi thợ chuyên nghiệp\n- Kiểm tra đường ống bên dưới bồn rửa`,
    category: 'PLUMBING',
    authorName: 'Admin'
  },
  {
    title: '5 cách bảo dưỡng điều hòa tại nhà đúng cách',
    summary: 'Hướng dẫn vệ sinh và bảo dưỡng điều hòa để tiết kiệm điện và tăng tuổi thọ.',
    content: `## Bảo dưỡng điều hòa tại nhà\n\n### Tại sao cần bảo dưỡng?\n- Tiết kiệm 15-30% điện năng\n- Tăng tuổi thọ thiết bị\n- Không khí sạch hơn\n- Tránh hỏng hóc đột ngột\n\n### 1. Vệ sinh lưới lọc (2 tuần/lần)\n- Tháo lưới lọc ra\n- Rửa bằng nước ấm và xà phòng\n- Để khô hoàn toàn trước khi lắp lại\n\n### 2. Vệ sinh dàn lạnh (3 tháng/lần)\n- Dùng bình xịt chuyên dụng\n- Xịt đều lên dàn lạnh\n- Đợi 15 phút rồi bật máy\n\n### 3. Kiểm tra dàn nóng\n- Đảm bảo không bị bụi bẩn che phủ\n- Không đặt vật cản xung quanh\n\n### 4. Nhiệt độ phù hợp\n- Đặt 25-27°C là tối ưu\n- Chênh lệch trong-ngoài không quá 7°C\n\n### 5. Khi nào cần gọi thợ?\n- Điều hòa không lạnh\n- Có tiếng ồn bất thường\n- Nước nhỏ giọt trong nhà\n- Đã hơn 1 năm chưa bảo dưỡng chuyên sâu`,
    category: 'AC_REPAIR',
    authorName: 'Admin'
  },
  {
    title: 'Mẹo sơn tường nhà đẹp như thợ chuyên nghiệp',
    summary: 'Chia sẻ bí quyết sơn tường mịn đều, không bị loang lổ cho người mới bắt đầu.',
    content: `## Sơn tường như thợ chuyên nghiệp\n\n### Chuẩn bị bề mặt\n1. Cạo sạch sơn cũ bong tróc\n2. Trám các vết nứt bằng bột trét\n3. Chà nhám cho bề mặt phẳng\n4. Lau sạch bụi bằng khăn ẩm\n\n### Chọn sơn phù hợp\n- **Sơn nội thất**: Dùng cho trong nhà, ít mùi\n- **Sơn ngoại thất**: Chống thấm, chịu thời tiết\n- **Sơn lót**: Bắt buộc dùng trước sơn phủ\n\n### Kỹ thuật sơn\n1. Sơn lót 1 lớp, đợi khô 4-6 giờ\n2. Sơn phủ lớp 1, từ trên xuống dưới\n3. Đợi 2-4 giờ\n4. Sơn phủ lớp 2 vuông góc với lớp 1\n\n### Mẹo hay\n- Dùng băng keo xanh che viền cửa, trần\n- Pha sơn đều trước khi dùng\n- Không sơn khi trời ẩm ướt\n- Rửa cọ ngay sau khi dùng`,
    category: 'PAINTING',
    authorName: 'Admin'
  },
  {
    title: 'Cách chọn và bảo quản đồ gỗ nội thất bền đẹp',
    summary: 'Kinh nghiệm chọn mua và bảo dưỡng đồ gỗ để sử dụng lâu dài.',
    content: `## Chọn và bảo quản đồ gỗ\n\n### Các loại gỗ phổ biến\n- **Gỗ sồi**: Bền, đẹp, giá cao\n- **Gỗ thông**: Nhẹ, giá rẻ, dễ gia công\n- **Gỗ MDF**: Giá rẻ, bề mặt phẳng\n- **Gỗ công nghiệp**: Đa dạng mẫu mã\n\n### Cách bảo quản\n1. **Tránh ánh nắng trực tiếp** - gỗ dễ cong vênh\n2. **Lau bằng khăn ẩm** - không dùng nước nhiều\n3. **Đánh vecni định kỳ** - 6 tháng/lần\n4. **Tránh để đồ nóng** trực tiếp lên mặt gỗ\n\n### Xử lý khi gỗ bị mối mọt\n- Dùng thuốc diệt mối chuyên dụng\n- Phơi nắng nhẹ để diệt ấu trùng\n- Gọi thợ mộc kiểm tra nếu nặng\n\n### Khi nào cần thợ mộc?\n- Đồ gỗ bị gãy, nứt\n- Cần đóng mới theo thiết kế\n- Sửa chữa bản lề, ngăn kéo`,
    category: 'CARPENTRY',
    authorName: 'Admin'
  },
  {
    title: 'Hướng dẫn xây sửa tường nhà đúng kỹ thuật',
    summary: 'Kiến thức cơ bản về xây, trát tường và những lưu ý quan trọng.',
    content: `## Xây sửa tường nhà\n\n### Các loại gạch phổ biến\n- **Gạch ống**: Nhẹ, cách nhiệt tốt\n- **Gạch đặc**: Chắc chắn, chịu lực\n- **Gạch block**: Xây nhanh, tiết kiệm\n\n### Quy trình xây tường\n1. Chuẩn bị nền móng phẳng\n2. Trộn vữa đúng tỷ lệ (xi măng:cát = 1:4)\n3. Xây từ góc ra giữa\n4. Kiểm tra thẳng đứng bằng dọi\n5. Trát tường sau 7 ngày\n\n### Lưu ý khi sửa tường\n- Kiểm tra kết cấu trước khi đục phá\n- Không đục tường chịu lực\n- Để vữa khô ít nhất 24 giờ\n- Tưới nước dưỡng hộ 7 ngày\n\n### Chi phí tham khảo\n- Xây tường mới: 200.000-350.000đ/m2\n- Trát tường: 80.000-120.000đ/m2\n- Sửa vết nứt: 50.000-100.000đ/vết`,
    category: 'MASONRY',
    authorName: 'Admin'
  },
  {
    title: 'Mẹo chăm sóc vườn nhà cho người bận rộn',
    summary: 'Những bí quyết giúp vườn nhà luôn xanh tốt mà không cần quá nhiều thời gian.',
    content: `## Chăm sóc vườn cho người bận rộn\n\n### Chọn cây dễ trồng\n- **Cây lưỡi hổ**: Chịu hạn, ít chăm sóc\n- **Cây kim tiền**: Mang lại may mắn\n- **Rau thơm**: Vừa đẹp vừa dùng nấu ăn\n- **Cây sen đá**: Tưới 1 lần/tuần\n\n### Hệ thống tưới tự động\n- Dùng chai nhựa đục lỗ tưới nhỏ giọt\n- Lắp hẹn giờ tưới nước\n- Dùng chậu tự tưới\n\n### Bón phân đúng cách\n- Phân hữu cơ: 1 tháng/lần\n- Phân NPK: theo hướng dẫn trên bao\n- Không bón quá nhiều gây cháy rễ\n\n### Phòng trừ sâu bệnh\n- Dùng nước tỏi ớt phun xịt\n- Kiểm tra lá cây hàng tuần\n- Cắt tỉa cành già, lá bệnh\n\n### Khi nào cần thợ làm vườn?\n- Thiết kế sân vườn mới\n- Cắt tỉa cây lớn\n- Xử lý sâu bệnh nặng`,
    category: 'GARDENING',
    authorName: 'Admin'
  },
  {
    title: 'Kinh nghiệm sửa chữa thiết bị gia dụng thường gặp',
    summary: 'Hướng dẫn kiểm tra và khắc phục lỗi cơ bản của máy giặt, tủ lạnh, lò vi sóng.',
    content: `## Sửa thiết bị gia dụng\n\n### Máy giặt\n**Lỗi thường gặp:**\n- Không xả nước: Kiểm tra ống xả, lưới lọc\n- Rung lắc mạnh: Cân bằng chân máy\n- Không vắt: Kiểm tra dây curoa\n\n### Tủ lạnh\n**Lỗi thường gặp:**\n- Không lạnh: Kiểm tra ga, quạt dàn lạnh\n- Đóng tuyết nhiều: Kiểm tra gioăng cửa\n- Chảy nước: Thông ống thoát nước\n\n### Lò vi sóng\n**Lỗi thường gặp:**\n- Không quay đĩa: Kiểm tra motor đĩa\n- Không nóng: Có thể hỏng magnetron\n- Phát tia lửa: Ngừng sử dụng ngay!\n\n### Nguyên tắc an toàn\n1. Rút điện trước khi kiểm tra\n2. Không tự sửa nếu không chắc chắn\n3. Giữ hóa đơn bảo hành\n4. Gọi thợ chuyên nghiệp khi cần`,
    category: 'APPLIANCE_REPAIR',
    authorName: 'Admin'
  },
  {
    title: '7 việc nhà bạn nên làm mỗi ngày để nhà luôn sạch',
    summary: 'Thói quen đơn giản giúp duy trì nhà cửa sạch sẽ mà không tốn nhiều công sức.',
    content: `## 7 việc nhà nên làm mỗi ngày\n\n### 1. Dọn giường ngay khi thức dậy\nChỉ mất 2 phút nhưng phòng ngủ trông gọn gàng hơn hẳn.\n\n### 2. Rửa chén sau mỗi bữa ăn\nKhông để chén bát tích tụ trong bồn rửa.\n\n### 3. Lau bàn ăn và bếp\nLau sạch sau mỗi lần nấu ăn để tránh gián và kiến.\n\n### 4. Quét nhà/hút bụi\nĐặc biệt khu vực bếp và phòng khách.\n\n### 5. Phân loại và giặt đồ\nKhông để quần áo bẩn quá 2 ngày.\n\n### 6. Dọn đồ chơi (nếu có trẻ nhỏ)\nDạy trẻ thói quen cất đồ chơi sau khi chơi.\n\n### 7. Đổ rác\nĐổ rác mỗi tối để tránh mùi hôi và côn trùng.\n\n### Mẹo tiết kiệm thời gian\n- Dọn dẹp 15 phút mỗi tối\n- Mỗi người trong nhà phụ trách 1 việc\n- Nghe nhạc hoặc podcast khi dọn dẹp`,
    category: 'HOUSEWORK',
    authorName: 'Admin'
  }
];

const sampleAppGuides = [
  {
    title: 'Cách đăng ký tài khoản',
    summary: 'Hướng dẫn từng bước tạo tài khoản mới trên FixingApp cho chủ nhà và thợ.',
    content: `## Đăng ký tài khoản FixingApp\n\n### Bước 1: Tải ứng dụng\nTải FixingApp từ App Store (iOS) hoặc Google Play (Android).\n\n### Bước 2: Chọn vai trò\nKhi mở app lần đầu, bạn sẽ được hỏi:\n- **Chủ nhà (Employer)**: Đăng tin tìm thợ\n- **Thợ (Worker)**: Nhận việc và làm việc\n\n### Bước 3: Nhập số điện thoại\n- Nhập số điện thoại Việt Nam (10 số)\n- Số điện thoại dùng để đăng nhập sau này\n\n### Bước 4: Tạo mật khẩu\n- Mật khẩu ít nhất 6 ký tự\n- Nên dùng kết hợp chữ và số\n\n### Bước 5: Điền thông tin cá nhân\n- Họ và tên đầy đủ\n- Địa chỉ (để tìm việc/thợ gần bạn)\n- Nếu là thợ: chọn kỹ năng chuyên môn\n\n### Lưu ý\n- Mỗi số điện thoại chỉ đăng ký được 1 tài khoản\n- Thông tin có thể cập nhật sau trong mục Hồ sơ`,
    category: 'ACCOUNT',
    iconName: 'person.badge.plus',
    sortOrder: 1
  },
  {
    title: 'Cách đăng tin tìm thợ',
    summary: 'Hướng dẫn chủ nhà tạo và đăng tin công việc để tìm thợ phù hợp.',
    content: `## Đăng tin tìm thợ\n\n### Bước 1: Vào trang chủ\nTừ tab "Trang chủ", nhấn vào loại dịch vụ bạn cần (Thợ điện, Thợ nước, v.v.)\n\n### Bước 2: Điền thông tin công việc\n- **Tiêu đề**: Mô tả ngắn gọn (VD: "Sửa ống nước bị rò rỉ")\n- **Mô tả chi tiết**: Càng chi tiết càng tốt\n- **Giá đề xuất**: Mức giá bạn sẵn sàng trả\n- **Địa chỉ**: Nơi cần thợ đến làm\n- **Thời gian**: Ngày giờ mong muốn\n\n### Bước 3: Đăng tin\nNhấn nút "Đăng tin" để hoàn tất.\n\n### Bước 4: Chờ thợ ứng tuyển\n- Bạn sẽ nhận thông báo khi có thợ ứng tuyển\n- Xem hồ sơ, đánh giá của thợ\n- Chọn thợ phù hợp nhất\n\n### Mẹo đăng tin hiệu quả\n- Chụp ảnh hiện trạng nếu có thể\n- Đặt giá hợp lý theo thị trường\n- Mô tả rõ ràng vấn đề cần sửa`,
    category: 'EMPLOYER',
    iconName: 'doc.badge.plus',
    sortOrder: 2
  },
  {
    title: 'Cách ứng tuyển và nhận việc',
    summary: 'Hướng dẫn thợ tìm kiếm, ứng tuyển và bắt đầu nhận việc trên app.',
    content: `## Ứng tuyển và nhận việc\n\n### Tìm việc phù hợp\n1. Vào tab **"Việc làm"** để xem danh sách\n2. Lọc theo kỹ năng, khu vực, mức giá\n3. Nhấn vào tin để xem chi tiết\n\n### Ứng tuyển\n1. Nhấn nút **"Ứng tuyển"** trên tin việc\n2. Viết giới thiệu ngắn về bản thân\n3. Đề xuất giá (nếu muốn thương lượng)\n4. Chờ chủ nhà duyệt\n\n### Khi được chọn\n- Bạn nhận thông báo "Đã được chọn"\n- Liên hệ chủ nhà qua tin nhắn trong app\n- Xác nhận thời gian và địa điểm\n\n### Hoàn thành công việc\n1. Đến đúng địa điểm, đúng giờ\n2. Hoàn thành công việc\n3. Nhấn **"Bàn giao"** khi xong\n4. Chủ nhà xác nhận hoàn thành\n5. Nhận đánh giá và thanh toán\n\n### Mẹo nhận nhiều việc\n- Cập nhật hồ sơ đầy đủ\n- Phản hồi nhanh\n- Giữ đánh giá tốt`,
    category: 'WORKER',
    iconName: 'hammer.fill',
    sortOrder: 3
  },
  {
    title: 'Quản lý hồ sơ cá nhân',
    summary: 'Cách cập nhật thông tin, ảnh đại diện, xác minh danh tính trên FixingApp.',
    content: `## Quản lý hồ sơ cá nhân\n\n### Cập nhật thông tin\n1. Vào tab **"Hồ sơ"**\n2. Nhấn vào thông tin muốn thay đổi:\n   - Họ và tên\n   - Địa chỉ\n   - Kỹ năng (đối với thợ)\n\n### Thay đổi ảnh đại diện\n1. Nhấn vào ảnh đại diện trên trang Hồ sơ\n2. Chọn ảnh từ thư viện hoặc chụp mới\n3. Ảnh sẽ được cập nhật tự động\n\n### Xác minh danh tính\nĐể tăng độ tin cậy, hãy xác minh tài khoản:\n1. Vào mục **"Xác minh danh tính"** trong Hồ sơ\n2. Chụp ảnh CMND/CCCD mặt trước\n3. Tải lên và chờ admin duyệt\n4. Khi được duyệt, hồ sơ hiển thị dấu ✓ xanh\n\n### Đổi giao diện\nFixingApp hỗ trợ nhiều theme:\n- 🐝 **Bumblebee**: Phong cách sáng, năng động\n- 🌙 **Nightshift**: Giao diện tối\n- 🔧 **Industrial**: Phong cách công nghiệp\n\nVào Hồ sơ > chọn theme yêu thích`,
    category: 'PROFILE',
    iconName: 'person.text.rectangle',
    sortOrder: 4
  },
  {
    title: 'Hệ thống đánh giá và nhận xét',
    summary: 'Tìm hiểu cách đánh giá, xem nhận xét và tầm quan trọng của đánh giá.',
    content: `## Hệ thống đánh giá\n\n### Đánh giá sau công việc\nSau khi công việc hoàn thành, cả hai bên đều có thể đánh giá:\n- ⭐ **1 sao**: Rất không hài lòng\n- ⭐⭐ **2 sao**: Không hài lòng\n- ⭐⭐⭐ **3 sao**: Bình thường\n- ⭐⭐⭐⭐ **4 sao**: Hài lòng\n- ⭐⭐⭐⭐⭐ **5 sao**: Rất hài lòng\n\n### Viết nhận xét\n- Mô tả trải nghiệm thực tế\n- Đánh giá khách quan, trung thực\n- Không sử dụng ngôn từ thiếu văn hóa\n\n### Xem đánh giá\n- Đánh giá hiển thị trên hồ sơ công khai\n- Điểm trung bình tính từ tất cả đánh giá\n- Chủ nhà có thể xem đánh giá trước khi chọn thợ\n\n### Tại sao đánh giá quan trọng?\n- Thợ có đánh giá cao → được chọn nhiều hơn\n- Chủ nhà uy tín → thu hút thợ giỏi\n- Giúp cộng đồng minh bạch, đáng tin`,
    category: 'FEATURE',
    iconName: 'star.bubble',
    sortOrder: 5
  },
  {
    title: 'Tin nhắn và liên lạc',
    summary: 'Cách sử dụng tính năng nhắn tin trong app để liên lạc giữa chủ nhà và thợ.',
    content: `## Tin nhắn trong FixingApp\n\n### Khi nào có thể nhắn tin?\nBạn có thể nhắn tin khi:\n- Thợ đã ứng tuyển vào tin của bạn\n- Hoặc bạn đã được chủ nhà chọn\n\n### Cách gửi tin nhắn\n1. Vào mục **"Thông báo"** > **"Tin nhắn"**\n2. Chọn cuộc trò chuyện\n3. Nhập và gửi tin nhắn\n\n### Những gì nên trao đổi\n- Xác nhận thời gian đến\n- Hỏi chi tiết về công việc\n- Thông báo nếu đến trễ\n- Báo giá vật tư (nếu cần)\n\n### Lưu ý\n- Tin nhắn được lưu lại trong app\n- Không chia sẻ thông tin cá nhân nhạy cảm\n- Sử dụng ngôn từ lịch sự, chuyên nghiệp\n- Phản hồi tin nhắn càng sớm càng tốt`,
    category: 'FEATURE',
    iconName: 'message.fill',
    sortOrder: 6
  },
  {
    title: 'Khiếu nại và hỗ trợ',
    summary: 'Cách gửi khiếu nại khi gặp vấn đề và liên hệ bộ phận hỗ trợ.',
    content: `## Khiếu nại và hỗ trợ\n\n### Khi nào nên khiếu nại?\n- Thợ không đến đúng hẹn\n- Chất lượng công việc không đạt\n- Giá thực tế khác với thỏa thuận\n- Thái độ không chuyên nghiệp\n- Chủ nhà không thanh toán\n\n### Cách gửi khiếu nại\n1. Vào chi tiết công việc liên quan\n2. Nhấn **"Khiếu nại"**\n3. Chọn lý do khiếu nại\n4. Mô tả chi tiết vấn đề\n5. Đính kèm hình ảnh (nếu có)\n6. Gửi và chờ admin xử lý\n\n### Quy trình xử lý\n- Admin xem xét trong vòng 24-48 giờ\n- Có thể liên hệ cả hai bên\n- Đưa ra phương án giải quyết\n- Thông báo kết quả qua app\n\n### Liên hệ hỗ trợ\n- Qua mục "Hồ sơ" > "Hỗ trợ"\n- Email: support@fixingapp.vn\n- Hotline: 1900-xxxx`,
    category: 'SUPPORT',
    iconName: 'exclamationmark.bubble',
    sortOrder: 7
  },
  {
    title: 'Mẹo sử dụng app hiệu quả',
    summary: 'Các mẹo và thủ thuật giúp bạn tận dụng tối đa các tính năng của FixingApp.',
    content: `## Mẹo sử dụng FixingApp\n\n### Cho chủ nhà\n1. **Đăng tin rõ ràng**: Mô tả chi tiết + ảnh = nhiều thợ ứng tuyển hơn\n2. **Kiểm tra hồ sơ thợ**: Xem đánh giá, kinh nghiệm trước khi chọn\n3. **Đặt giá hợp lý**: Tham khảo giá thị trường\n4. **Phản hồi nhanh**: Thợ giỏi thường bận, trả lời sớm để không mất cơ hội\n\n### Cho thợ\n1. **Hoàn thiện hồ sơ**: Ảnh đại diện + xác minh = tăng độ tin cậy\n2. **Ứng tuyển sớm**: Việc mới đăng thường ít cạnh tranh\n3. **Giữ đánh giá 5 sao**: Đến đúng giờ, làm chất lượng, thái độ tốt\n4. **Bật thông báo**: Không bỏ lỡ việc mới phù hợp\n\n### Chung\n- 📱 **Bật thông báo** để không bỏ lỡ tin nhắn\n- 📍 **Cập nhật địa chỉ** để tìm việc/thợ gần nhất\n- 🔒 **Bảo mật tài khoản**: Không chia sẻ mật khẩu\n- 🔄 **Cập nhật app** thường xuyên để có tính năng mới`,
    category: 'TIPS',
    iconName: 'lightbulb.fill',
    sortOrder: 8
  }
];

/**
 * Get role ID by name
 */
async function getRoleId(roleName) {
  const roleResult = await db.query('SELECT id FROM roles WHERE name = $1', [roleName]);
  if (roleResult.rows.length === 0) {
    throw new Error(`Role ${roleName} not found`);
  }
  return roleResult.rows[0].id;
}

/**
 * Get user ID by phone
 */
async function getUserIdByPhone(phone) {
  const userResult = await db.query('SELECT id FROM users WHERE phone = $1', [phone]);
  return userResult.rows.length > 0 ? userResult.rows[0].id : null;
}

/**
 * Normalize skill value - maps old skill values to new standardized ones
 * If skill doesn't match any known skill, returns 'OTHER'
 */
function normalizeSkill(skill) {
  if (!skill) return null;

  const upperSkill = skill.toUpperCase().trim();

  // Map old values to new standardized values
  const skillMap = {
    'PLUMBING': 'PLUMBING',
    'ELECTRICAL': 'ELECTRICAL',
    'CARPENTRY': 'CARPENTRY',
    'PAINTING': 'PAINTING',
    'CLEANING': 'CLEANING',
    'AC REPAIR': 'AC_REPAIR',
    'AC_REPAIR': 'AC_REPAIR',
    'APPLIANCE REPAIR': 'APPLIANCE_REPAIR',
    'APPLIANCE_REPAIR': 'APPLIANCE_REPAIR',
    'MASONRY': 'MASONRY',
    'GARDENING': 'GARDENING',
    'ENTERTAINMENT': 'ENTERTAINMENT',
    'HOUSEWORK': 'HOUSEWORK',
    'DELIVERY': 'DELIVERY',
    'ERRANDS': 'ERRANDS',
    'MISC_TASKS': 'MISC_TASKS',
    'CARRYING': 'CARRYING',
    'OTHER': 'OTHER'
  };

  // Check if it's a known skill
  if (skillMap[upperSkill]) {
    return skillMap[upperSkill];
  }

  // If not found, return OTHER
  return 'OTHER';
}

/**
 * Create a user with role and profile
 */
async function createUser(userData) {
  const { phone, password, fullName, address, role, skill } = userData;

  // Check if user already exists
  const existingUserId = await getUserIdByPhone(phone);
  if (existingUserId) {
    console.log(`  ⚠ User ${phone} already exists, skipping...`);
    return existingUserId;
  }

  const passwordHash = await bcrypt.hash(password, 10);
  const now = Date.now();
  const roleId = await getRoleId(role);

  // Insert user
  const userResult = await db.query(`
    INSERT INTO users (phone, password_hash, full_name, address, created_at, updated_at)
    VALUES ($1, $2, $3, $4, $5, $6)
    RETURNING id
  `, [phone, passwordHash, fullName, address, now, now]);
  const userId = userResult.rows[0].id;

  // Assign role
  await db.query('INSERT INTO user_roles (user_id, role_id) VALUES ($1, $2)', [userId, roleId]);

  // Create profile
  if (role === 'EMPLOYER') {
    await db.query('INSERT INTO employer_profiles (user_id) VALUES ($1)', [userId]);
  } else if (role === 'WORKER') {
    const normalizedSkill = normalizeSkill(skill);
    await db.query('INSERT INTO worker_profiles (user_id, skill) VALUES ($1, $2)', [userId, normalizedSkill]);
  }

  console.log(`  ✓ Created ${role} user: ${fullName} (${phone})`);
  return userId;
}

/**
 * Create a job
 */
async function createJob(jobData) {
  const { employerPhone, title, description, price, address, requiredSkill, status } = jobData;

  const employerId = await getUserIdByPhone(employerPhone);
  if (!employerId) {
    console.log(`  ⚠ Employer ${employerPhone} not found, skipping job: ${title}`);
    return null;
  }

  const now = Date.now();
  const handoverDeadline = status === 'DANG_BAN_GIAO' ? now + (30 * 24 * 60 * 60 * 1000) : null;

  // Normalize skill to ensure it matches one of the fixed skill values
  const normalizedSkill = normalizeSkill(requiredSkill);

  const result = await db.query(`
    INSERT INTO jobs (
      employer_id, title, description, price, address, required_skill,
      status, handover_deadline, created_at, updated_at
    )
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
    RETURNING id
  `, [
    employerId,
    title,
    description,
    price,
    address,
    normalizedSkill,
    status,
    handoverDeadline,
    now,
    now
  ]);

  console.log(`  ✓ Created job: ${title}`);
  return result.rows[0].id;
}

/**
 * Create a certificate
 */
async function createCertificate(certData) {
  const { workerPhone, imageUrl, status } = certData;

  const workerId = await getUserIdByPhone(workerPhone);
  if (!workerId) {
    console.log(`  ⚠ Worker ${workerPhone} not found, skipping certificate`);
    return null;
  }

  const reviewedBy = status === 'APPROVED' ? await getUserIdByPhone('0999999999') : null;
  const reviewedAt = status === 'APPROVED' ? Date.now() : null;

  const result = await db.query(`
    INSERT INTO worker_certificates (worker_id, image_url, status, reviewed_by, reviewed_at)
    VALUES ($1, $2, $3, $4, $5)
    RETURNING id
  `, [workerId, imageUrl, status, reviewedBy, reviewedAt]);

  // Update worker profile if approved
  if (status === 'APPROVED') {
    await db.query('UPDATE worker_profiles SET is_verified = TRUE WHERE user_id = $1', [workerId]);
  }

  console.log(`  ✓ Created certificate for worker ${workerPhone} (${status})`);
  return result.rows[0].id;
}

/**
 * Create a knowledge article
 */
async function createKnowledgeArticle(articleData) {
  const { title, summary, content, category, authorName } = articleData;

  const now = Date.now();
  const viewCount = Math.floor(Math.random() * 500) + 10;

  const result = await db.query(`
    INSERT INTO knowledge_articles (title, summary, content, category, author_name, is_published, view_count, created_at, updated_at)
    VALUES ($1, $2, $3, $4, $5, TRUE, $6, $7, $8)
    RETURNING id
  `, [title, summary, content, category, authorName, viewCount, now, now]);

  console.log(`  ✓ Created knowledge article: ${title}`);
  return result.rows[0].id;
}

/**
 * Create an app guide
 */
async function createAppGuide(guideData) {
  const { title, summary, content, category, iconName, sortOrder } = guideData;

  const now = Date.now();
  const viewCount = Math.floor(Math.random() * 200) + 5;

  const result = await db.query(`
    INSERT INTO app_guides (title, summary, content, category, icon_name, sort_order, is_published, view_count, created_at, updated_at)
    VALUES ($1, $2, $3, $4, $5, $6, TRUE, $7, $8, $9)
    RETURNING id
  `, [title, summary, content, category, iconName, sortOrder, viewCount, now, now]);

  console.log(`  ✓ Created app guide: ${title}`);
  return result.rows[0].id;
}

/**
 * Main seed function
 */
async function seed() {
  console.log('🌱 Starting database seed...\n');

  try {
    // Create users
    console.log('Creating users...');
    for (const admin of sampleAdmins) {
      await createUser(admin);
    }
    for (const employer of sampleEmployers) {
      await createUser(employer);
    }
    for (const worker of sampleWorkers) {
      await createUser(worker);
    }
    console.log('');

    // Create jobs
    console.log('Creating jobs...');
    for (const job of sampleJobs) {
      await createJob(job);
    }
    console.log('');

    // Create certificates
    console.log('Creating certificates...');
    for (const cert of sampleCertificates) {
      await createCertificate(cert);
    }
    console.log('');

    // Create knowledge articles
    console.log('Creating knowledge articles...');
    for (const article of sampleKnowledgeArticles) {
      await createKnowledgeArticle(article);
    }
    console.log('');

    // Create app guides
    console.log('Creating app guides...');
    for (const guide of sampleAppGuides) {
      await createAppGuide(guide);
    }
    console.log('');

    console.log('✅ Database seed completed successfully!');
    console.log('\n📋 Sample accounts:');
    console.log('  Admin:');
    console.log('    Phone: 0999999999');
    console.log('    Password: admin123');
    console.log('\n  Employers:');
    sampleEmployers.forEach(emp => {
      console.log(`    Phone: ${emp.phone}, Password: ${emp.password}`);
    });
    console.log('\n  Workers:');
    sampleWorkers.forEach(worker => {
      console.log(`    Phone: ${worker.phone}, Password: ${worker.password}, Skill: ${worker.skill}`);
    });
    console.log('\n💡 You can now test the API using these accounts in Swagger UI!');
  } catch (error) {
    console.error('❌ Error seeding database:', error);
    throw error;
  } finally {
    // Close database connection pool
    await db.pool.end();
  }
}

// Run seed if this file is executed directly
if (require.main === module) {
  seed().catch((error) => {
    console.error('Seed failed:', error);
    process.exit(1);
  });
}

module.exports = { seed };
