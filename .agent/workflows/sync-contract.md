# Workflow: Đồng bộ Contract (OpenAPI)

1. Cập nhật file contract OpenAPI tại `contracts/openapi.yaml`.
2. Chạy lệnh sinh TypeScript types:
   ```bash
   npm run gen:api
   ```
3. Kiểm tra file được sinh tự động tại `src/lib/api/generated/schema.d.ts`.
4. Không chỉnh sửa thủ công file `schema.d.ts`.
