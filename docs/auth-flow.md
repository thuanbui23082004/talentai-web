# Auth — BFF mỏng, Java quản lý xác thực

Auth luôn gọi Java qua AUTH_API_URL, độc lập DATA_MODE. Không có tài khoản
mock trong runtime. Test double chỉ nằm trong tests/support.

## Cấu hình

```dotenv
DATA_MODE=mock
AUTH_API_URL=http://localhost:3001/api/v1
```

DATA_MODE và BACKEND_API_URL chỉ áp dụng dữ liệu nghiệp vụ. Auth không đọc
DATA_MODE để chọn nguồn danh tính.

## Trách nhiệm

Form đăng nhập gửi `role` đang chọn cùng email/mật khẩu. BFF chỉ chuyển email/mật khẩu
tới Java, sau đó so sánh role đã xác thực trước khi đặt cookie. Nếu không khớp, BFF
trả `403 AUTH_ROLE_MISMATCH`, không đặt cookie hoặc trả dữ liệu phiên, đồng thời thử
thu hồi refresh token vừa được cấp. Đăng nhập mạng xã hội cũng kiểm tra role tương tự.
`LoginRequest.role` là tùy chọn để giữ tương thích với các client đăng nhập theo role
đã xác thực; form đăng nhập luôn gửi trường này. Role gửi lên không dùng để cấp quyền.

Kiểm tra bản sửa role: 270 unit test pass; trình duyệt với backend thật đã xác nhận
sai role trả lỗi và không đặt cookie. E2E đầy đủ còn bị chặn ở bước đăng nhập lại:
đã tái hiện trực tiếp Java trả `500 INTERNAL_SERVER_ERROR` cho chuỗi
register → logout → login; BFF chuyển lỗi này thành 503. Cần kiểm tra auth backend
trước khi nghiệm thu toàn bộ kịch bản đăng nhập lại.

| Java | Next.js BFF |
|---|---|
| Validate nghiệp vụ, kiểm tra mật khẩu, khóa tài khoản | Kiểm tra shape JSON, Origin/CSRF và giới hạn request |
| Cấp JWT, quyết định thời hạn | Đặt JWT trực tiếp vào cookie HttpOnly |
| Xác thực danh tính và quyền | Gọi /auth/me, ánh xạ User cho giao diện/guard |
| Refresh rotation, thu hồi token | Chuyển refresh token tới Java và cập nhật cookie |
| Đổi mật khẩu, thu hồi refresh theo chính sách Java | Chuyển request và xóa cookie của trình duyệt hiện tại |

BFF không có session-store, mã phiên opaque, cached user, idle timeout,
thời hạn 8 giờ, bộ đếm login sai hoặc danh sách thu hồi riêng.

Java có thể trả createdAt=null hoặc chưa gửi trường này khi mới đăng ký.
BFF chấp nhận và bỏ createdAt khỏi User frontend; không tự tạo ngày thay thế.
Nếu Java gửi ngày giờ thì vẫn phải đúng ISO và được giữ nguyên.

## Đọc code

```text
Form → useLogin → service → /api/bff/* → handler.ts
  → auth/handler.ts → auth/backend.ts → Java
```

- auth/handler.ts: allowlist endpoint, chuyển payload, đặt/xóa cookie, ánh xạ lỗi.
- auth/backend.ts: HTTP client, schema upstream và mapUser.
- auth/cookies.ts: JWT cookie và CSRF không lưu trạng thái.
- auth/session.ts: gọi Java /auth/me cho guard và mock nghiệp vụ.

## Cookie và CSRF

Cookie access_token chứa access JWT Java, Max-Age theo expiresInSeconds.
Cookie refresh_token chứa refresh token Java. Backend chưa trả thời hạn
refresh riêng nên đây là browser-session cookie, không tự gán 7 ngày/8 giờ.
Java quyết định refresh token còn hợp lệ hay không.

