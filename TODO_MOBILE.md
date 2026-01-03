# TODO: Cập nhật Mobile App để đồng nhất với Web

## Tổng quan
Tài liệu này liệt kê các tính năng và cải tiến cần được cập nhật trong mobile app để đồng nhất với phiên bản web. Tập trung vào giao diện và trải nghiệm người dùng.

---

## 1. Tích hợp TrackAsia API - Address Autocomplete

### 1.1. Tạo TrackAsia API Service
**File mới:** `mobile/src/services/trackasiaApi.ts`
- Tạo service tương tự `frontend/app-ui/src/lib/api/trackasia.ts`
- Implement các functions:
  - `autocomplete(query: string, limit?: number)` - Gợi ý địa chỉ khi người dùng nhập
  - `geocode(address: string)` - Chuyển đổi địa chỉ thành tọa độ (lat/lng)
  - `reverseGeocode(latitude: number, longitude: number)` - Chuyển đổi tọa độ thành địa chỉ
  - `getPlaceDetails(placeId: string)` - Lấy chi tiết địa chỉ từ place_id
- Sử dụng API base: `https://maps.track-asia.com/api/v2`
- Cần thêm `TRACKASIA_API_KEY` vào `mobile/src/constants/config.ts`

### 1.2. Tạo AddressAutocomplete Component
**File mới:** `mobile/src/components/jobs/AddressAutocomplete.tsx`
- Component tương tự `frontend/app-ui/src/app/components/jobs/AddressAutocomplete.tsx`
- Sử dụng React Native components:
  - `TextInput` thay vì `input`
  - `FlatList` hoặc `ScrollView` cho suggestions dropdown
  - `TouchableOpacity` cho suggestion items
- Implement debounce cho autocomplete (300ms)
- Xử lý việc đóng dropdown khi click outside
- Callback: `onChange(address: string, latitude?: number, longitude?: number)`

### 1.3. Cập nhật Config
**File:** `mobile/src/constants/config.ts`
- Thêm `TRACKASIA_API_KEY` vào config
- Đảm bảo đọc từ environment variables hoặc config file

---

## 2. Cập nhật Job Filters - Location-based Search

### 2.1. Cập nhật JobFilters Component
**File:** `mobile/src/components/jobs/JobFilters.tsx`
- Thêm section "Tìm kiếm công việc gần bạn"
- Thêm 2 nút:
  - "📍 Lấy vị trí hiện tại" - Sử dụng `expo-location` hoặc `@react-native-community/geolocation`
  - "🏠 Lấy vị trí đã đăng ký" - Lấy từ user profile
- Thêm `AddressAutocomplete` component cho manual address input
- Thêm dropdown chọn khoảng cách:
  - "< 1km"
  - "1-3km"
  - "3-5km"
- Cập nhật `JobFilters` interface để bao gồm:
  - `latitude?: number`
  - `longitude?: number`
  - `maxDistance?: number` (1, 3, hoặc 5 km)
- Hiển thị error messages khi không thể lấy vị trí
- Loading state khi đang lấy vị trí

### 2.2. Cập nhật JobsListScreen
**File:** `mobile/src/screens/jobs/JobsListScreen.tsx`
- Truyền location params (`latitude`, `longitude`, `maxDistance`) vào API call
- Cập nhật `listJobs` API call để include location params

### 2.3. Cập nhật jobsApi Service
**File:** `mobile/src/services/jobsApi.ts`
- Cập nhật `ListJobsParams` interface:
  ```typescript
  export interface ListJobsParams {
    // ... existing params
    latitude?: number;
    longitude?: number;
    maxDistance?: number; // in km
  }
  ```

---

## 3. Cập nhật Create Job Screen

### 3.1. Thay thế Address Input bằng AddressAutocomplete
**File:** `mobile/src/screens/jobs/CreateJobScreen.tsx`
- Thay thế `Input` component cho address field bằng `AddressAutocomplete`
- Thêm state cho `latitude` và `longitude`
- Cập nhật `handleSubmit` để gửi `latitude` và `longitude` trong FormData
- Đảm bảo validation vẫn hoạt động

---

## 4. Cập nhật Profile Screen

