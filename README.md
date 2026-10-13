# TalentAI Web

Dự án frontend cho nền tảng TalentAI.

## Công nghệ sử dụng
- **Framework**: Next.js (App Router) + TypeScript
- **Styling**: Tailwind CSS + shadcn/ui
- **State & Data Fetching**: TanStack Query
- **Contract-first**: OpenAPI (`openapi-typescript`, `openapi-fetch`)
- **Testing**: Vitest (Unit test), Playwright (E2E test)

## Cấu trúc thư mục
- `contracts/`: OpenAPI specification (`openapi.yaml`).
- `src/app/`: Next.js App Router pages và layouts (phân quyền `(candidate)`, `(recruiter)`, `(admin)`, `(public)`, `(auth)`).
- `src/app/api/bff/[...path]/`: Cổng Backend-For-Frontend (BFF) duy nhất điều hướng dữ liệu theo `DATA_MODE` (`mock` hoặc `real`).
- `src/features/`: Feature-based modules (`auth`, `jobs`, `cv`, `cv-analysis`, `matching`, `applications`, `recruiter`, `admin`).
- `src/components/`: Reusable components (`ui`, `shared`, `layout`).
- `src/providers/`: Context providers (QueryClient, Theme, Session).
- `src/lib/`: Tiện ích chung, API client, cấu hình môi trường, auth helpers.
- `src/mocks/fixtures/`: Dữ liệu mock tập trung.
- `src/server/bff/`: Logic proxy và mock adapter cho BFF.

## Scripts
- `npm run dev`: Chạy môi trường development
- `npm run build`: Build production
- `npm run start`: Chạy production build
- `npm run lint`: Kiểm tra linting với ESLint
- `npm run typecheck`: Kiểm tra TypeScript types (`tsc --noEmit`)
- `npm run test`: Chạy unit tests với Vitest
- `npm run test:e2e`: Chạy e2e tests với Playwright
- `npm run gen:api`: Sinh TypeScript types từ OpenAPI contract
