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
4. Chốt endpoint/schema và tiêu chí nghiệm thu của task; không tự suy đoán SRS chưa có trong repo.
5. Làm mock có kiểu và hành vi trước UI, kèm loading/empty/error và test.
6. Cập nhật `docs/project-status.md`; không đánh dấu feature đã xong khi mới có khung.
7. Chạy `npm run typecheck`, `npm run lint`, `npm run test`, `npm run build`.
