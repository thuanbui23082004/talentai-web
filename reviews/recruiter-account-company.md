# Thông tin tài khoản và công ty — đã triển khai theo kế hoạch được duyệt

## Giao diện và route

- Hai route `/recruiter/account` và `/recruiter/company`, hai tab cùng bố cục theo ảnh Figma.
- Mục Tài khoản ở sidebar mở `/recruiter/account`; cả hai tab chọn cùng mục sidebar này. Giữ header/sidebar cố định và khoảng cách chung của Recruiter, responsive từ 360px.
- Tiêu đề ngắn “Thông tin tài khoản” / “Thông tin công ty”; không thêm ghi chú mock, hướng dẫn kỹ thuật hoặc dòng giới thiệu thừa.
- Dùng component shadcn hiện có, next-intl, token màu hiện có. Form RHF + Zod; server state TanStack Query; dữ liệu ngoài qua Zod.

## Tab tài khoản

- GET `/me`: email chỉ đọc, họ tên, số điện thoại, địa chỉ, avatar và trạng thái thực từ API.
- PATCH `/me`: cập nhật fullName, phone, address; Hủy thay đổi khôi phục dữ liệu đã lưu.
- POST `/auth/change-password`: form mật khẩu hiện tại/mới/xác nhận theo PasswordRules. Không đọc, hiển thị, lưu cache hay log mật khẩu cũ như nội dung trong Figma. Không tự gán trạng thái xác thực email vì User không có field này.
- PUT/DELETE `/me/avatar`: thay/xóa avatar, PNG/JPEG/WebP tối đa 2 MB đúng spec.
- Sau cập nhật, tên/avatar trên header lấy từ cùng query tài khoản để tránh sai thông tin giữa các trang. Không đưa thông tin cá nhân lên URL/console/analytics.

## Tab công ty

- GET `/recruiter/company`: thông tin và trạng thái xác thực thực; không ghi cứng “Chờ xác thực”.
- POST `/recruiter/company` khi chưa có doanh nghiệp; PUT khi đã có.
- Form thông tin chính: mã số thuế, tên, quy mô, thành phố, địa chỉ, điện thoại liên hệ, lĩnh vực từ catalog hiện có. Yêu cầu bắt buộc theo CompanyInput, không tự coi mọi dấu sao Figma là hợp đồng backend.
- Phần giới thiệu/website theo ảnh có nút cập nhật riêng. PUT là CompanyInput có field bắt buộc: mỗi lần lưu gửi dữ liệu đã lưu của phần còn lại, không xóa nhầm thông tin; các form giữ nội dung chưa lưu khi có lỗi.
- POST `/recruiter/company/verification-documents`: gửi PDF/ảnh bằng multipart, có trạng thái đang gửi/lỗi/thành công; trạng thái pending theo API. Không tự dựng giới hạn 10 MB hay khẳng định đã duyệt chỉ vì gửi xong.
- PUT/DELETE `/recruiter/company/logo`: thay/xóa logo theo spec, không dùng logo để giả làm ảnh bìa.
- Đồng bộ thông tin công ty trong mock với nơi đang đọc cùng doanh nghiệp; không tạo một nguồn dữ liệu công ty thứ hai độc lập.

## Những phần ảnh Figma chưa có hợp đồng API

- Chưa có 2FA, nhiều số điện thoại, email liên hệ riêng cho tài khoản, ảnh bìa công ty. Trong lần triển khai này bỏ các thao tác chưa hỗ trợ, không tạo nút bấm không hoạt động hoặc báo lưu thành công giả.
- Không đổi contracts để thêm các trường/endpoint này. Nếu cần các phần này hoạt động, xử lý bằng thay đổi hợp đồng được duyệt ở bước riêng.
- Giới thiệu doanh nghiệp là string trong spec; dùng editor hiện có nếu tái sử dụng được, lưu văn bản phù hợp hợp đồng và không render HTML chưa được kiểm soát.

## API mock, phạm vi file và kiểm tra

- Đặt tính năng tài khoản/doanh nghiệp trong `src/features/` theo cấu trúc hiện có; không đụng giao diện candidate/admin/auth ngoài chức năng đổi mật khẩu thuộc tab tài khoản.
- API qua `@/lib/api`; mở rộng allowlist BFF cho đúng endpoint đã có, hỗ trợ multipart và DELETE; bổ sung mock có kiểm session/role/CSRF và dữ liệu giả trong fixtures.
- Không thêm thư viện. Không sửa contracts, middleware, env, lockfile, file type sinh tự động hoặc component shadcn.
- Có loading skeleton, lỗi/thử lại, rỗng/chưa có doanh nghiệp và thành công. Hiển thị lỗi nghiệp vụ tiếng Việt; lỗi không làm mất form.
- Kiểm tra validation và mock bằng Vitest; Playwright cho lưu/hủy tài khoản, đổi mật khẩu, ảnh đại diện, công ty, xác thực doanh nghiệp, lỗi API và mobile. Chạy typecheck + lint và báo kết quả thật.

## Kết quả triển khai

- Đã thêm hai route, liên kết Tài khoản ở sidebar và header, hai tab điều hướng. Header dùng query tài khoản chung để cập nhật tên/avatar.
- Đã nối các API được liệt kê ở trên; multipart dùng API client, BFF có DELETE. Mock kiểm session, vai trò, CSRF, định dạng/chữ ký tệp; ảnh mock được phục vụ qua URL tài nguyên riêng có kiểm quyền, không phải endpoint hợp đồng backend mới.
- Mock doanh nghiệp dùng chung store với tin đăng; đổi tên/logo cập nhật dữ liệu công ty của tin đăng. Các phần form công ty giữ nội dung chưa lưu khi phần khác được cập nhật và khóa thao tác ghi đồng thời.
- Mật khẩu chỉ tồn tại trong form và request, không vào Query/mutation cache. Mock kiểm mật khẩu hiện tại bằng hash trong bộ nhớ và thu hồi các phiên khác khi đổi thành công.
- Đã giữ đúng phạm vi chưa hỗ trợ: không tạo 2FA, email liên hệ tài khoản riêng, nhiều số điện thoại hay ảnh bìa giả.
- TypeScript và ESLint đạt. Vitest 50/50 đạt. Playwright: cả 5 kịch bản cài đặt đạt; luồng tài khoản/ảnh được chạy lại sau khi sửa nhãn trường bắt buộc. Đã xem ảnh desktop và mobile 360px, không tràn ngang.
- Chỉ kiểm tra với mock; chưa xác minh backend thật. Không đổi contracts, middleware, env, lockfile, thư viện hoặc component shadcn.
- Next.js CLI đã dừng các lần khởi động để nhắc nâng cấp bảo mật; chạy lại cùng lệnh cho phép tiếp tục kiểm tra. Chưa nâng cấp dependency trong tính năng này.
