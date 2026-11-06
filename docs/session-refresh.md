# Refresh phiên đăng nhập

- Mọi service frontend dùng `apiClient`. `session-fetch.ts` xử lý refresh chung, không lặp logic trong từng feature.
- GET/HEAD nhận 401: refresh một lần rồi gọi lại một lần. Các request đồng thời dùng chung refresh đang chạy; response 401 đến muộn dùng phiên vừa được làm mới.
- POST/PUT/PATCH/DELETE, kể cả multipart: kiểm tra `/me` trước, refresh khi cần, lấy CSRF mới rồi gửi thao tác đúng một lần. Không tự gửi lại thao tác ghi sau lỗi để tránh tạo trùng dữ liệu.
- `src/proxy.ts` khôi phục phiên trước khi render route candidate/recruiter/admin, truyền cookie mới vào request render và response trình duyệt. Các guard server/BFF vẫn xác thực danh tính và role qua backend.
- Refresh bị từ chối 401: xóa cookie, thông báo phiên hết hạn và chuyển trang riêng về đăng nhập. Lỗi kết nối/503 giữ cookie để có thể thử lại. Lỗi quyền 403 của nghiệp vụ không kích hoạt refresh.
- Refresh token vẫn có thể hết hạn hoặc bị thu hồi ở backend; trường hợp đó cần đăng nhập lại. Token nằm trong cookie HttpOnly, không trả token ra JavaScript.

Kiểm thử: `tests/unit/session-fetch.test.ts`, `tests/unit/session-navigation.test.ts`, `tests/unit/merge-auth-integration.test.ts`; kiểm thử trình duyệt `tests/e2e/session-refresh.spec.ts` cần dịch vụ auth thực đang chạy.

Quan sát backend local: refresh ngay trong cùng giây vừa phát token trả HTTP 500; refresh sau hai giây trả 200. Test trình duyệt mô phỏng token đã có tuổi để tránh lỗi này. Backend cần kiểm tra việc sinh/lưu token khi rotation trong cùng giây; frontend không tự lặp thao tác rotation khi backend trả 500.
