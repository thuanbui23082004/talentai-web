# Sửa tin, xóa tin và đăng bản nháp — đã triển khai theo kế hoạch được duyệt

## Phạm vi giao diện

- Thêm `/recruiter/jobs/[jobId]/edit`, mở bằng nút “Chỉnh sửa tin” tại trang chi tiết.
- Dùng lại form tạo tin, nạp dữ liệu từ GET chi tiết; đổi tiêu đề/nút lưu và điều hướng phù hợp chế độ sửa, không tạo bộ form JD trùng lặp.
- Giữ khung Recruiter, khoảng cách và responsive hiện có. Có loading, không tìm thấy, lỗi/thử lại và lưu thành công. Lỗi lưu giữ nguyên dữ liệu đã nhập.
- Nút “Xóa tin” trong chi tiết mở xác nhận rõ tên tin; hủy không gọi API. Thành công quay về danh sách và làm mới dữ liệu.
- Nút “Đăng tin” chỉ hiện cho bản nháp; mở xác nhận trước khi gửi, khóa thao tác lặp khi đang lưu.
- Chỉ thực hiện ba chức năng được yêu cầu; chưa mở rộng sang AI hoặc sửa toàn bộ các thao tác pause/reopen/close trong lần này.

## API hiện có

| Chức năng | API |
|---|---|
| Nạp tin để sửa | GET /recruiter/jobs/{jobId} |
| Lưu chỉnh sửa | PUT /recruiter/jobs/{jobId} |
| Xóa mềm | DELETE /recruiter/jobs/{jobId} |
| Đăng bản nháp | POST /recruiter/jobs/{jobId}/publish |

- Dùng apiClient, Zod và TanStack Query; bổ sung mock tương ứng trong BFF hiện có. Không đổi contracts, type sinh tự động, middleware, env, lockfile hoặc component shadcn. Không thêm thư viện.
- Form sửa phải bảo toàn các trường JobInput đã lưu mà form chưa hỗ trợ chỉnh trực tiếp, như hiringRounds, currency/period của salary, maxExperienceYears, ID kỹ năng/vị trí. Kiểm tra chuyển đổi hai chiều, không ghi đè ngầm bằng default của form tạo.
- Tin locked không cho sửa; xử lý INVALID_STATUS_TRANSITION bằng thông báo tiếng Việt.
- Lưu tin open có thể nhận pending_review từ API; hiển thị trạng thái response, không tự báo vẫn đang tuyển.
- Publish yêu cầu công ty đã xác thực. Xử lý COMPANY_NOT_VERIFIED và trạng thái không hợp lệ. Mock chuyển draft sang pending_review; không báo tin đã công khai khi còn chờ duyệt.
- Xóa mềm giữ hồ sơ ứng tuyển và dữ liệu liên quan. Mock đánh dấu tin đã xóa, ẩn khỏi danh sách/chi tiết quản lý nhưng giữ bản ghi cần thiết để kiểm quyền và đọc hồ sơ ứng tuyển; không xóa dây chuyền ứng viên.
- Kiểm session/vai trò/doanh nghiệp và CSRF cho mutation. Sau lưu/publish làm mới cache chi tiết/danh sách; sau xóa loại cache chi tiết phù hợp và làm mới danh sách, không xóa hồ sơ ứng viên.

## File và kiểm tra

- Route edit mới, mở rộng form/schema chuyển đổi/service/hooks/errors/messages của feature jobs hiện có.
- Thêm thao tác vào chi tiết tin; mở rộng BFF allowlist/mock handler và store xóa mềm trong phạm vi quản lý tin.
- Vitest cho chuyển đổi dữ liệu form, bảo toàn trường, kiểm quyền, trạng thái và giữ hồ sơ sau xóa.
- Playwright mock cho sửa/lưu/hủy, lỗi giữ nội dung, xác nhận xóa, publish thành công/chưa xác thực, đồng bộ danh sách/chi tiết và mobile 360px.
- Chạy `pnpm typecheck` và `pnpm lint`, báo kết quả thật.

## Kết quả triển khai

- Thêm route edit, dùng lại form tạo tin với dữ liệu GET; có lưu/hủy và chặn tin locked. Các input chưa thuộc hợp đồng không được đưa vào chế độ sửa.
- Thêm Chỉnh sửa tin, Xóa tin và Đăng tin ở chi tiết. Xóa/đăng đều có xác nhận, lỗi có thể thử lại. Publish dùng trạng thái API trả về, mock chuyển sang pending_review.
- Bổ sung schema boundary cho position, requiredSkills, educationLevel và maxExperienceYears đã có trong spec. Bảo toàn vị trí, vòng, ID/độ bắt buộc kỹ năng, locationId khi thành phố không đổi, lương/đơn vị/kỳ lương và các trường không hiện trên form.
- Mock giữ bản ghi tin khi xóa mềm để hồ sơ/CV đã nhận vẫn kiểm quyền được; danh sách và GET tin quản lý không còn trả tin đã xóa.
- TypeScript và ESLint đạt. Vitest 57/57 đạt. Playwright 7/7 đạt: 5 ca quản lý tin và 2 ca hồi quy tạo tin. Đã xem ảnh desktop/mobile 360px.
- Không sửa hợp đồng, middleware, env, lockfile, file type sinh tự động hoặc component shadcn. Không thêm dependency. Kiểm tra với mock, chưa xác minh backend thật.
- Next.js tiếp tục hiển thị nhắc nâng cấp bảo mật đã được ghi nhận trước đây; chạy lại lệnh cho phép kiểm thử tiếp tục. Không nâng cấp trong tính năng này.
