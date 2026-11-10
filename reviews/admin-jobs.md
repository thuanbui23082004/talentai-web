# Quản lý tin tuyển dụng admin

## Trang và luồng

- `/admin/jobs`: danh sách, tìm theo tiêu đề/công ty, lọc doanh nghiệp/trạng thái, phân trang. `/admin/jobs/[jobId]`: nội dung tin, doanh nghiệp liên quan, thông tin tuyển dụng, ghi chú gần nhất và lịch sử kiểm duyệt.
- Điều hướng Nội dung → Tin tuyển dụng; giữ sidebar năm nhóm và các tab con. Tab rộng cuộn trong khung ở mobile, không kéo tràn cả trang.
- Duyệt/từ chối tin chờ duyệt; ẩn tin đang đăng, khóa tin vi phạm, xóa tin. Mỗi thao tác nhập lý do/ghi chú → kiểm tra lại → xác nhận; có hủy/sửa, giữ nội dung khi lỗi.
- Sau xóa quay lại danh sách và hiển thị thông báo. Tin bị xóa không được seed trở lại trong cùng phiên server; mở lại chi tiết trả không tìm thấy. Nhật ký vẫn được giữ.

## API và dữ liệu

- Dùng endpoint đã có trong contract, không sửa spec/type tự sinh. Duyệt gửi `note`, từ chối/ẩn/khóa gửi `reason`; DELETE gửi query `reason` đúng hợp đồng hiện tại.
- Vì DELETE dùng URL, lý do xóa có email/số điện thoại bị chặn bằng Zod trước mọi request. Không đưa từ khóa tìm kiếm có thể chứa thông tin cá nhân lên URL.
- Tất cả request qua API client/BFF; dữ liệu ngoài qua Zod. TanStack Query quản lý bản ghi; Zustand chỉ giữ thông báo UI sau xóa, không lưu job vào store UI.
- Admin và recruiter dùng chung kho tin, cờ xóa và doanh nghiệp. Các tin demo bổ sung thuộc doanh nghiệp giả riêng, không thay bản ghi của recruiter hiện có khi khởi tạo trang.
- BFF kiểm role admin, CSRF, trạng thái hợp lệ; chỉ duyệt doanh nghiệp đã xác minh. Request không hợp lệ không thay trạng thái hoặc tạo log. Không cho duyệt/từ chối lặp lại tin đã xử lý.
- Mutation cập nhật moderation/history và nhật ký quản trị gồm actor, target, action, timestamp, reason. Thẻ tin đang đăng/chờ duyệt trên dashboard được tính từ cùng kho tin, kể cả khi số lượng bằng 0.
- Đồng bộ query danh sách, chi tiết, dashboard, nhật ký và thông tin doanh nghiệp sau thao tác.
- Chỉ kiểm chứng mock; dữ liệu reset khi khởi động lại server. Không sửa giao diện recruiter, thêm thư viện hay đổi hợp đồng API.

## Giao diện

- Token màu admin, font Inter, nội dung 14px, tiêu đề 16–20px. Nội dung tin hiển thị dạng văn bản an toàn, không render HTML chưa được kiểm soát.
- Có skeleton, rỗng/không có kết quả, lỗi/thử lại, không tìm thấy, hết phiên và thành công; bảng cuộn trong container ở 360px.
- Form dùng RHF + Zod và các Input/Textarea/Button sẵn có. Định dạng tiền VND dùng helper chung `formatVND`.

## Kết quả kiểm tra

- Typecheck, ESLint và build production đạt. Build được chạy lại sau nhắc nâng cấp bảo mật hiện có của Next.js CLI; không thay đổi dependency.
- Vitest: 117/117 đạt; bộ 7 kiểm thử tin được chạy lại sau chốt thống kê trạng thái bằng 0 và đạt.
- Playwright: hai kịch bản tin đạt trên dev; cả 9 kịch bản admin đạt trên production (doanh nghiệp, dashboard/tách phiên, tin và tài khoản).
- Đã xem ảnh danh sách desktop/mobile, chi tiết mobile 360px và xác nhận thao tác. Sửa khung grid/tab gây tràn ở mobile; bảng vẫn cuộn bên trong container.
- Kiểm tra trạng thái giữ sau reload, xóa xong về danh sách, chi tiết tin đã xóa trả không tìm thấy, ghi nhật ký và giữ lý do khi API lỗi.
