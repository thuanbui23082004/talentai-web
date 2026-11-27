# Danh sách gói của nhà tuyển dụng

Trang `/recruiter/pricing` lấy `GET /api/bff/plans`; BFF gọi API công khai
`GET /api/v1/plans` của Subscription Service qua `BACKEND_API_URL`.
Đã đối chiếu Swagger tại `/docs/openapi/sub` và nhận phản hồi backend 200 ngày 27/11/2026.

- `SUBSCRIPTION_DATA_MODE=real`: dùng danh mục backend, lỗi không được thay bằng gói mẫu.
- `SUBSCRIPTION_DATA_MODE=mock`: fixture theo contract; hỗ trợ kịch bản empty/error/slow.
- Khi không cấu hình riêng, dùng `DATA_MODE`.

Tên, mô tả, giá, tiền tệ, thời hạn và quyền lợi lấy trực tiếp từ phản hồi.
Quyền lợi gồm `MAX_POSTS`, `JOB_DISPLAY_DAYS`, `CV_SEARCH_LIMIT`, `AI_MATCHING`;
giá trị 0/false giữ nguyên ý nghĩa, -1/UNLIMITED hiển thị không giới hạn.
ID gói seed được giữ nguyên kể cả khi không theo UUID version/variant chuẩn RFC.

Danh mục không có giá năm, ưu đãi hoặc số lượt AI cụ thể nên Bảng giá không tự tính
các giá trị này. Nút Xem quyền lợi mở chi tiết gói từ dữ liệu đã tải. Đã bổ sung
xác nhận mua, tạo đơn qua Payment Service, trang kết quả và kiểm tra kích hoạt gói;
chi tiết tại [Báo cáo luồng thanh toán](subscription-payment-flow.md).
Trang Khuyến mãi cũ vẫn là giao diện demo riêng.

Kiểm tra tập trung: `tests/unit/subscription-plans.test.ts`.