Cả hai cookie HttpOnly, SameSite=Lax, Path=/, Secure trên HTTPS/production.
JSON không trả token backend. CSRF là HMAC gắn với secret trong cookie
HttpOnly; refresh đổi token thì CSRF cũng đổi. Không có CSRF/session store.

GET /auth/csrf chỉ cấp phương tiện bảo vệ request trình duyệt, không phải
bằng chứng đã đăng nhập. Java vẫn xác thực JWT khi gọi endpoint được bảo vệ.
Request thay đổi dữ liệu được kiểm tra Origin/Fetch Metadata; logout/đổi mật
khẩu và mutation nghiệp vụ còn yêu cầu X-CSRF-Token.

## Các luồng

- Login: Java trả user/tokens → BFF đặt cookie → JSON user/expiresInSeconds/CSRF.
- /me và guard: gọi Java /auth/me bằng Bearer JWT, không tin JWT decode cục bộ.
- Refresh: chuyển refresh cookie tới Java → cập nhật cả hai cookie và CSRF.
  Chỉ gom request HTTP đang chạy cùng refresh token trong một process; không
  cache token sau khi call kết thúc. Java vẫn quyết định rotation/rejection.
- Logout: Java thu hồi refresh → BFF xóa cookie. JWT access đã cấp có thể vẫn
  hợp lệ đến khi hết hạn theo đặc tả Java; không tuyên bố thu hồi mọi phiên.
- Đổi mật khẩu: Java xử lý và thu hồi refresh theo chính sách Java. BFF chỉ
  xóa cookie của browser này, không tự vô hiệu hóa browser khác.
- Đăng ký: chuyển fullName thành displayName, role sang uppercase; dùng ngay
  token Java trả để đặt cookie và đăng nhập. Frontend về trang chủ, thông báo
  góc dưới phải khoảng 5 giây rồi ẩn; không còn màn hình xác nhận trung gian.
  Không gọi thêm login/logout. Cờ thông báo được xóa khỏi URL để reload không lặp.
- Server Component không ghi cookie. Khi guard gặp access hết hạn, về login;
  client gọi refresh rồi chuyển lại dashboard khi Java xác nhận danh tính.
  Không tự phát lại mutation hoặc làm mới cookie qua GET.

Refresh/Java lỗi mạng giữ cookie để thử lại, không giả vờ đăng xuất thành công.
User có nhiều role: giao diện chọn role đầu tiên Java trả để điều hướng;
quyền API cuối cùng do Java quyết định.

## Phần chưa tích hợp

Forgot/reset-password đã nối Java theo Swagger: forgot nhận `{email}`, trả 200;
reset nhận `{token,newPassword,confirmPassword}`. Chỉ development trả `resetToken`
Java cấp để UI hiển thị liên kết thử nghiệm `/reset-password?token=...`; production
loại bỏ token. Không lưu token vào localStorage/sessionStorage, không prefetch liên kết.
Token một lần/hạn 15 phút do Java kiểm tra. Mật khẩu reset dài 8–100 ký tự.
Java `PASSWORD_RESET_TOKEN_INVALID` → BFF `400 INVALID_RESET_TOKEN`.
Backend chưa gửi email; giao diện không tuyên bố đã gửi thư.

## Đăng nhập Google/Facebook

`SocialLogin` tải SDK chính thức chỉ khi provider có cấu hình. Google dùng
`accounts.id.renderButton`/popup, nhận ID token (`credential`); Facebook gọi
`FB.login` trực tiếp từ click với scope `public_profile,email`, nhận access token.
Component → `useSocialLogin` → service → POST `/api/bff/auth/social-login` → Java
POST `/api/v1/auth/social-login` với `{provider,token,role}` (role uppercase).
Java xác minh provider, tìm/tạo/liên kết tài khoản và trả user/tokens.
BFF dùng cùng handler login để đặt JWT HttpOnly, trả AuthSessionResponse.
Chỉ khi role Java trả khớp lựa chọn trên UI, BFF mới đặt cookie để client xóa query cache
và điều hướng theo role đã xác thực. Sai role trả lỗi và giữ nguyên trang đăng nhập.
Không lưu provider token hoặc JWT vào localStorage/sessionStorage, không log token.
Hủy popup, SDK bị chặn, token không hợp lệ và backend lỗi đều không tạo phiên giả.

