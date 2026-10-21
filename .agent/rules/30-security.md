# Quy tắc Bảo mật

## Xác thực & Phân quyền
- Client không trực tiếp lưu trữ hoặc thao tác backend tokens nhạy cảm nếu không cần thiết.
- BFF chịu trách nhiệm quản lý session, cookies, và header chuyển tiếp.
- Kiểm tra quyền truy cập (candidate, recruiter, admin) ở server layout và BFF route; proxy Next.js chỉ là lớp bổ sung, không thay thế kiểm tra session.
- Chưa có auth thì đóng trang riêng; không tạo session giả mặc định để bỏ qua quyền.
- Mock auth cần cookie httpOnly và kiểm tra role; không chấp nhận role do client gửi làm bằng chứng phân quyền.
- Không mở proxy cho endpoint riêng tư trước khi có session, cookie, CSRF và test tương ứng.
