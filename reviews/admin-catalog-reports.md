# Danh mục và báo cáo người dùng

## Giao diện và luồng

- Nội dung → Danh mục (`/admin/catalog`): bốn nhóm ngành nghề, vị trí việc làm, kỹ năng, địa điểm; tìm tên, lọc trạng thái, phân trang, thêm/sửa/ngừng sử dụng và xác nhận xóa. Có lựa chọn danh mục cha, ngành nghề liên quan và tên gọi khác cho kỹ năng.
- Nội dung → Báo cáo người dùng (`/admin/reports`): thống kê trạng thái, tìm kiếm cục bộ, lọc trạng thái/loại/đối tượng, sắp xếp, phân trang; mở `/admin/reports/[reportId]` để đọc phản ánh, thông tin người báo cáo, nội dung chụp tại thời điểm báo cáo và lịch sử.
- Tiếp nhận → chọn hướng xử lý → nhập ghi chú, phản hồi tùy chọn → kiểm tra lại → xác nhận. Thất bại giữ nội dung để thử lại; thành công cập nhật đối tượng, báo cáo, nhật ký và dashboard. Báo cáo đã đóng không được xử lý lặp.
- Tái sử dụng khung admin, token màu, font và component có sẵn. Có skeleton, rỗng, lỗi/thử lại, thông báo thành công; bảng cuộn trong khung trên mobile.

## Phạm vi mock

- Dùng các endpoint danh mục/báo cáo đã có trong hợp đồng, không đổi spec hoặc dependency.
- Danh mục dùng chung với BFF tuyển dụng. Ngừng sử dụng ẩn mục khỏi danh sách lựa chọn mới nhưng giữ tham chiếu lịch sử. Mục đang được dùng hoặc có danh mục con không thể xóa. Chặn tên trùng và vòng lặp danh mục cha; đổi tên đồng bộ các tham chiếu mock.
- Tin tuyển dụng hỗ trợ ẩn/khóa/xóa; tài khoản hỗ trợ ghi nhận cảnh báo/khóa; doanh nghiệp hỗ trợ đình chỉ. Hồ sơ ứng tuyển và hệ thống hỗ trợ ghi nhận lý do rồi đóng báo cáo theo các action hiện có trong hợp đồng. Không giả lập chế tài không có API tương ứng.
- Thao tác đối tượng tái sử dụng các handler kiểm duyệt hiện có. Nếu đối tượng không còn ở trạng thái phù hợp, báo cáo giữ trạng thái đang xử lý và hiển thị lỗi để admin kiểm tra lại.
- Phản hồi/cảnh báo chỉ được lưu trong mock, không gửi email. Dữ liệu tồn tại trong tiến trình server và reset khi khởi động lại.
- Kiểm role/CSRF tại BFF; dữ liệu phản hồi qua Zod, truy vấn qua TanStack Query, form RHF/Zod. Từ khóa tìm kiếm và ghi chú tự do không được đưa vào URL. Xóa tin theo báo cáo dùng lý do cố định, liên kết reportId trong metadata nhật ký.
- Không thay bố cục hoặc CSS của nhà tuyển dụng; BFF chỉ chia sẻ dữ liệu danh mục để lựa chọn của các phía thống nhất.

## Kiểm tra

- Vitest: 123/123 đạt, gồm 6 kiểm thử mới về CRUD/ràng buộc danh mục, quyền/CSRF, bộ lọc báo cáo, chuyển trạng thái, cập nhật đối tượng và tính nhất quán khi thao tác thất bại.
- TypeScript, ESLint và build production đạt. Đã chạy lại build sau khuyến nghị nâng cấp bảo mật của Next.js CLI; không thay đổi phiên bản thư viện.
- Playwright: 3/3 kịch bản mới đạt trên bản production cuối (CRUD/ràng buộc danh mục, xử lý báo cáo và cập nhật đối tượng/nhật ký, phục hồi lỗi và trạng thái rỗng). 9 kịch bản admin cũ đã qua hồi quy trong lượt trước.
- Đã xem ảnh danh mục và báo cáo desktop/mobile, xác nhận xử lý báo cáo trên 360px. Lịch sử báo cáo xếp dọc, bảng cuộn trong khung và trang không tràn ngang. Typecheck và lint được chạy lại sau chỉnh sửa cuối, đều đạt.