### Cấu hình trong `.env.local`

```dotenv
NEXT_PUBLIC_GOOGLE_CLIENT_ID=<Web OAuth client ID>
NEXT_PUBLIC_FACEBOOK_APP_ID=<Meta app ID>
NEXT_PUBLIC_FACEBOOK_API_VERSION=v25.0
```

Đây là các ID công khai; không đưa Client Secret/App Secret vào NEXT_PUBLIC.
Khởi động lại `npm run dev` sau khi điền; production cần build lại.

- Google Cloud Console: tạo OAuth client loại Web application; Authorized JavaScript
  origins chứa chính xác `http://localhost:3000` (và origin HTTPS production).
  Cấu hình consent screen/test users nếu ứng dụng chưa public. Luồng GIS popup
  trả credential qua callback, không cần tạo route callback exchange code ở Next.js.
- Meta Developer Console: cấu hình Facebook Login for Web, bật JavaScript SDK,
  nhập domain/Website Site URL và allowed JavaScript SDK domains tương ứng.
  Điền API version đang dùng của app. Khi app còn development, đăng nhập bằng
  app admins/developers/testers được Meta cho phép; cần email từ tài khoản người dùng.
  Dùng HTTPS cho site theo yêu cầu Meta; kiểm tra chính sách localhost của app.

Nguồn SDK: [Google GIS](https://developers.google.com/identity/gsi/web/reference/js-reference),
[Facebook JavaScript SDK](https://developers.facebook.com/docs/javascript/quickstart/).
Đã nhận Client ID/App ID và lưu trong `.env.local` (gitignored). SDK thật tải được.
Kiểm tra trên `http://localhost:3000` ghi nhận Google báo origin chưa được phép và
Facebook báo FB.login không hỗ trợ HTTP. Chưa đăng nhập tài khoản nhà cung cấp thật.
Thêm cả `http://localhost:3000` và `https://localhost:3000` vào Google Authorized
JavaScript origins. Dừng server HTTP, chạy `npm run dev:https`, mở
`https://localhost:3000/login`; cấu hình Website Site URL/domain tương ứng ở Meta.
Next.js có thể yêu cầu tạo/tin cậy chứng chỉ localhost khi chạy HTTPS lần đầu.
Đã gọi Java thật qua BFF với token không hợp lệ cho cả Google/Facebook: đều 401,
không đặt cookie. Smoke SDK trên trình duyệt sử dụng SDK double, không phải nghiệm thu OAuth thật.

Lưu ý khi nghiệm thu production: mã Java `GoogleTokenVerifier` hiện gọi tokeninfo
nhưng chưa đối chiếu `aud` với client ID của dự án; `FacebookTokenVerifier` gọi `/me`
nhưng chưa kiểm tra token thuộc App ID của dự án. Phần ràng buộc ứng dụng này thuộc
backend Java, cần bổ sung/kiểm chứng phía backend, không chuyển sang logic UI.
Ứng viên đăng ký không có trường phone; nhà tuyển dụng vẫn cần nhập phone.
Phone của nhà tuyển dụng/consent trên form chưa có nơi lưu trong auth service; cần
profile/consent service trước khi nghiệm thu việc lưu các thông tin này.

Unit test kiểm tra JWT cookie, không lộ JWT/token reset production trong JSON,
delegation tới Java, CSRF, refresh và lỗi. Forgot/reset đã kiểm thử với tài khoản
backend test riêng qua UI/BFF: reset thành công, đăng nhập bằng mật khẩu mới,
token không dùng lại được và email không tồn tại không có token. Chưa nghiệm thu
email vì Java chưa gửi thư. E2E cũ dùng tài khoản demo cần seed tài khoản backend test.