### 4.1. Thêm AddressAutocomplete cho Address Field
**File:** `mobile/src/screens/profile/ProfileScreen.tsx`
- Trong edit mode, thay thế `Input` cho address bằng `AddressAutocomplete`
- Thêm state cho `latitude` và `longitude` (nếu backend hỗ trợ)
- Cập nhật `updateUserProfile` call để include coordinates nếu có

---

## 5. Cập nhật Registration Forms

### 5.1. Thêm RegisterTypeModal
**File mới:** `mobile/src/components/auth/RegisterTypeModal.tsx`
- Modal component tương tự `frontend/app-ui/src/app/components/auth/RegisterTypeModal.tsx`
- Sử dụng React Native `Modal` component
- 2 options: "Người thuê (Employer)" và "Người làm việc (Worker)"
- Navigate đến screen tương ứng khi chọn

### 5.2. Cập nhật Register Screens
**Files:**
- `mobile/src/screens/auth/RegisterEmployerScreen.tsx`
- `mobile/src/screens/auth/RegisterWorkerScreen.tsx`
- Thêm logic để hiển thị `RegisterTypeModal` khi user click "Đăng ký"
- Hoặc có thể tạo một RegisterLandingScreen mới

### 5.3. Cập nhật Register Forms
**Files:**
- `mobile/src/components/auth/RegisterEmployerForm.tsx`
- `mobile/src/components/auth/RegisterWorkerForm.tsx`
- Thay thế address `TextInput` bằng `AddressAutocomplete` component
- Thêm state cho `latitude` và `longitude`
- Cập nhật registration API call để include coordinates

---

## 6. Cập nhật Dashboard Screen

### 6.1. Tạo Role-specific Dashboard Screens
**Files mới:**
- `mobile/src/screens/dashboard/WorkerDashboardScreen.tsx`
- `mobile/src/screens/dashboard/EmployerDashboardScreen.tsx`

### 6.2. Worker Dashboard
**File:** `mobile/src/screens/dashboard/WorkerDashboardScreen.tsx`
- Title: "Công việc đã apply"
- Hiển thị danh sách applications với full job details
- Thêm dropdown filter theo job status:
  - "Tất cả trạng thái"
  - "Chưa làm" (CHUA_LAM)
  - "Đang bàn giao" (DANG_BAN_GIAO)
  - "Đã hoàn thành" (DA_HOAN_THANH)
  - "Hết hạn" (EXPIRED)
- Hiển thị sections:
  - Applications (với job details: title, address, price, status)
  - Reviews (nếu có API endpoint)
  - Certificates (nếu có API endpoint)
- Sử dụng `fetchMyApplications` với `jobStatus` filter

### 6.3. Employer Dashboard
**File:** `mobile/src/screens/dashboard/EmployerDashboardScreen.tsx`
- Title: "Công việc đã đăng"
- Hiển thị danh sách jobs đã đăng
- Thêm dropdown filter theo job status (tương tự Worker Dashboard)
- Nút "Đăng việc" để navigate đến CreateJobScreen
- Sử dụng `fetchMyJobs` với `status` filter

### 6.4. Cập nhật DashboardScreen
**File:** `mobile/src/screens/dashboard/DashboardScreen.tsx`
- Thay thế nội dung hiện tại bằng logic redirect dựa trên role:
  - WORKER → WorkerDashboardScreen
  - EMPLOYER → EmployerDashboardScreen
  - ADMIN → AdminDashboardScreen (nếu có)

### 6.5. Cập nhật Navigation
**File:** `mobile/src/navigation/MainTabs.tsx`
- Cập nhật tab label "Dashboard" dựa trên role:
  - WORKER: "Công việc đã apply"
  - EMPLOYER: "Công việc đã đăng"
  - ADMIN: "Bảng điều khiển"

### 6.6. Cập nhật API Services
**Files:**
- `mobile/src/services/applicationsApi.ts` - Thêm `jobStatus` param cho `getMyApplications`
- `mobile/src/services/jobsApi.ts` - Thêm `status` param cho `getMyJobs`
- `mobile/src/services/workerApi.ts` (nếu có) - Thêm `fetchMyReviews` và `fetchCertificates`

---

## 7. Cập nhật JobCard Component

