# talentAI Web

Nền tảng tuyển dụng tích hợp AI phân tích CV và đối sánh CV với JD.
Frontend: Next.js (App Router) + TypeScript + Tailwind + shadcn/ui.
Backend (microservice) do team khác làm, FE chỉ giao tiếp qua hợp đồng API.
Hiện chưa có backend thật: FE chạy bằng mock.

## Lệnh
- `pnpm dev`: chạy dev server
- `pnpm typecheck` · `pnpm lint` · `pnpm test`
- `pnpm api:gen`: sinh type từ `contracts/openapi.yaml`
- `pnpm api:mock`: chạy mock server (Prism)
- `pnpm e2e`: test Playwright

## Cấu trúc
- `src/app/`: route, chia nhóm `(public)` `(auth)` `(candidate)` `(recruiter)` `(admin)`
- `src/features/<tên>/`: logic theo tính năng (jobs, cv, cv-analysis, matching...)
- `src/lib/api/`: client API. `schema.d.ts` là file TỰ SINH
- `src/components/ui/`: shadcn. `components/shared/`: component dùng chung
- `contracts/`: hợp đồng API giao cho backend
- Code mới của một tính năng đặt trong `src/features/<tên>/`, không đặt rải rác.

## Quy tắc cứng

### API
- `contracts/openapi.yaml` là nguồn sự thật. KHÔNG tự đoán endpoint hay field.
- KHÔNG sửa tay `src/lib/api/schema.d.ts`. Đổi spec rồi chạy `pnpm api:gen`.
- Muốn đổi API: sửa spec TRƯỚC, ghi `contracts/CHANGELOG.md`, rồi mới viết code.
- Không dùng `fetch` trực tiếp, gọi qua `@/lib/api`.

### Code
- Server Component mặc định, chỉ thêm "use client" khi cần state hoặc event.
- Không dùng `any`. Dữ liệu từ stream hoặc bên ngoài phải qua Zod.
- Chữ hiển thị đi qua next-intl (mặc định tiếng Việt), không hardcode.
- Dùng component shadcn có sẵn, không tự viết lại Button, Input, Dialog.
- Không hardcode màu, dùng token trong `globals.css`.

### Nghiệp vụ AI
- Tác vụ AI chạy bất đồng bộ. Luôn xử lý đủ trạng thái:
  queued, parsing, analyzing, completed, failed.
- Kết quả AI luôn hiển thị kèm `explanation` và dòng "chỉ mang tính tham khảo".
- AI chỉ hỗ trợ: KHÔNG tự động loại ứng viên, nhà tuyển dụng là người quyết định.
- Điểm là số nguyên 0-100.

### Bảo mật và dữ liệu cá nhân
- KHÔNG log, không đưa nội dung CV, email, SĐT vào console, URL hay analytics.
- KHÔNG commit `.env`, API key, hoặc CV thật. Dữ liệu mẫu phải là dữ liệu giả.
- Token nằm trong cookie httpOnly do BFF quản lý, không đụng vào bằng JavaScript.
- Kiểm tra quyền ở `middleware.ts` chỉ là lớp tiện lợi, backend mới là nơi kiểm quyền thật.

## Cách làm việc
- Việc lớn hoặc đụng nhiều file: lập kế hoạch ngắn và chờ xác nhận trước khi sửa.
- Thay đổi trong `contracts/` luôn cần được duyệt trước khi áp dụng.
- Một lần chỉ làm một tính năng nhỏ, không tiện tay refactor phần không liên quan.
- Xong việc phải chạy `pnpm typecheck && pnpm lint` và báo kết quả thật.
- KHÔNG tự chạy `git push`, `git reset --hard`, xóa file hàng loạt.
- Không chắc thì hỏi, không đoán.

## Tham chiếu
- Hướng dẫn chi tiết từng loại việc: `docs/ai/*.md`
- Quy trình nhiều bước: `.agent/workflows/` (`/new-feature`, `/add-endpoint`,
  `/sync-contract`, `/pre-commit-check`)
- Luồng người dùng: `docs/product/user-flows.md`
- Quyết định kiến trúc: `docs/adr/`

## Môi trường
- `AGENT_API_MODE=mock|real`. Hiện tại luôn là `mock`.
- Biến môi trường khai báo trong `.env.example` và kiểm tra bằng Zod ở `src/lib/env.ts`.
  Thêm biến mới phải cập nhật cả hai.
- Khi thêm endpoint: phải có mock tương ứng, nếu không FE không chạy được.

## Không tự ý sửa (phải hỏi trước)
- `contracts/openapi.yaml`, `src/middleware.ts`, `.github/workflows/`
- `pnpm-lock.yaml` (không sửa tay), `.env*`
- `src/components/ui/` (file shadcn sinh ra, trừ khi được yêu cầu)

## State
- Dữ liệu từ server: TanStack Query. Không lưu vào Zustand.
- Zustand chỉ cho state UI thuần client (bộ lọc, panel đang mở).
- Form: react-hook-form + Zod resolver.
- Progress phân tích CV: dùng `useAnalysisProgress` (SSE), có polling dự phòng.

## Giao diện
- Mọi màn hình lấy dữ liệu phải có đủ 4 trạng thái: loading (skeleton), rỗng, lỗi, thành công.
- Lỗi API theo RFC 7807. Map mã nghiệp vụ (`CV_UNREADABLE`, `CV_TOO_LARGE`...)
  sang thông báo tiếng Việt ở `features/<tên>/errors.ts`, không hiện lỗi thô.
- Responsive từ 360px. Không truyền đạt thông tin chỉ bằng màu (điểm phải kèm chữ).

## Quy ước
- Thư mục và file: kebab-case. Component: PascalCase. Hook: `use-xxx.ts`.
- Import dùng alias `@/`, không dùng đường dẫn tương đối nhiều cấp.
- Commit theo Conventional Commits (`feat:`, `fix:`, `chore:`). Nhánh `feat/ten-tinh-nang`.
- Không thêm thư viện mới khi chưa hỏi. Chỉ dùng pnpm, không dùng npm hay yarn.

## Test
- Logic thuần (parser SSE, reducer, hàm tính toán): bắt buộc có Vitest.
- Luồng chính (upload CV, xem điểm, recruiter xem xếp hạng): Playwright chạy với mock.
- Dữ liệu mẫu phải là dữ liệu giả, đặt trong `src/mocks/fixtures/`.