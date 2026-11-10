# Quản lý thanh toán (giao diện minh họa)

## Trang và luồng

- Tài chính → Thanh toán (`/admin/payments`): tìm theo mã đơn/mã giao dịch/người mua/doanh nghiệp; lọc trạng thái thanh toán, đối soát, khoảng ngày theo giờ Việt Nam; phân trang. Thẻ số liệu phản ánh bộ lọc hiện tại.
- `/admin/payments/[paymentId]`: đơn hàng, người mua, doanh nghiệp, gói, số tiền, phương thức, thời điểm, trạng thái, thông tin lỗi và lịch sử đối soát.
- Ghi nhận đối soát → chọn cần kiểm tra thêm/đã xác minh → nhập ghi chú → kiểm tra lại → xác nhận. Có sửa/hủy, giữ ghi chú khi lỗi và thông báo khi thành công.
- Ghi nhận đối soát chỉ thay đổi kết quả kiểm tra. Không đổi trạng thái thanh toán, không thu/hoàn tiền hoặc cấp/thay đổi gói dịch vụ. Đơn thành công, đã hủy hoặc đã xác minh chỉ xem thông tin.
- Dùng lại khung admin, font Inter, token màu, component form có sẵn. Có loading, rỗng, lỗi/thử lại, không tìm thấy, hết phiên và thành công; hỗ trợ 360px, bảng cuộn bên trong.

## Giới hạn API và cách chạy demo

- Hợp đồng hiện tại chưa có endpoint/schema thanh toán. Không sửa hợp đồng, schema sinh tự động, không đoán REST endpoint hoặc payload cho backend.
- Các kiểu `PaymentDemoRecord` được ghi rõ là mô hình trình bày demo, không phải API contract. Dữ liệu giả đặt trong `src/mocks/fixtures/admin-payments.ts`.
- Ngoại lệ có phạm vi cho giao diện chưa có API: service dùng cầu nối Server Functions của Next.js đến mock trong BFF, thay vì openapi-fetch. Đây không phải endpoint REST mới cho backend. Khi có hợp đồng được duyệt, thay cầu nối bằng API client và generated types; không coi demo là tích hợp backend đã hoàn thành.
- Chỉ BFF kiểm tra chế độ mock/real. Cầu nối từ chối trong real, không tự hiển thị dữ liệu giả thay dữ liệu thật. Mọi lần đọc/ghi đều kiểm phiên admin phía server; Server Functions sử dụng bảo vệ same-origin của Next.js. Không đọc token bằng JavaScript, không đưa ghi chú/từ khóa lên URL.
- BFF lưu demo trong bộ nhớ tiến trình, giữ sau tải lại trang và reset khi server khởi động lại. TanStack Query quản lý bản ghi phía UI; form RHF/Zod, dữ liệu nhận qua Zod. Không thêm thư viện hoặc sửa giao diện recruiter.
- Xác nhận gửi kèm phiên bản bản ghi: dữ liệu cũ, xác nhận lặp, ghi chú sai hoặc trạng thái không hợp lệ bị chặn mà không thêm lịch sử/nhật ký. Thành công thêm `payment.reconcile` vào nhật ký admin chung, hiển thị trên dashboard.
- Các bộ lọc không làm thay đổi dữ liệu; ngày lọc theo `Asia/Ho_Chi_Minh`, bao gồm cả ngày đầu và ngày cuối.

## Kiểm tra

- Typecheck, ESLint và build production đạt.
- Vitest: 127/127 đạt; thêm 4 kiểm thử về bộ lọc/ngày giờ, ghi nhận và bảo toàn giao dịch, phiên bản cũ/xác nhận lặp, trạng thái và ghi chú không hợp lệ.
- Playwright: 2/2 luồng thanh toán đạt trên bản production cuối; 12 luồng admin cũ đã qua hồi quy. Kiểm tra tìm/lọc/phân trang, ngày không hợp lệ, ghi chú bắt buộc, sửa/xác nhận, lỗi mạng/thử lại giữ nội dung, dữ liệu sau reload, nhật ký dashboard, giao dịch chỉ đọc, hết phiên không ghi dữ liệu và không tìm thấy đơn.
- Đã xem ảnh danh sách desktop/mobile và xác nhận đối soát trên 360px; không tràn ngang cả trang, bảng cuộn trong khung. Cột ngày và thao tác không ngắt dòng. Typecheck và lint được chạy lại sau chỉnh sửa cuối và đều đạt.