### 7.1. Hiển thị Distance
**File:** `mobile/src/components/jobs/JobCard.tsx`
- Thêm hiển thị distance nếu `job.distance` có giá trị
- Format: `< 1km` hiển thị bằng mét (ví dụ: "500m"), `>= 1km` hiển thị bằng km (ví dụ: "2.5km")
- Style tương tự web: badge với background sky-50, text sky-700
- Hiển thị ở vị trí phù hợp trong card layout

### 7.2. Cập nhật Job Type
**File:** `mobile/src/types/jobs.ts`
- Đảm bảo `Job` interface có field `distance?: number | null`

---

## 8. Cập nhật Job Detail Screen

### 8.1. Hiển thị Distance
**File:** `mobile/src/screens/jobs/JobDetailScreen.tsx`
- Hiển thị distance nếu có trong job data
- Format tương tự JobCard

### 8.2. Complaint Feature
**File:** `mobile/src/screens/jobs/JobDetailScreen.tsx`
- Đảm bảo complaint form hiển thị cho cả employer và worker
- Backend đã validate, chỉ cần đảm bảo UI hiển thị đúng

---

## 9. Cập nhật Types

### 9.1. Job Types
**File:** `mobile/src/types/jobs.ts`
- Thêm `distance?: number | null` vào `Job` interface
- Thêm `latitude?: number | null` và `longitude?: number | null` nếu chưa có

### 9.2. Application Types
**File:** `mobile/src/types/applications.ts` (nếu có)
- Đảm bảo `JobApplication` có field `job?` với full job details

---

## 10. Dependencies & Setup

### 10.1. Install Required Packages
Cần cài đặt các packages sau (nếu chưa có):
```bash
# For location services
npm install expo-location
# hoặc
npm install @react-native-community/geolocation

# For API calls (nếu chưa có axios)
npm install axios
```

### 10.2. Environment Variables
- Thêm `TRACKASIA_API_KEY` vào config
- Có thể sử dụng `react-native-config` hoặc hardcode trong config file (không khuyến khích cho production)

### 10.3. Permissions
**File:** `mobile/app.json` hoặc `mobile/ios/Info.plist` và `mobile/android/AndroidManifest.xml`
- Thêm location permissions:
  - iOS: `NSLocationWhenInUseUsageDescription`
  - Android: `ACCESS_FINE_LOCATION` và `ACCESS_COARSE_LOCATION`

---

## 11. UI/UX Improvements

### 11.1. Loading States
- Thêm loading indicators cho tất cả async operations:
  - Location fetching
  - Address autocomplete
  - API calls

### 11.2. Error Handling
- Hiển thị error messages rõ ràng:
  - "Không thể lấy vị trí. Vui lòng nhập địa chỉ thủ công."
  - "Chưa đăng ký vị trí. Vui lòng cập nhật địa chỉ trong hồ sơ của bạn."
  - "Không thể lấy tọa độ từ địa chỉ đã đăng ký. Vui lòng nhập địa chỉ thủ công."

### 11.3. Vietnamese Text
- Đảm bảo tất cả text đều bằng tiếng Việt, đồng nhất với web:
  - "Tìm kiếm công việc gần bạn"
  - "📍 Lấy vị trí hiện tại"
  - "🏠 Lấy vị trí đã đăng ký"
  - "Công việc đã apply" (Worker)
  - "Công việc đã đăng" (Employer)

---

## 12. Testing Checklist

Sau khi implement, cần test các scenarios sau:

- [ ] Address autocomplete hoạt động khi nhập địa chỉ
- [ ] "Lấy vị trí hiện tại" lấy được GPS và reverse geocode thành địa chỉ
- [ ] "Lấy vị trí đã đăng ký" lấy được địa chỉ từ profile và geocode
- [ ] Location-based search filter jobs theo khoảng cách
- [ ] JobCard hiển thị distance nếu có
- [ ] Create job với address autocomplete và coordinates
- [ ] Register forms với address autocomplete
- [ ] Profile edit với address autocomplete
- [ ] Worker dashboard hiển thị applications với job status filter
- [ ] Employer dashboard hiển thị jobs với status filter
- [ ] Tab labels thay đổi theo role

---

## Notes

- Backend API đã hỗ trợ đầy đủ các tính năng này, chỉ cần cập nhật frontend mobile
- Tập trung vào UI/UX consistency với web version
- Đảm bảo error handling và loading states rõ ràng
- Sử dụng design tokens từ `mobile/src/constants/designTokens.ts` để đồng nhất styling

