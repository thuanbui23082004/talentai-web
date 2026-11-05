# Tích hợp hồ sơ ứng viên

Nguồn: Swagger `http://localhost:3002/swagger-ui/index.html#/`. Snapshot các endpoint liên quan ở `contracts/upstream/candidate-profile.openapi.json`; contract trình duyệt ở `contracts/openapi.yaml`.

## Luồng dữ liệu

Form → `services/profile.ts` → API client → BFF → candidate-profile service. Component không gọi backend trực tiếp. `career-mapping.ts` và `personal-mapping.ts` đổi tên trường giữa form và API. TanStack Query giữ dữ liệu theo user ID; mutation thành công invalidate đúng query rồi tải lại backend. Không tạo ID hoặc timestamp giả cho dữ liệu thật và không tự retry ghi.

`services/certificates.ts` tách riêng thao tác tạo tên và tải file. Nhóm GET kinh nghiệm/học vấn/chứng chỉ/kỹ năng đọc tuần tự: khi kiểm tra backend local, gọi đồng thời có lúc nhận 403 với body rỗng dù cùng token gọi tuần tự trả 200. Không tự retry 403 hoặc chuyển sang mock khi API thật lỗi.

| BFF | Backend | Hành vi |
| --- | --- | --- |
| `/candidate/profile` | `/api/v1/candidate/profile` | GET thông tin cá nhân, PUT cập nhật từng nhóm trường |
| `/candidate/experience` và `/{id}` | `/api/v1/candidate/experience` và `/{id}` | GET danh sách, POST thêm, PUT sửa, DELETE xóa |
| `/candidate/education` và `/{id}` | `/api/v1/candidate/education` và `/{id}` | GET danh sách, POST thêm, PUT sửa, DELETE xóa |
| `/candidate/skills` | `/api/v1/candidate/skills` | GET và PUT thay thế danh sách chuỗi |
| `/candidate/certificates` và `/{id}` | `/api/v1/candidate/certificates` và `/{id}` | GET danh sách, POST thêm, DELETE xóa |
| `/candidate/certificates/{id}/attachment` | `/api/v1/candidate/certificates/{id}/attachment` | POST multipart file, tối đa 5 MB |

Backend trả `{ success: true, data }`. BFF xác thực và bỏ envelope; danh sách lấy `data.items`, kỹ năng lấy `data.skills`. Schema kiểm tra dữ liệu phản hồi và loại bỏ `userId` khỏi model hiển thị. Các endpoint `/candidate/profile/*` cũ trong contract chưa triển khai không được dùng cho luồng này.

## Đồng bộ form

- Kinh nghiệm: `position` → `title`, địa điểm → `location`, cờ đang làm → `current`.
- Học vấn: `name` → `school`, `major` → `fieldOfStudy`, cờ đang học → `isStudying`. Bằng cấp là chuỗi tự do; giữ được các bằng cấp có sẵn ngoài danh mục gợi ý.
- Ngày hiển thị theo ngày/tháng/năm. Ngày mới gửi ISO UTC lúc 00:00; nếu chỉ sửa nội dung khác, giữ nguyên timestamp ban đầu. Ngày không nhập gửi null; đang làm/đang học gửi endDate null.
- Kỹ năng dùng mảng chuỗi, tối đa 100 ký tự/tên. Backend yêu cầu tối thiểu một kỹ năng; UI không cung cấp thao tác lưu danh sách rỗng.
- Chứng chỉ: form chỉ có tên và file bắt buộc. Tạo tên bằng POST JSON `{ name }`, sau đó POST multipart `file` vào `/{id}/attachment`. Nhận PDF, JPEG, PNG, WEBP, GIF tối đa 5 MB; kiểm tra tên/MIME/dung lượng ở client và chữ ký file ở BFF. Backend trả `attachmentUrl`, `attachmentFileName`, `attachmentContentType`; bỏ metadata lưu trữ nội bộ. Danh sách chỉ hiển thị tên và liên kết mở file.
- Không tự retry POST. Nếu tạo tên thành công nhưng tải file lỗi, form giữ ID, tên và file để thử lại đúng bản ghi. Đóng form rồi mở nút “Tải file chứng chỉ” trên bản ghi thiếu file cũng tải tiếp cùng ID. Tên đã tạo không chỉnh sửa trong form tải tiếp vì backend chưa có PUT metadata. Xóa chứng chỉ vẫn dùng DELETE `/{id}`.
- Mock lưu bytes file theo chủ sở hữu, phục vụ qua `/api/mock-media/{assetId}` với cookie xác thực; không dùng data URL hoặc URL giả thành công. Chỉ chính chủ đúng role được xem file. Xóa bản ghi mock đồng thời bỏ file khỏi bộ nhớ.

