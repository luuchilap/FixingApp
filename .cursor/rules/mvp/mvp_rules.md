# MVP Backend Development Plan (Local Only)

Tài liệu này mô tả **kế hoạch phát triển backend cho MVP** của ứng dụng kết nối người thuê và người lao động, dựa trên **toàn bộ yêu cầu đã được chốt**. Đây là tài liệu định hướng, giúp bạn dễ đọc, dễ rà soát trước khi bước vào code.

---

## 1. Mục tiêu giai đoạn MVP

Mục tiêu duy nhất của giai đoạn này là:

> **Chứng minh hệ thống có thể chạy end‑to‑end ở local**: đăng việc → nhận việc → hoàn thành → đánh giá / khiếu nại.

MVP **không nhằm mục tiêu scale**, không tối ưu hiệu năng, không triển khai cloud.

---

## 2. Công nghệ sử dụng (đã chốt)

* **Backend framework**: Node.js + **ExpressJS**
* **Database**: **SQLite**
* **SQLite library**: `better-sqlite3`
* **API style**: RESTful API
* **Authentication**: JWT (access token duy nhất)
* **Frontend**: ❌ Không có
* **CI/CD – Cloud – Docker**: ❌ Không dùng

---

## 3. Phạm vi phát triển

### 3.1 Những gì BẮT BUỘC trong MVP

* Đăng ký / đăng nhập (Employer, Worker, Admin)
* CRUD Job
* Apply job
* Accept / Reject worker
* Chuyển trạng thái job
* Review worker
* Khiếu nại
* Admin duyệt job và chứng chỉ
* Swagger UI để test API
* Automated tests (viết trước khi code)

### 3.2 Những gì KHÔNG làm trong MVP

* Frontend UI
* Thanh toán
* Chat realtime
* Recommendation system
* Dashboard phân tích phức tạp
* Scale / performance tuning

**Rule**: Nếu tính năng không phục vụ luồng cốt lõi → không làm.

---

## 4. Database – Nguyên tắc sử dụng SQLite

* Chạy **local only**
* Dùng **1 file SQLite duy nhất** cho app và test
* Không migration phức tạp
* Schema cố định trong MVP
* Thời gian lưu dưới dạng **Unix timestamp (milliseconds)**

---

## 5. Xử lý ảnh trong MVP

### 5.1 Nguyên tắc

* Không upload file
* Không cloud storage
* Không base64

### 5.2 Cách làm

* Ảnh được lưu sẵn ở local, ví dụ:

```
D:\FixingApp\IELTS_7.5.jpg
```

* Backend expose static folder:

```
/static/IELTS_7.5.jpg
```

* Database **chỉ lưu URL** dạng:

```
/static/IELTS_7.5.jpg
```

---

## 6. Authentication & Authorization

* JWT access token duy nhất
* Không refresh token
* Token gửi qua header:

```
Authorization: Bearer <token>
```

* Mỗi user chỉ có **1 role**:

  * EMPLOYER
  * WORKER
  * ADMIN

---

## 7. Testing strategy (Test First)

### 7.1 Nguyên tắc

* **Viết test trước khi code**
* Chỉ viết **integration tests**
* Không unit test trong MVP

### 7.2 Công cụ

* `jest`
* `supertest`

### 7.3 Phạm vi test

* Happy path cho toàn bộ luồng chính
* Các business rule quan trọng:

  * Không apply job đã `DA_XONG`
  * Không sửa job khi đã có worker
  * Không review 2 lần cho 1 job
  * Không accept hơn 1 worker

---

## 8. Swagger UI

* Chuẩn **OpenAPI 3.0**
* Viết bằng **file YAML** riêng
* Có example request / response
* Có Bearer Auth để test

Swagger dùng cho:

* Manual testing
* Demo
* Debug API

---

## 9. Project Structure (Final)

```
project-root/
├── src/
│   ├── app.js
│   ├── server.js
│   ├── config/
│   │   ├── db.js
│   │   ├── swagger.js
│   ├── modules/
│   │   ├── auth/
│   │   ├── users/
│   │   ├── jobs/
│   │   ├── applications/
│   │   ├── reviews/
│   │   ├── complaints/
│   │   ├── admin/
│   ├── middlewares/
│   ├── database/
│   │   └── migrations/
│   └── utils/
├── tests/
│   └── integration/
├── swagger/
│   └── swagger.yaml
├── package.json
└── README.md
```

---

## 10. Trình tự phát triển (BẮT BUỘC tuân theo)

1. Chốt tài liệu này
2. Viết **Swagger YAML**
3. Viết **integration tests** (fail)
4. Viết **SQLite DDL**
5. Viết code API
6. Chạy test tự động
7. Manual test bằng Swagger

---

## 11. Tiêu chí hoàn thành MVP

MVP được coi là hoàn thành khi:

* API chạy được local
* Toàn bộ test pass
* Swagger test được toàn bộ API
* Luồng nghiệp vụ chạy đúng

---

## 12. Ghi chú cuối cùng

Tài liệu này là **kim chỉ nam** cho toàn bộ giai đoạn MVP.

Mọi yêu cầu mới phải trả lời được câu hỏi:

> "Có cần thiết để chứng minh MVP chạy được không?"

Nếu không → **không làm**.
