# Auth — luồng mock hiện hành

Workspace nhà tuyển dụng đã có công ty và dữ liệu minh họa: đăng nhập bằng
`recruiter@example.test` / `TalentAI2026!`. Tài khoản `recruiter@example.com`
vẫn dùng `TalentAI123!` và giữ màn hình chờ hoàn thiện doanh nghiệp.
Các route nhà tuyển dụng dùng cùng cookie `access_token`/`refresh_token` với
ứng viên; gọi `/auth/csrf` khi chưa đăng nhập không tạo phiên mới.

## Màn hình

- `/login`: chọn ngữ cảnh ứng viên/nhà tuyển dụng, nhập email và mật khẩu, validate rồi đăng nhập.
- `/register`: chọn vai trò, nhập các trường trong RegisterRequest, đồng ý chính sách và tạo tài khoản.
- Đăng ký thành công **không tự đăng nhập**; chuyển sang `/login` bằng nút Đăng nhập ngay.
- Đăng nhập thành công: server quyết định vai trò, chuyển tới `/{role}/dashboard`.
- Truy cập trang sai vai trò: chuyển về dashboard của tài khoản đã xác thực; chưa đăng nhập: về `/login`.
- `/logout` GET chỉ hiển thị xác nhận. Nhấn Đăng xuất mới gọi POST có CSRF; hủy phiên, xóa cookie và cache rồi về login.
- Khi lỗi mạng/server, giữ trạng thái để thử lại; không giả vờ đăng nhập/đăng xuất thành công.

## Theo contract, không theo các chi tiết nghiệp vụ chưa xác nhận trong ảnh

Ảnh được dùng cho bố cục hai cột, căn form, role switch, font và tông tím. Không đưa grid xanh/trắng
hoặc khung chọn của công cụ thiết kế vào sản phẩm.
Hình bên trái dùng `public/images/auth/login-banner.png`, cấu hình tại `src/features/auth/components/auth-frame.tsx`, vùng `data-slot="auth-illustration"`.
Khung cao theo viewport động (dvh), ảnh giữ nguyên tỷ lệ và vị trí, logo cố định; chỉ vùng nội dung bên phải cuộn.
Màn hình nhỏ ẩn vùng minh họa để dành chỗ cho form; nội dung vẫn cuộn bên trong khung và bàn phím có thể đưa trường đang focus vào tầm nhìn.

RegisterRequest chỉ có fullName, email, password, confirmPassword, role, acceptedPrivacyPolicy.
Phone, giới tính, công ty, địa chỉ/phường xã trong ảnh không được tự thêm vào request đăng ký;
hồ sơ doanh nghiệp là feature riêng. Tài khoản recruiter mới có `companyVerificationStatus=pending`.
OAuth Google/Facebook chưa có endpoint trong contract. Trang đăng nhập hiển thị nút có logo ở trạng thái disabled cùng nhãn “Sắp ra mắt”; chưa khởi tạo OAuth hoặc session từ các nút này.
Điều khoản/chính sách chính thức cần được chủ sản phẩm cung cấp trước khi đưa lên môi trường thật;
không tạo liên kết tới tài liệu chưa tồn tại.

## API mock đã triển khai

| Endpoint              | Hành vi                                                                                     |
| --------------------- | ------------------------------------------------------------------------------------------- |
| POST `/auth/register` | Validate, hash phía server mock, báo email trùng bằng fieldErrors, trả 201 không cấp cookie |
| POST `/auth/login`    | Sai thông tin trả lỗi chung, tài khoản khóa trả 423, cấp session và hai cookie httpOnly     |
| GET `/me`             | Xác thực session, trả User, không trả token                                                 |
| GET `/auth/csrf`      | Trả CSRF của session hiện tại                                                               |
| POST `/auth/refresh`  | Xác thực refresh, xoay access/refresh/CSRF và thu hồi token cũ                              |
| POST `/auth/logout`   | Kiểm tra CSRF, thu hồi cả access/refresh, xóa cookie, trả 204                               |

Client không dùng DATA_MODE và không lưu token vào localStorage/sessionStorage.
Cookie `access_token`, `refresh_token`: httpOnly, SameSite=Lax, Path=/; Secure trên HTTPS hoặc production.
Token mock là giá trị ngẫu nhiên không mang role, tra trong store server; không giả làm JWT production.
Mock hash bằng Node scrypt, không lưu mật khẩu đăng ký dạng rõ. Bcrypt là trách nhiệm backend thật theo contract.
Trình duyệt chỉ giữ thông tin user và CSRF trong bộ nhớ trong thời gian thao tác.

## Thời gian và bảo vệ

- Access: 15 phút; session tuyệt đối: 8 giờ (giá trị mặc định mock, backend sẽ chốt khi tích hợp).
- Hết 30 phút không hoạt động: thu hồi session; refresh không vượt qua giới hạn idle hoặc tuyệt đối.
- Client kiểm tra idle và chỉ kiểm tra lại server theo tương tác thực, tối đa một lần/phút; không polling để giữ phiên sống vô hạn.
- GET có thể được gọi lại sau khi refresh thành công. Không tự phát lại mutation khi không rõ kết quả.
- Login/registration/refresh từ origin khác bị chặn; logout còn yêu cầu X-CSRF-Token.
- Quá 5 lần đăng nhập sai trong 10 phút: khóa tạm 15 phút, có details.lockedUntil.
- Thay tài khoản trong cùng trình duyệt thu hồi session cũ; logout thu hồi token trong store, không chỉ xóa cookie.
- Người dùng tự chọn tab role trên login không được quyết định quyền hoặc URL đích.

## Tài khoản demo

Tất cả tài khoản dưới đây dùng mật khẩu **TalentAI123!**. Chỉ là dữ liệu giả để phát triển:

| Email                 | Vai trò / trạng thái                             |
| --------------------- | ------------------------------------------------ |
| candidate@example.com | Ứng viên hoạt động                               |
| recruiter@example.com | Nhà tuyển dụng, doanh nghiệp pending             |
| admin@example.com     | Admin hoạt động; không có lựa chọn đăng ký admin |
| locked@example.com    | Tài khoản bị khóa, dùng kiểm tra lỗi             |

Store đặt trên globalThis để giữ qua hot reload. Khởi động lại process reset các tài khoản mới và phiên.
Không có HTTP endpoint reset hoặc thay đổi role; test reset trực tiếp store trong môi trường unit.
Mock không phải dịch vụ identity production. Real proxy vẫn chưa mở các endpoint auth; phải tích hợp session,
cookie, CSRF với backend thật và kiểm thử riêng trước khi sử dụng tài khoản thật.

## Kiểm tra

Unit test: validation, đăng ký, duplicate email, cookie, CSRF, role, khóa tạm, idle, refresh rotation và revoke.
E2E: đăng ký hai role → đăng nhập → dashboard; sai thông tin/locked; role guard; logout xác nhận/retry;
làm mới access và giao diện 375px/1280px. Các feature dashboard nghiệp vụ, quên/đổi mật khẩu và OAuth chưa triển khai.
