# Tích hợp hồ sơ ứng viên

Nguồn: Swagger `http://localhost:3002/swagger-ui/index.html#/`. Snapshot các endpoint liên quan ở `contracts/upstream/candidate-profile.openapi.json`; contract trình duyệt ở `contracts/openapi.yaml`.

## Luồng dữ liệu

Form → `services/profile.ts` → API client → BFF → candidate-profile service. Component không gọi backend trực tiếp. `career-mapping.ts` là nơi duy nhất đổi tên trường giữa form và API. TanStack Query giữ dữ liệu theo user ID; mutation thành công invalidate đúng query rồi tải lại backend. Không tạo ID hoặc timestamp giả cho dữ liệu thật và không tự retry ghi.

| BFF | Backend | Hành vi |
| --- | --- | --- |
| `/candidate/experience` và `/{id}` | `/api/v1/candidate/experience` và `/{id}` | GET danh sách, POST thêm, PUT sửa, DELETE xóa |
| `/candidate/education` và `/{id}` | `/api/v1/candidate/education` và `/{id}` | GET danh sách, POST thêm, PUT sửa, DELETE xóa |
| `/candidate/skills` | `/api/v1/candidate/skills` | GET và PUT thay thế danh sách chuỗi |
| `/candidate/certificates` và `/{id}` | `/api/v1/candidate/certificates` và `/{id}` | GET danh sách, POST thêm, DELETE xóa |

Backend trả `{ success: true, data }`. BFF xác thực và bỏ envelope; danh sách lấy `data.items`, kỹ năng lấy `data.skills`. Schema kiểm tra dữ liệu phản hồi và loại bỏ `userId` khỏi model hiển thị. Các endpoint `/candidate/profile/*` cũ trong contract chưa triển khai không được dùng cho luồng này.

## Đồng bộ form

- Kinh nghiệm: `position` → `title`, địa điểm → `location`, cờ đang làm → `current`.
- Học vấn: `name` → `school`, `major` → `fieldOfStudy`, cờ đang học → `isStudying`. Bằng cấp là chuỗi tự do; giữ được các bằng cấp có sẵn ngoài danh mục gợi ý.
- Ngày hiển thị theo ngày/tháng/năm. Ngày mới gửi ISO UTC lúc 00:00; nếu chỉ sửa nội dung khác, giữ nguyên timestamp ban đầu. Ngày không nhập gửi null; đang làm/đang học gửi endDate null.
- Kỹ năng dùng mảng chuỗi, tối đa 100 ký tự/tên. Backend yêu cầu tối thiểu một kỹ năng; UI không cung cấp thao tác lưu danh sách rỗng.
- Chứng chỉ: tên, tổ chức cấp, mã, link HTTP(S), ngày cấp/hết hạn. API hiện chưa có PUT chứng chỉ hoặc upload ảnh; không dùng xóa/tạo lại để giả lập sửa. Không nhập ngày hết hạn tương ứng null.

Các mục thông tin cá nhân, giới thiệu, dự án, ngoại ngữ và chọn CV giữ hành vi xem trước hiện có, được ghi rõ trên trang và form. Chưa tích hợp các API đó trong tác vụ này.

## Quyền và lỗi

BFF xác minh token với auth-service và yêu cầu role candidate. Token chỉ ở cookie HttpOnly/server; không chấp nhận userId từ request body. POST/PUT/DELETE kiểm tra Origin và CSRF trước khi ghi. Backend tiếp tục kiểm tra sở hữu từng ID.

400/422 được chuẩn hóa thành lỗi validation, ánh xạ tên field về form. 401/403/404 giữ ý nghĩa xác thực/quyền/không tồn tại; lỗi mạng hoặc phản hồi sai trả 503. Không lộ message thô từ backend. Chỉ GET retry tối đa ba lần; ghi không retry. Form giữ dữ liệu khi thất bại và khóa trong khi gửi; xóa cần xác nhận. Loading/error chặn sửa để tránh ghi đè khi chưa tải được dữ liệu.

## Chạy và kiểm thử

`.env.example` mặc định mock. `.env.local` đã bật `PROFILE_DATA_MODE=real` với URL local ở cổng 3002. Đổi mode chỉ ảnh hưởng BFF, không đổi UI/service.

```powershell
$env:PROFILE_REAL_E2E='1'
$env:PROFILE_DATA_MODE='real'
npm.cmd run test:e2e -- tests/e2e/candidate-profile-real.spec.ts
```

E2E tạo tài khoản ứng viên riêng, thao tác form và kiểm tra dữ liệu trực tiếp ở Java; kiểm tra tải lại, sửa giữ ID, thay thế kỹ năng, chứng chỉ, lỗi validation không mất dữ liệu, xác nhận xóa và chặn tài khoản khác. Kiểm tra giao diện ở 375px/1280px. Test mock kiểm tra loading/empty/error/retry, hủy sửa, popup và bàn phím DatePicker.
