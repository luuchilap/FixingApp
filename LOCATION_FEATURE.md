# Tính năng Tìm kiếm Công việc Gần Bạn

## Tổng quan

Tính năng này cho phép cả employer và worker tìm kiếm công việc dựa trên vị trí địa lý với các tùy chọn khoảng cách: <1km, 1-3km, 3-5km.

## Các thành phần đã triển khai

### 1. Backend

#### Database Migration
- **File**: `src/database/migrations/010_jobs_location.js`
- Thêm cột `latitude` và `longitude` vào bảng `jobs`
- Tạo index cho truy vấn location-based

#### TrackAsia API Service
- **File**: `src/utils/trackasia.js`
- Hàm `autocomplete()`: Lấy gợi ý địa chỉ từ TrackAsia API
- Hàm `geocode()`: Chuyển đổi địa chỉ thành tọa độ (lat/lng)
- Hàm `calculateDistance()`: Tính khoảng cách giữa hai điểm (Haversine formula)

#### Jobs Controller Updates
- **File**: `src/modules/jobs/jobs.controller.js`
- `createJob()`: Tự động geocode địa chỉ khi tạo job (nếu không có lat/lng)
- `updateJob()`: Geocode địa chỉ mới khi cập nhật
- `listJobs()`: Hỗ trợ lọc theo khoảng cách với query params:
  - `latitude`: Vĩ độ của người dùng
  - `longitude`: Kinh độ của người dùng
  - `maxDistance`: Khoảng cách tối đa (km)

### 2. Frontend

#### TrackAsia API Client
- **File**: `frontend/app-ui/src/lib/api/trackasia.ts`
- Client-side API để gọi TrackAsia autocomplete và geocode

#### Address Autocomplete Component
- **File**: `frontend/app-ui/src/app/components/jobs/AddressAutocomplete.tsx`
- Component với autocomplete khi nhập địa chỉ
- Debounce 300ms để tối ưu API calls
- Hiển thị dropdown với các gợi ý địa chỉ

#### Job Creation Form
- **File**: `frontend/app-ui/src/app/(routes)/jobs/new/page.tsx`
- Tích hợp `AddressAutocomplete` component
- Tự động lấy lat/lng khi chọn địa chỉ từ autocomplete
- Gửi lat/lng cùng với job data

#### Job Filters
- **File**: `frontend/app-ui/src/app/components/jobs/JobFilters.tsx`
- Nút "Lấy vị trí hiện tại" sử dụng browser geolocation API
- Input địa chỉ với autocomplete
- Dropdown chọn khoảng cách: <1km, 1-3km, 3-5km
- Hiển thị tọa độ khi có vị trí

#### Job Card
- **File**: `frontend/app-ui/src/app/components/jobs/JobCard.tsx`
- Hiển thị khoảng cách (nếu có) với icon location
- Format: "500m" cho <1km, "2.5km" cho >=1km

#### API Client
- **File**: `frontend/app-ui/src/lib/api/jobs.ts`
- Cập nhật `JobsQuery` interface với `latitude`, `longitude`, `maxDistance`
- `fetchJobs()` hỗ trợ các query params mới

#### Type Definitions
- **File**: `frontend/app-ui/src/lib/types/jobs.ts`
- Thêm `latitude`, `longitude`, `distance` vào `Job` interface

## Cấu hình

### Backend Environment Variables
Thêm vào `.env`:
```
TRACKASIA_API_KEY=your-trackasia-api-key
```

### Frontend Environment Variables
Thêm vào `.env.local` trong `frontend/app-ui/`:
```
NEXT_PUBLIC_TRACKASIA_API_KEY=your-trackasia-api-key
```

## Cách sử dụng

### 1. Khi tạo job mới
1. Nhập địa chỉ vào trường "Address"
2. Chọn một địa chỉ từ dropdown autocomplete
3. Hệ thống tự động lấy tọa độ (lat/lng)
4. Submit form - tọa độ sẽ được lưu cùng với job

### 2. Khi tìm kiếm job
1. Trong phần lọc, click "📍 Lấy vị trí hiện tại" HOẶC nhập địa chỉ
2. Chọn khoảng cách: <1km, 1-3km, hoặc 3-5km
3. Click "Search jobs"
4. Kết quả sẽ được lọc theo khoảng cách và sắp xếp từ gần đến xa

## Lưu ý kỹ thuật

1. **Geocoding**: Nếu không có lat/lng khi tạo job, backend sẽ tự động geocode địa chỉ
2. **Distance Calculation**: Sử dụng Haversine formula để tính khoảng cách chính xác
3. **Performance**: Distance filtering được thực hiện sau khi query database để tối ưu
4. **Fallback**: Nếu TrackAsia API không khả dụng, job vẫn có thể được tạo (không có tọa độ)

## API Endpoints

### GET /api/jobs
Query parameters mới:
- `latitude`: Vĩ độ (number)
- `longitude`: Kinh độ (number)
- `maxDistance`: Khoảng cách tối đa tính bằng km (number)

Ví dụ:
```
GET /api/jobs?latitude=10.762622&longitude=106.660172&maxDistance=3
```

### POST /api/jobs
Body mới có thể bao gồm:
- `latitude`: Vĩ độ (optional, sẽ geocode nếu không có)
- `longitude`: Kinh độ (optional, sẽ geocode nếu không có)

## Migration

Chạy migration để thêm cột location:
```bash
npm run migrate
```

Migration sẽ tự động chạy khi start server nếu chưa được thực thi.

