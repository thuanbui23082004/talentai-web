# Giám sát hệ thống

## Trang và luồng

- Hệ thống → Giám sát hệ thống (`/admin/monitoring`), dùng khung admin, token màu và cỡ chữ hiện có. Hai mục trong trang: nhật ký hệ thống và hoạt động bất thường.
- Nhật ký: tìm theo nội dung/nguồn/mã yêu cầu, lọc mức nhật ký, nguồn và khoảng ngày theo giờ Việt Nam; phân trang 10 dòng và xem chi tiết trong trang.
- Cảnh báo: tìm theo nội dung/mã cảnh báo/mã tài khoản; lọc loại, mức độ và trạng thái. Chi tiết có mô tả, thời điểm, thông tin ghi nhận được cho phép và liên kết tài khoản liên quan.
- Cảnh báo chưa xem xét → chọn đã xem xét hoặc bỏ qua → nhập ghi chú → xem lại và xác nhận → cập nhật trạng thái, thông báo và bổ sung nhật ký quản trị dùng chung.
- Giữ chi tiết cảnh báo sau cập nhật dù bộ lọc trạng thái làm dòng biến mất khỏi danh sách. Cảnh báo đã xử lý chỉ đọc; lỗi cập nhật giữ ghi chú và cho thử lại.
- Có trạng thái tải, lỗi/thử lại, rỗng và thành công; hết phiên có liên kết đăng nhập. Các số tổng hợp chỉ dựa trên dữ liệu đã tải, lỗi tải hiển thị dấu gạch thay vì số 0.

## Phạm vi dữ liệu

- Dùng GET `/admin/system-logs`, GET `/admin/anomalies` và PATCH `/admin/anomalies/{anomalyId}` đã có trong hợp đồng. Không sửa hợp đồng, middleware, thư viện hoặc giao diện recruiter.
- Dữ liệu mẫu nằm trong fixtures; mock BFF kiểm quyền và CSRF, kiểm định bộ lọc/phân trang, chặn xử lý lặp và ghi đúng một sự kiện cho một cập nhật thành công.
- API cho phép ghi chú tùy chọn theo hợp đồng; form giao diện yêu cầu ghi chú 1–1.000 ký tự để người thao tác giải thích kết quả.
- API client và Zod ở biên dữ liệu, TanStack Query lưu dữ liệu tải về; bộ lọc không đưa nội dung lên URL. Không hiển thị metadata tùy ý; evidence chỉ nhận số hoạt động, thời lượng và nguồn đã biết.
- Xem xét cảnh báo không tự khóa tài khoản, thay đổi quyền hay quyết định tuyển dụng. Không bổ sung các chỉ số sức khỏe hạ tầng chưa có API.
- Trạng thái giả lập được giữ trong tiến trình server và reset khi khởi động lại; chưa kết nối backend thật.

## Kiểm tra

- Vitest: 137/137 đạt, gồm 4 kiểm thử mới cho bộ lọc, kiểm định dữ liệu, API, cập nhật/nhật ký, quyền và CSRF.
- Typecheck, lint và production build đạt. Build chạy lại theo lời nhắc bảo mật hiện có của Next.js; chưa thay đổi dependency.
- Playwright: hai luồng trang mới đạt (lọc/chi tiết/ngày/rỗng/lỗi/thử lại/mobile; ghi chú bắt buộc/xác nhận/cập nhật lỗi/thử lại/lưu trạng thái/nhật ký). Toàn bộ lần chạy có 17/18 đạt; một luồng nhật ký cũ timeout trong lần chạy kéo dài bất thường, chạy lại riêng trên server mới đạt trong 6,6 giây, không cần sửa mã.
- Đã xem ảnh danh sách desktop và chi tiết cảnh báo ở 360px: bố cục dùng đúng khung admin, trang không tràn ngang; bảng cuộn bên trong.
