# Nhật ký quản trị

## Trang và luồng

- Hệ thống → Nhật ký quản trị (`/admin/activity-logs`). Giữ khung admin, font, màu và các tab Hệ thống hiện có.
- Danh sách mới nhất trước, phân trang 10 dòng; tìm theo tên admin, mã đối tượng, lý do/ghi chú hoặc mã đơn hàng; lọc admin, hành động, loại đối tượng, kết quả và khoảng ngày theo giờ Việt Nam.
- Xem chi tiết trong trang: mã nhật ký, admin, hành động, thời điểm, đối tượng, kết quả và lý do. Có dữ liệu bổ sung đã biết cho đối soát/danh mục. Không có sửa hoặc xóa nhật ký.
- Chọn dòng sẽ đưa focus vào khung chi tiết. Đóng hoặc Escape trả focus về nút mở chi tiết. Có liên kết đến tài khoản/doanh nghiệp/tin/báo cáo/thanh toán/danh mục nếu loại và mã hợp lệ; đối tượng đã xóa có thể trả trang không tìm thấy.

## Dữ liệu và API

- Dùng GET `/admin/activity-logs` đã có trong hợp đồng, không thêm endpoint chi tiết hoặc thay đổi hợp đồng/schema tự sinh. Service qua API client, Zod ở biên dữ liệu, TanStack Query quản lý bản ghi; state UI chỉ giữ bộ lọc, trang và mã dòng đang mở.
- BFF mock hỗ trợ đầy đủ bộ lọc có trong hợp đồng, kiểm định tham số, so sánh timestamp có múi giờ, phân trang và sắp xếp. Vẫn kiểm quyền ở guard admin chung; POST không được phép.
- Trang chỉ hiển thị thao tác có role admin. Tìm kiếm giữ trong state, không đưa ghi chú/từ khóa lên URL. Chỉ trình bày các trường metadata đã định nghĩa, không xuất JSON tùy ý chứa token, CV hoặc dữ liệu ngoài phạm vi.
- Liên kết đối tượng chỉ tạo từ loại được cho phép và UUID hợp lệ. Hành động/loại lạ dùng nhãn thay thế, không ghép dữ liệu tùy ý thành đường dẫn.
- Bổ sung fixture lịch sử thành công/thất bại và hai admin giả để thử lọc, phân trang. Dùng chung kho nhật ký với các thao tác tài khoản, doanh nghiệp, tin, danh mục, báo cáo và đối soát; không nhân bản log cho trang mới.
- Hiện chạy mock. Dữ liệu trong tiến trình server, reset khi server khởi động lại. Không sửa giao diện recruiter hoặc thêm thư viện.

## Xác minh

- 133/133 kiểm thử Vitest đạt, gồm 6 kiểm thử mới về lọc/ngày giờ, metadata/đường dẫn an toàn, API phân trang/bộ lọc, tham số không hợp lệ, quyền/chỉ đọc và thứ tự các sự kiện trùng timestamp.
- Thời điểm hoàn tất báo cáo được ghi sau thao tác xử lý đối tượng. Sắp xếp ổn định giữ thứ tự phát sinh khi các sự kiện trùng mili giây; bổ sung kiểm tra quan hệ thời gian giữa log đối tượng và log hoàn tất báo cáo.
- Typecheck, lint và build production đạt; build chạy lại theo nhắc nâng cấp bảo mật có sẵn từ Next.js. Không đổi dependency.
- Playwright: 16/16 luồng admin đạt trên production cuối, gồm 2 luồng mới cho nhật ký và 14 luồng hồi quy. Đã kiểm tra phân trang, lọc kết hợp, xem/đóng chi tiết, focus/Escape, mở đối tượng, sự kiện mới từ thao tác danh mục, rỗng, lỗi/thử lại và hết phiên.
- Đã xem ảnh danh sách desktop/mobile và chi tiết ở 360px. Trang không tràn ngang, bảng cuộn trong khung. Không thêm nút sửa/xóa nhật ký.
