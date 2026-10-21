# TalentAI Web

Frontend tuyển dụng với Next.js App Router, TypeScript, Tailwind CSS và TanStack Query.
Backend đang phát triển; dự án hiện ưu tiên **mock theo contract**, không cần backend để làm frontend.

## Chạy local

Dùng Node.js 22 LTS và npm (phiên bản npm được ghi trong `package.json`).

```sh
npm ci
cp .env.example .env.local
npm run dev
```

Trên Windows PowerShell, sao chép bằng `Copy-Item .env.example .env.local`.
Nếu PowerShell chặn `npm.ps1`, dùng `npm.cmd` thay cho `npm` trong các lệnh.
Mở http://localhost:3000/jobs để thử danh sách việc làm, tìm theo từ khóa và địa điểm.
Mở http://localhost:3000/ui để xem bộ UI dùng chung theo thiết kế tím/trắng. Xem [đặc tả UI](docs/ui-spec.md).
`.env.local` ưu tiên hơn `.env`; không commit các file này. Commit `package-lock.json`, dùng npm thống nhất.

## Kiến trúc dữ liệu

```text
Page → feature component → hook → service → lib/api/client
  → /api/bff/* → server/bff → mock adapter hoặc backend proxy
```

- Trình duyệt luôn gọi `/api/bff`, không biết URL backend hoặc chế độ dữ liệu.
- `DATA_MODE=mock` là mặc định. Mock chạy trong Next.js, không cần Prism.
- `BACKEND_API_URL` chỉ dùng phía server, bắt buộc khi `DATA_MODE=real`.
- Chỉ BFF chọn mock/real. Không đặt nhánh mock trong UI, hook hoặc service.
- `contracts/openapi.yaml` là nguồn sự thật. Types sinh ở `src/lib/api/generated/schema.d.ts`, không sửa tay.
- Fixture có kiểu từ generated types; ví dụ JSON và test phải đồng bộ.
- Endpoint chưa triển khai trả `503 SERVICE_UNAVAILABLE`, không trả response thành công giả.

## Trạng thái hiện tại

Xem [docs/project-status.md](docs/project-status.md) trước khi giao việc cho AI.
Đã có nền BFF, mock `GET /jobs`, `GET /health`, trang `/jobs`, bộ kiểm tra và CI.
Auth mock đã có đăng ký, đăng nhập, làm mới phiên và đăng xuất có CSRF. Xem [luồng auth và tài khoản demo](docs/auth-flow.md).
Thử `candidate@example.com` hoặc `recruiter@example.com`, mật khẩu `TalentAI123!` tại `/login`.
CV, ứng tuyển, matching và dashboard nghiệp vụ recruiter/admin còn là khung; trang riêng kiểm tra session và role phía server.

## Các lệnh

| Lệnh | Công dụng |
|---|---|
| `npm run dev` | Chạy frontend và mock BFF |
| `npm run typecheck` | Kiểm tra TypeScript |
| `npm run lint` | ESLint và quy tắc import kiến trúc |
| `npm run test` | Unit test; không cho pass khi không có test |
| `npm run test:e2e` | Playwright tự khởi động ứng dụng ở chế độ mock |
| `npm run build` | Kiểm tra production build |
| `npm run gen:api` | Sinh lại API types từ contract |
| `npm run contract:lint` | Kiểm tra contract bằng Redocly |
| `npm run mock` | Prism độc lập ở cổng 4010, chỉ để khám phá contract |

Chạy Playwright lần đầu cần cài trình duyệt bằng `npx playwright install chromium`.
`npm run mock` không phải bước bắt buộc để chạy frontend, và frontend không trỏ trực tiếp đến Prism.

## Làm feature với AI

Đọc [AGENTS.md](AGENTS.md), các rule liên quan và workflow tương ứng trong `.agent/`.
Mỗi task nên có: mục tiêu, role, màn hình, endpoint/schema liên quan và tiêu chí nghiệm thu.
SRS chưa được đưa vào repo; không suy đoán yêu cầu từ tên feature.
Triển khai lần lượt: contract → ví dụ → generated types → fixture/adapter → service → hook → UI → test.
Chỉ mở rộng mock đúng phạm vi feature đang làm; không tạo hàng loạt endpoint giả.

## Chuyển sang backend thật

1. Thống nhất contract với backend và chạy `npm run gen:api`.
2. Cấu hình `DATA_MODE=real` và `BACKEND_API_URL` trong `.env.local`, khởi động lại server.
3. Kiểm thử từng endpoint đã được proxy cho phép, không sửa service/UI theo chế độ dữ liệu.
4. Hoàn thiện session, cookie, CSRF, phân quyền và test trước khi mở proxy cho endpoint riêng tư.

Hiện proxy chỉ cho `GET /jobs` và `GET /health`, giữ query, có timeout, thử lại lỗi mạng
và không chuyển tiếp cookie/header nhạy cảm. Tích hợp backend thật chưa được xác nhận.
