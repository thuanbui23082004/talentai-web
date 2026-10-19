# Workflow: Thêm Feature Mới

1. Tạo thư mục feature trong `src/features/<feature-name>`.
2. Tạo cấu trúc chuẩn:
   - `components/`
   - `hooks/`
   - `services/`
   - `schemas/`
   - `types.ts`
   - `index.ts` (export public API)
3. Cập nhật route tương ứng trong `src/app/` nếu có UI page.
4. Đảm bảo chạy `npm run typecheck` và `npm run lint`.
