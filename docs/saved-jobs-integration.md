# Tích hợp việc làm đã lưu

Nguồn API: `http://localhost:3004/swagger-ui/index.html#/`, snapshot phần liên quan trong `contracts/upstream/job-posting.openapi.json`.

Frontend gọi BFF cùng origin. BFF xác minh phiên với auth-service, chỉ cho role `candidate`, rồi gửi bearer token tới job-posting. Thao tác ghi kiểm tra CSRF và Origin. Không chuyển cookie hoặc token ra client, không tự retry ghi.

| Frontend/BFF | Backend job-posting |
| --- | --- |
| GET `/candidate/saved-jobs?page=1&pageSize=100` | GET `/api/v1/saved-jobs?page=0&size=100` |
| PUT `/candidate/saved-jobs/{jobId}` | POST `/api/v1/saved-jobs` với `{ jobPostId }` |
| DELETE `/candidate/saved-jobs/{jobId}` | DELETE `/api/v1/saved-jobs?jobPostId=...` |

Lưu thành công trả `{ jobPostId, saved: true }`; bỏ lưu trả 204 không có body. UI cập nhật bằng danh sách backend sau mỗi lần ghi. Lỗi bỏ lưu giữ nguyên mục trong danh sách; người dùng có thể thử lại. Trang danh sách hỗ trợ hoàn tác bằng thao tác lưu lại.

Danh sách backend chỉ hỗ trợ phân trang. Service frontend tải các trang trước khi tìm kiếm, lọc và phân trang giao diện. Giữ nguyên thời gian `savedAt` backend; không tạo thời gian lưu giả. Job dùng cùng mapper với danh sách/chi tiết công khai. Backend chưa trả tên/logo công ty hay trạng thái tuyển dụng; UI dùng nhãn tên chưa cập nhật, nhận biết quá hạn từ deadline, không suy đoán trạng thái paused/closed.

Đặt `JOB_DATA_MODE=real` và `JOB_API_URL=http://localhost:3004/api/v1` để dùng backend thật cho cả jobs và saved-jobs. Chế độ mock giữ contract giống real.

Nút trái tim trên thẻ và nút Lưu tin ở trang chi tiết dùng chung service. Chưa đăng nhập chuyển tới đăng nhập; tài khoản khác candidate không được lưu.

Kiểm thử backend thật bằng PowerShell:

```powershell
$env:JOB_REAL_E2E='1'
$env:JOB_DATA_MODE='real'
npm.cmd run test:e2e -- tests/e2e/saved-jobs-real.spec.ts
```

Test tạo tài khoản ứng viên riêng, dùng một job công khai có sẵn, kiểm tra dữ liệu trực tiếp ở Java, tải lại trang, cách ly tài khoản, lỗi bỏ lưu, hoàn tác và giao diện 375px/desktop. Test kết thúc bằng bỏ lưu job của tài khoản kiểm thử.
