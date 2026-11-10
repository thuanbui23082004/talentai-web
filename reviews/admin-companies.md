# Quản lý doanh nghiệp admin

## Giao diện và luồng

- Route `/admin/companies` và `/admin/companies/[companyId]`, trong Tài khoản → Doanh nghiệp; tab Người dùng vẫn mở trang tài khoản hiện có.
- Danh sách tìm theo tên/mã số thuế, lọc đủ năm trạng thái, phân trang. Từ khóa giữ trong UI, không ghi vào URL.
- Chi tiết có thông tin doanh nghiệp, liên hệ, chủ tài khoản, mã số thuế, giấy tờ và lịch sử xét duyệt. Thông tin chưa có hiển thị rõ, không tự suy ra dữ liệu.
- Xem giấy tờ qua BFF có kiểm quyền; preview Blob và tải xuống. Object URL được thu hồi khi đóng/chuyển tài liệu hoặc rời trang. Có loading, lỗi/thử lại và trường hợp chưa có giấy tờ.
- Duyệt/từ chối hồ sơ đang chờ; đình chỉ doanh nghiệp hoặc khôi phục trạng thái trước đình chỉ. Mỗi thao tác nhập ghi chú/lý do, kiểm tra lại rồi xác nhận. Lỗi giữ nội dung đã nhập; có hủy/sửa trước khi gửi.
- Giữ màu, font Inter, nội dung 14px và tiêu đề 16–20px của admin. Responsive 360px, bảng cuộn trong container.

## API và mock

- Dùng các endpoint công ty admin đã có trong contract. `verify`/`restore` gửi `note`, `reject`/`suspend` gửi `reason`; không đổi spec hoặc type sinh tự động.
- Dùng chung company store của recruiter. BFF upload giữ lại đúng bytes giấy tờ trong bộ nhớ để admin đọc được tệp đã gửi; không dùng tệp mẫu thay thế cho tệp upload.
- Fixture doanh nghiệp, tài khoản đại diện và PDF đều giả; PDF ghi rõ chỉ dùng demo và không có giá trị pháp lý. Không có giấy tờ thật hoặc dữ liệu cá nhân thật.
- BFF kiểm role/CSRF, trạng thái hợp lệ và quyền truy cập đúng giấy tờ của từng doanh nghiệp. Không duyệt hồ sơ thiếu giấy tờ.
- Đình chỉ ẩn các tin `open` của đúng doanh nghiệp; không đổi các tin thuộc doanh nghiệp khác. Chặn mở lại tin và gửi lại giấy tờ để tự thoát đình chỉ. Khôi phục doanh nghiệp không tự mở lại các tin đã ẩn.
- Cập nhật lịch sử xét duyệt, nhật ký admin và thống kê doanh nghiệp chờ xác minh từ cùng store; cập nhật query sau mutation. Mock reset khi server khởi động lại.
- Không sửa giao diện recruiter. Hai thay đổi ở BFF recruiter chỉ phục vụ đọc đúng giấy tờ và thực thi trạng thái đình chỉ.

## Kiểm tra

- TypeScript, ESLint và build production đạt; build chạy lại sau thông báo nâng cấp bảo mật hiện có của CLI.
- Vitest: 110/110 đạt. Sau chốt kiểm soát đình chỉ, chạy lại 28 kiểm thử doanh nghiệp/tài khoản công ty/quản lý tin và đạt.
- Playwright: 7/7 kịch bản admin đạt trên production riêng cổng 3001: hai kịch bản doanh nghiệp, hai tài khoản, ba đăng nhập/dashboard/tách phiên. Không dừng dev server đang mở ở cổng 3000.
- Đã xem ảnh danh sách desktop/mobile, xác nhận thao tác và chi tiết mobile 360px. Bộ test xác nhận giấy tờ tải được, dữ liệu giữ sau reload, thông báo lỗi/thử lại, giữ lý do khi lỗi và cập nhật thống kê/nhật ký.
- Chưa kiểm chứng backend thật. Cấu hình QA riêng chỉ là tệp tạm và được dọn sau kiểm tra.