Thông tin cá nhân và giới thiệu đã lưu thật qua GET/PUT profile:

- `name` → `fullName`, `birthDate` → `dob` (ISO UTC, giữ timestamp nếu không đổi ngày). Dùng lại `LocationPicker` chọn tỉnh/thành và phường/xã. Khi gửi, `address` = phường/xã + tỉnh/thành, `location` = tên tỉnh/thành. Không có ô hoặc xử lý ghép địa chỉ chi tiết. Khi mở lại, nhận diện tỉnh/xã từ địa chỉ đã lưu để khôi phục lựa chọn, kể cả bản ghi cũ từng chứa địa chỉ chi tiết.
- Popup thông tin cá nhân có họ tên, email, điện thoại, ngày sinh, giới tính, địa chỉ và quyền riêng tư. Không nhập tiêu đề nghề nghiệp, URL avatar hoặc các thông tin nghề nghiệp ở popup này. Không gửi các trường đó trong PUT, tránh ghi đè dữ liệu được chỉnh sửa từ trang khác. Email/điện thoại ở đây là thông tin liên hệ trên hồ sơ, không thay đổi tài khoản đăng nhập ở auth-service.
- Giới thiệu bản thân → `summary`, tối đa 5.000 ký tự. Chỉ gửi trường thuộc nhóm đang sửa để tránh ghi đè phần khác.
- Backend nhận `searchable`, `showEmail`, `showPhone` nhưng trả `privacy.isSearchable`, `privacy.showEmail`, `privacy.showPhone`. BFF chuyển sang cờ phẳng theo contract FE, loại bỏ các metadata lưu trữ nội bộ.
- Kiểm tra trực tiếp ngày 2026-11-05: backend bỏ qua giá trị null khi cập nhật. Form chặn để trống ngày sinh đã có giá trị và báo lỗi tại trường đó. Chưa có API xóa giá trị này; chuỗi có thể cập nhật thành rỗng.
- Popup này không chỉnh sửa ảnh đại diện. Luồng upload file `/candidate/avatar` riêng chưa tích hợp trong tác vụ thông tin cá nhân này.

Dự án, ngoại ngữ và chọn CV vẫn là bản xem trước, có nhãn rõ. Cấu hình công việc tại trang riêng nằm ngoài tác vụ popup này.

## Quyền và lỗi

BFF xác minh token với auth-service và yêu cầu role candidate. Token chỉ ở cookie HttpOnly/server; không chấp nhận userId từ request body. POST/PUT/DELETE kiểm tra Origin và CSRF trước khi ghi. Backend tiếp tục kiểm tra sở hữu từng ID.

400/422 được chuẩn hóa thành lỗi validation, ánh xạ tên field về form. 401/403/404 giữ ý nghĩa xác thực/quyền/không tồn tại; lỗi mạng hoặc phản hồi sai trả 503. Không lộ message thô từ backend. Chỉ GET retry tối đa ba lần; ghi không retry. Form giữ dữ liệu khi thất bại và khóa trong khi gửi; xóa cần xác nhận. Loading/error chặn sửa để tránh ghi đè khi chưa tải được dữ liệu.

## Chạy và kiểm thử

`.env.example` mặc định mock. `.env.local` đã bật `PROFILE_DATA_MODE=real` với URL local ở cổng 3002. Đổi mode chỉ ảnh hưởng BFF, không đổi UI/service.

```powershell
$env:PROFILE_REAL_E2E='1'
$env:PROFILE_DATA_MODE='real'
npm.cmd run test:e2e -- tests/e2e/candidate-profile-real.spec.ts
npm.cmd run test:e2e -- tests/e2e/candidate-personal-profile.spec.ts
```

E2E tạo tài khoản ứng viên riêng, thao tác form và kiểm tra dữ liệu trực tiếp ở Java; kiểm tra tải lại, sửa giữ ID, thay thế kỹ năng, chứng chỉ, lỗi validation không mất dữ liệu, xác nhận xóa và chặn tài khoản khác. Kiểm tra giao diện ở 375px/1280px. Test mock kiểm tra loading/empty/error/retry, hủy sửa, popup và bàn phím DatePicker.
