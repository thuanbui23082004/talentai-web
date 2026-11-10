user: admin@example.test
pass: TalentAI2026!
# Quản lý tài khoản admin

## Phạm vi

- `/admin/users`: danh sách ứng viên/nhà tuyển dụng, tìm theo tên/email, lọc vai trò/trạng thái, phân trang.
- `/admin/users/[userId]`: Ithông tin, trạng thái, thống kê hoạt động, lý do khóa và lịch sử xử lý gần đây.
- Tài khoản → Người dùng dùng route thật; giữ sidebar năm nhóm và các tab hiện có. Các trang đều kiểm phiên admin phía server.
- Khóa/mở khóa: nhập lý do (không rỗng, tối đa 1.000 ký tự), kiểm tra lại tài khoản/lý do, xác nhận. Có hủy và sửa lý do; lỗi không làm mất nội dung nhập.
- Không thêm xóa tài khoản, sửa thông tin hoặc phân quyền. Không sửa giao diện recruiter.

## Dữ liệu và API

- Chỉ sử dụng endpoint có sẵn trong contract: danh sách/chi tiết user, lock, unlock, activity và activity-logs. Mở khóa gửi lý do ở trường `note` theo spec.
- Client lấy các trang dữ liệu qua API client, Zod và TanStack Query; tìm kiếm/lọc/phân trang bảng được xử lý trên bộ dữ liệu đã tải. Không đưa từ khóa có thể chứa email lên URL. Phương án này phục vụ phạm vi frontend/mock; với dữ liệu lớn cần thống nhất cơ chế tìm kiếm bảo đảm quyền riêng tư với backend.
- Fixture giả ở `src/mocks/fixtures/admin-users.ts`. Store mock dùng chung tài khoản đã tồn tại của recruiter; thay đổi trạng thái chỉ tác động khi admin chủ động khóa/mở khóa đúng tài khoản đó.
- Mutation kiểm role admin và CSRF, thu hồi phiên tài khoản bị khóa; không cho thao tác admin hoặc tự khóa tài khoản đang thực hiện. Request không hợp lệ không tạo nhật ký.
- Cập nhật trạng thái và ghi log cùng trong mock handler; nhật ký gồm actor, target, action, timestamp và reason. Chi tiết tài khoản và hoạt động gần đây trên dashboard dùng cùng store nhật ký.
- Sau mutation đồng bộ query danh sách, chi tiết, lịch sử, nhật ký và tổng quan. Mock lưu trong bộ nhớ, reset khi server khởi động lại.

## Giao diện

- Token màu admin, Inter; nội dung 14px, tiêu đề 16–20px. Bảng cuộn trong container, responsive từ 360px.
- Loading skeleton, danh sách rỗng/không có kết quả, không tìm thấy tài khoản, lỗi/thử lại, hết phiên và thông báo thành công.
- Form RHF + Zod; dùng Input, Textarea và Button có sẵn. Bước nhập lý do và xác nhận đặt ngay trong trang chi tiết.

## Kiểm tra

- Vitest: 101/101 đạt (gồm bộ lọc, validation lý do, phân trang, kiểm quyền/CSRF, thu hồi phiên, trạng thái và nhật ký).
- Playwright: 5/5 kịch bản admin đạt trên dev server, gồm quản lý tài khoản và hồi quy đăng nhập/dashboard/tách phiên recruiter.
- Typecheck và ESLint đạt. Đã xem ảnh danh sách desktop/mobile và chi tiết mobile 360px, không tràn ngang toàn trang.
- Chỉ kiểm chứng mock, chưa kết nối backend thật.
- Build production đạt; 2/2 kịch bản quản 
+lý tài khoản cũng đạt khi chạy trên production server. Đã xem lại ảnh chi tiết mobile sau kiểm tra.
