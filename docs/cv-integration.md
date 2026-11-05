# Tích hợp quản lý CV ứng viên

Nguồn API: Swagger profile-service cổng 3002, nhóm **Candidate Resumes (CVs)**. Contract BFF ở `contracts/openapi.yaml`; snapshot ở `contracts/upstream/candidate-profile.openapi.json`.

## Các thao tác đã nối

| BFF | Backend | Hành vi |
| --- | --- | --- |
| GET `/cvs` | GET `/api/v1/cvs` | Danh sách CV theo tài khoản, mới nhất trước |
| POST `/cvs` | POST `/api/v1/cvs` | Upload multipart `file`, PDF/DOCX tối đa 5 MB |
| GET `/cvs/{cvId}` | GET `/api/v1/cvs/{id}` | Chi tiết metadata và URL mở file gốc |
| PATCH `/cvs/{cvId}/default` | PATCH `/api/v1/cvs/{id}/default` | Đặt mặc định, response 204, không có body |
| DELETE `/cvs/{cvId}` | DELETE `/api/v1/cvs/{id}` | Xóa CV, response 204 |

`cvId` trong tham số BFF là **id của bản ghi** backend trả về, không phải trường `cvId` gốc của chuỗi phiên bản. Chưa mở luồng tạo phiên bản mới hoặc sửa metadata.

Backend trả `{ success: true, data }`, danh sách nằm ở `data.items`. BFF bỏ envelope, kiểm tra dữ liệu qua Zod và chỉ chuyển các trường cần hiển thị: `id`, `cvId`, `fileName`, `cvTitle`, `fileUrl`, `contentType`, `sizeBytes`, `version`, `isDefault`, `createdAt`. Không chuyển `userId`, storage provider hoặc Cloudinary public ID ra model UI.

## Luồng frontend

Component → `hooks/use-cvs.ts` → `services/cvs.ts` → API client → BFF → profile-service. Mode sử dụng `PROFILE_DATA_MODE` và URL `PROFILE_API_URL`, cùng cấu hình hồ sơ ứng viên. Không gọi backend trực tiếp từ trình duyệt.

- Nhấn toàn bộ box tải CV (hoặc Enter/Space khi focus) để chọn file, hoặc kéo thả một file vào box. File hợp lệ tự tải lên ngay, không cần bước xác nhận riêng. Box đổi màu khi kéo vào; khi tải có spinner, tên file và thanh tiến trình không xác định (không hiển thị phần trăm giả). Khóa thao tác upload, chặn gửi trùng; lỗi giữ file với nút “Thử lại”. Thành công tải lại danh sách và số lượng.
- CV đầu tiên do backend tự đặt mặc định. Đổi mặc định đọc lại dữ liệu backend để chỉ có một CV mặc định. Không dùng switch quyền tìm kiếm để giả lập mặc định.
- Chi tiết lấy bằng API riêng, có loading/error/retry, hiển thị tên/định dạng/dung lượng/phiên bản/ngày tải. Link “Mở file CV gốc” dùng URL được backend trả về. DOCX có thể được tải xuống để mở bằng ứng dụng đọc tài liệu.
- Xóa cần xác nhận, lỗi giữ popup để thử lại. Nếu xóa CV mặc định, backend tự chọn bản còn lại gần nhất; FE invalidate và đọc lại danh sách. Không suy diễn hoặc gán mặc định cục bộ trước khi backend thành công.
- Danh sách phân trang phía client vì API trả toàn bộ items. Trang cuối được điều chỉnh sau khi xóa. Tài khoản mới hiển thị empty state; lỗi tải có nút thử lại.
- Số lượng CV lấy từ API. Không đặt giới hạn 5 CV cho tài khoản hoặc hiển thị số lượt xem/cơ hội minh họa như dữ liệu thật.

Thư viện 6 mẫu và editor HTML/CSS được giữ trong `cv-template-studio.tsx`, chỉ là bản nháp cục bộ. Không trộn hai CV mẫu cũ vào danh sách tải lên. Bản nháp từ mẫu được ghi rõ chưa lưu vào tài khoản. Chấm ATS, tối ưu JD, xuất PDF và lưu template lên server nằm ngoài tác vụ này.

## Bảo mật và mock

BFF xác thực candidate qua auth-service; ghi kiểm tra Origin và CSRF. Backend kiểm tra quyền sở hữu từng CV. Chỉ GET retry tối đa ba lần; POST/PATCH/DELETE không tự retry. Multipart được tạo mới để fetch sinh boundary, không sao chép Content-Type của trình duyệt. Lỗi backend được chuẩn hóa, không lộ exception hoặc storage metadata.

Client kiểm tra phần mở rộng, MIME, file không trống và tối đa 5 MB. BFF kiểm tra thêm chữ ký PDF, hoặc cấu trúc ZIP có `[Content_Types].xml` và `word/document.xml` cho DOCX. Không giải nén hoặc thực thi nội dung file.

Mock cùng contract: lưu CV theo từng user, bytes file trong mock media có ownerRole=candidate, mặc định đầu tiên và gán lại khi xóa. File mock chỉ chính chủ xem được qua cookie xác thực. Không trả URL giả hoặc thành công khi upload chưa được lưu.

## Kiểm thử

- `tests/unit/cv-api.test.ts`: contract response, multipart, chữ ký file, giới hạn, auth/CSRF/role, mặc định, xóa và cách ly tài khoản.
- `tests/e2e/cv-upload.spec.ts`: PDF/DOCX, lỗi và thử lại upload/xóa, chi tiết, mặc định, reload, tự gán lại khi xóa, tài khoản khác và giao diện 375/1280.
- `tests/e2e/cv-management.spec.ts`: giữ thư viện mẫu, validation/editor/preview và bản nháp tách khỏi CV tài khoản.

Chạy với backend local:

```powershell
$env:PROFILE_DATA_MODE='real'
$env:PROFILE_REAL_E2E='1'
npm.cmd run test:e2e -- tests/e2e/cv-upload.spec.ts
```

Kiểm tra ngày 2026-11-05: đủ 5 thao tác với API thật thành công, bao gồm PDF và DOCX, thay đổi mặc định và tự gán lại mặc định sau xóa.
