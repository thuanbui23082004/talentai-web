# Đăng nhập và dashboard quản trị

- Route: `/admin/login`, `/admin/dashboard`; `/admin` chuyển tới dashboard. Đăng nhập riêng, không có đăng ký admin công khai.
- Dùng Inter, cỡ nội dung 14px, tiêu đề 16–20px; màu tím, nền, viền, form và logo theo giao diện recruiter hiện có. CSS admin được giới hạn phạm vi riêng; responsive từ 360px.
- Đăng nhập dùng một card giữa màn hình, header logo và footer gọn; bỏ phần giới thiệu hai cột. Dashboard có 4 thẻ thống kê cân hàng; biểu đồ trái, công việc chờ xử lý và doanh thu bên phải; bộ lọc ngày mở bằng nút khi cần.
- Form dùng RHF + Zod, next-intl, Input/Button có sẵn; có hiện/ẩn mật khẩu, validation, lỗi đăng nhập và trạng thái đang gửi. Không lưu mật khẩu trong Query hoặc browser storage.
- Dashboard có thẻ thống kê, bộ lọc ngày, biểu đồ ba chỉ số, bảng số liệu thay thế biểu đồ, công việc chờ xử lý và hoạt động quản trị gần đây. Có loading, rỗng, lỗi/thử lại và xử lý phiên hết hạn.
- Luồng API qua service → API client → BFF. Chỉ sử dụng các endpoint đã có trong contract: `/auth/login`, `/auth/logout`, `/auth/csrf`, `/me`, `/admin/stats/overview`, `/admin/stats/timeseries`, `/admin/activity-logs`.
- Mock tạo phiên admin có thời hạn bằng cookie httpOnly; kiểm quyền ở server khi mở trang và ở BFF; đăng xuất có CSRF và thu hồi phiên. Workspace recruiter giữ cơ chế khởi tạo phiên mock hiện có.
- Tài khoản giả để demo: `admin@example.test` / `TalentAI2026!`. Fixture đặt trong `src/mocks/fixtures/admin.ts`. Đây chỉ là tài khoản mock, không sử dụng cho backend thật.
- Dữ liệu hoạt động mẫu ở 01–05/11/2026. Lọc ngoài khoảng này hiển thị dữ liệu rỗng. Các số liệu tồn kho như tin đang đăng và doanh nghiệp đang chờ thể hiện ảnh chụp trạng thái mẫu; không phải hệ thống phân tích lịch sử thật.
- Chưa có API doanh thu: thẻ doanh thu hiển thị chưa có dữ liệu, không tự bịa field hay endpoint. Sidebar trái chỉ có 5 nhóm: Tổng quan, Tài khoản, Nội dung, Tài chính, Hệ thống. Các mục con hiển thị bằng tab trong nội dung; các trang quản lý chưa triển khai hiển thị trạng thái thông báo riêng.
- Không đổi contract, middleware, env, lockfile hoặc thư viện. Backend thật chưa được kiểm tra.

## Kiểm tra

- Vitest: 95/95 đạt, gồm 5 bài kiểm tra mới cho validation, quyền truy cập, đăng nhập, lọc dữ liệu và CSRF/đăng xuất.
- Playwright: 2 kịch bản admin kiểm tra đăng nhập sai/đúng, chuyển hướng khi chưa có phiên, bộ lọc, biểu đồ, dữ liệu rỗng, mobile, đăng xuất, lỗi API và hết phiên.
- Ảnh desktop và mobile được xuất trong `test-results/` và kiểm tra bố cục trực tiếp.
- Kết quả cuối: `pnpm typecheck`, `pnpm lint`, `pnpm test` và `pnpm build` đạt. Hai kịch bản Playwright đạt trên bản production; đã xem ảnh desktop/mobile 360px.
- Next.js CLI hiện có nhắc nâng cấp bảo mật và deprecation middleware; không nâng cấp hoặc sửa middleware trong phạm vi này. Build đạt sau khi chạy lại theo thông báo CLI.


## Điều chỉnh bố cục theo phản hồi

- Sidebar hẹp theo kiểu recruiter, 5 nhóm chính; tab con có thao tác bàn phím và thông báo rõ cho chức năng chưa triển khai. Không có dãy nhãn “Sắp có” trên sidebar.
- Form đăng nhập chuyển thành card giữa màn hình. Dashboard dùng 4 thẻ đều nhau và hai cột; doanh thu ở cột phụ. Bộ lọc thời gian thu gọn mặc định.
- Kiểm tra đợt chỉnh giao diện: typecheck và lint đạt; 2 kịch bản Playwright đạt trên dev server, gồm menu nhóm/tab, bàn phím, luồng đăng nhập/đăng xuất, lỗi API, lọc và responsive 360px. Đã xem ảnh desktop/mobile. Không thay đổi API hoặc logic xác thực.

## Sửa hồi quy phiên mock giữa admin và recruiter

- Nguyên nhân: đăng nhập admin trước đây ghi vào cookie `talentai_mock_session` và xóa phiên recruiter; `/me` vì thế trả tài khoản admin cho trang tài khoản recruiter.
- Admin nay dùng cookie httpOnly riêng `talentai_mock_admin_session`. BFF chọn đúng phiên cho endpoint admin; các lời gọi auth dùng dấu hiệu workspace nội bộ, không chuyển tiếp sang backend thật và không dùng dấu hiệu này thay cho kiểm quyền.
- Đăng nhập/đăng xuất admin không thay đổi phiên recruiter. Bootstrap recruiter phục hồi cookie cũ nếu phiên đó mang vai trò admin do phiên bản mock trước ghi đè.
- Hai kiểm thử tái hiện lỗi đều thất bại trước sửa và đạt sau sửa; toàn bộ Vitest đạt 97/97. Có thêm Playwright kiểm tra mở recruiter → admin → recruiter và đăng xuất admin trong cùng trình duyệt.
- Không sửa file giao diện recruiter, contract hay middleware. Thay đổi này xử lý việc tách phiên trong chế độ mock; chưa xác minh xác thực backend thật.
- Kết quả kiểm chứng hồi quy: 3/3 kịch bản Playwright đạt, bao gồm cùng trình duyệt giữ riêng danh tính recruiter/admin; typecheck đạt.
