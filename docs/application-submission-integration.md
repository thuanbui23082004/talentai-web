# Nộp hồ sơ ứng tuyển

Swagger: `http://localhost:3005/swagger-ui/index.html#/Ứng%20viên/submit`.
Snapshot phần submit: `contracts/upstream/application-submit.openapi.json`.

## Luồng code

1. `application-dialog.tsx`: chọn CV tài khoản/upload, nhập thư giới thiệu, validation và trạng thái gửi/thành công/lỗi.
2. `use-submit-application.ts`: mutation không retry POST, invalidate danh sách hồ sơ sau thành công.
3. `services/applications.ts`: gọi apiClient POST `/applications` kèm CSRF.
4. `server/bff/candidate/application-submission.ts`: xác thực candidate, CSRF/Origin, kiểm tra payload, gửi bearer token tới backend và chuẩn hóa lỗi/phản hồi.

Request chỉ có `jobId`, `resumeId` (ID bản ghi CV đang chọn, không phải cvId gốc) và `coverLetter` tùy chọn tối đa 10.000 ký tự.
Không gửi danh tính ứng viên, công ty, địa điểm hay các cờ đồng ý từ trình duyệt. Backend tự xác định chủ hồ sơ và lưu snapshot.
Form thật hiển thị địa điểm của tin, bỏ các lựa chọn AI/thỏa thuận minh họa vì API chưa có trường tương ứng.
Showcase `/ui/application` vẫn là giao diện minh họa, không gửi API nộp hồ sơ.
Tin minh họa trên dashboard chưa có jobId nên không thể nộp thật.

## Cấu hình

```dotenv
APPLICATION_DATA_MODE=real
APPLICATION_API_URL=http://localhost:3005/api/v1
```

Đã đặt trong `.env.local`. Các biến chỉ đọc tại server. Chế độ mock mặc định trong `.env.example` và Playwright.
PROFILE_DATA_MODE và JOB_DATA_MODE cấu hình độc lập cho CV/tin tuyển dụng.
Chỉ POST `/applications` được tích hợp trong thay đổi này; GET danh sách hồ sơ và luồng phỏng vấn hiện có vẫn theo tích hợp trước.

## Hành vi và kiểm thử

Khóa nộp/upload khi đang gửi, giữ nội dung khi lỗi, báo thành công khi backend trả 201 hợp lệ, đổi nút sang “Đã ứng tuyển”.
Không tự retry POST; backend chặn hồ sơ trùng với ALREADY_APPLIED. Các lỗi tin đóng, CV không hợp lệ và hồ sơ cá nhân thiếu thông tin được chuyển sang thông báo tiếng Việt.
Mock lưu bản ghi riêng từng tài khoản, kiểm tra CV thuộc chủ, tin đang mở và chống nộp trùng; danh sách mock đọc được bản ghi mới.

Unit: `tests/unit/application-submission.test.ts`. E2E: `tests/e2e/application-submit.spec.ts`, cùng các test popup/CV hiện có.

## Trạng thái backend thật ngày 06/11/2026

Đã gọi POST thật qua BFF và gọi trực tiếp application-service để đối chiếu. Backend trả
`503 DEPENDENCY_UNAVAILABLE`, thông báo `Job Service is unavailable`.
Application-service dùng gRPC tới Job Service (`clients.jobs.*`), độc lập với API HTTP công khai cổng 3004.
Cần kiểm tra kết nối gRPC, token dịch vụ và TLS/plaintext giữa hai service.
Chưa xác nhận nộp thật thành công; FE giữ form và hiển thị lỗi, không chuyển sang mock hoặc báo thành công giả.

Chạy lại sau khi backend hoạt động:

```powershell
$env:APPLICATION_REAL_E2E='1'
$env:APPLICATION_DATA_MODE='real'
$env:PROFILE_DATA_MODE='real'
$env:JOB_DATA_MODE='real'
npm.cmd run test:e2e -- tests/e2e/application-submit.spec.ts --timeout=90000
```

Lượt real dùng tài khoản kiểm thử riêng, đọc lại bản ghi, kiểm tra chống trùng và rút hồ sơ kiểm thử khi nộp thành công.
