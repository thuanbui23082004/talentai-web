# TalentAI Web - Hướng dẫn cho AI agent

## Đọc trước khi làm việc

- Quy tắc dự án: đọc `.agent/rules/00-project.md` trước tiên.
- Làm UI/frontend: đọc thêm `.agent/rules/10-frontend.md`.
- Làm schema/dữ liệu: đọc thêm `.agent/rules/20-data-mode.md`.
- Làm auth, token, upload file: đọc thêm `.agent/rules/30-security.md`.
- API: `contracts/openapi.yaml` là nguồn sự thật. Chỉ đọc phần `paths` và `schemas` liên quan.

## Workflow (làm theo file tương ứng khi gặp loại việc này)

- Thêm feature mới: `.agent/workflows/new-feature.md`
- Thêm endpoint: `.agent/workflows/add-endpoint.md`
- Contract thay đổi: `.agent/workflows/sync-contract.md`
- Trước khi commit: `.agent/workflows/pre-commit-check.md`

## Lệnh

- Dùng `npm run <script>`: `dev`, `mock`, `gen:api`, `typecheck`, `lint`, `test`.
- Không sửa tay `src/lib/api/generated/schema.d.ts`.
- Chỉ báo hoàn thành khi `npm run typecheck` và `npm run lint` pass.

## Giai đoạn hiện tại

- Backend đang phát triển: mặc định `DATA_MODE=mock`, chạy `npm run dev` là đủ.
- Đọc `docs/project-status.md` để biết endpoint nào đã có mock và phần nào còn là khung.
- Không tự bịa yêu cầu SRS; yêu cầu chưa có trong repo phải được ghi rõ trong task.
- Mỗi feature mới cần mock theo contract, test hành vi và trạng thái loading/empty/error.
- Trên Windows PowerShell nếu `npm.ps1` bị chặn, dùng `npm.cmd run <script>`.

<!-- BEGIN:nextjs-agent-rules -->

## This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->
