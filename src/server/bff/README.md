# BFF — chuyển tiếp và bảo vệ giao tiếp với backend

```text
bff/
├── handler.ts       Auth thật trước, rồi chọn mock/real cho nghiệp vụ
├── proxy.ts         Allowlist và chuyển tiếp backend nghiệp vụ thật
├── mock-adapter.ts  Điều phối dữ liệu nghiệp vụ mock
├── responses.ts     Lỗi theo contract frontend
├── auth/            Cookie JWT và giao tiếp với auth service Java
├── public/          Jobs, công ty, helper SSR
├── candidate/       Dữ liệu nghiệp vụ ứng viên
└── recruiter/       Dữ liệu workspace nhà tuyển dụng
```

## Auth

```text
route.ts → handler.ts → auth/handler.ts → auth/backend.ts → Java
```

| File | Trách nhiệm |
|---|---|
| auth/handler.ts | Chuyển request auth, kiểm tra Origin/CSRF, ánh xạ response |
| auth/backend.ts | Gọi Java và kiểm tra cấu trúc JSON |
| auth/cookies.ts | Đặt JWT trực tiếp vào cookie HttpOnly, CSRF không có store |
| auth/session.ts | Gọi Java /auth/me cho server guard và mock nghiệp vụ |

Java quản lý mật khẩu, token, role, expiry, refresh rotation và revocation.
BFF không có store phiên, cached identity, idle timeout hoặc thu hồi riêng.
Guard không decode JWT để tin role. JSON không bao giờ trả JWT cho React.

AUTH_API_URL cấu hình auth riêng, DATA_MODE chỉ áp dụng nghiệp vụ.
Workspace mock lưu dữ liệu theo user ID, không lưu JWT làm khóa phiên.

Chi tiết luồng, giới hạn tích hợp và cấu hình: docs/auth-flow.md.
