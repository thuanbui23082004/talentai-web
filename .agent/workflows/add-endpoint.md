# Workflow: Thêm Endpoint Mới

1. Khai báo endpoint trong `contracts/openapi.yaml`.
2. Chạy `npm run gen:api` để cập nhật types.
3. Nếu ở chế độ `mock`:
   - Thêm fixture mẫu trong `src/mocks/fixtures/`.
   - Cập nhật adapter tương ứng trong `src/server/bff/mock-adapter.ts`.
4. Viết service trong `src/features/<feature>/services/` sử dụng `src/lib/api/client.ts`.
