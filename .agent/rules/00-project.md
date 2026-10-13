# Quy tắc Dự án TalentAI

## Tổng quan
- Dự án: `talentai-web`
- Stack: Next.js (App Router), TypeScript, Tailwind CSS, shadcn/ui, TanStack Query.
- Kiến trúc: Feature-based, Contract-first (OpenAPI), có BFF (Backend-for-Frontend).
- 3 vai trò người dùng: Candidate, Recruiter, Admin.

## Nguyên tắc cốt lõi
1. **Contract-first**: Mọi API interface phải tuân theo OpenAPI spec trong `contracts/openapi.yaml`.
2. **BFF duy nhất**: Toàn bộ yêu cầu dữ liệu từ Client đi qua BFF endpoint `src/app/api/bff/[...path]/route.ts`.
3. **Feature-based**: Mã nguồn phân chia theo tính năng độc lập tại `src/features/*`.
