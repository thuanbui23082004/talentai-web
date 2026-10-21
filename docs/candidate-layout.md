# Candidate layout

Các trang `/candidate/*` dùng chung `CandidateShell` trong route layout, sau khi
`requireRole("candidate")` xác thực phiên ở server.

- `CandidateHeader`: nav tím riêng cho ứng viên, luôn ở đầu màn hình; tên và avatar
  lấy từ phiên đăng nhập, có menu tài khoản và liên kết đăng xuất hiện có.
- `CandidateSidebar`: điều hướng theo pathname, đánh dấu trang hiện tại; nhóm hồ sơ
  có thể mở rộng, cài đặt và hỗ trợ nằm cuối thanh bên.
- `CandidateShell`: bố cục sidebar/nội dung, skip link và drawer menu trên mobile.
- `CandidateAccountMenu` và `candidate-navigation.ts`: tách menu tài khoản và cấu
  hình điều hướng để tái sử dụng.

Tái sử dụng BrandLogo, Avatar, NavigationDetails, Modal và AvailabilityButton.
DashboardWelcome hỗ trợ `embedded` để không lặp header bên trong layout candidate;
giao diện mặc định của recruiter/admin vẫn dùng như trước.

Các route hiện có: dashboard, cv, matching và applications. Hồ sơ, việc đã lưu,
thông báo, tin nhắn, cài đặt và hỗ trợ hiện mở thông báo trạng thái; chưa có API
hoặc nghiệp vụ cho các mục này. Nội dung dashboard nghiệp vụ chưa triển khai.

Kiểm thử E2E tại `tests/e2e/candidate-layout.spec.ts` bao gồm điều hướng/active menu,
drawer ở 375 và 768 px, đóng bằng Escape, tài khoản và luồng đăng xuất.
