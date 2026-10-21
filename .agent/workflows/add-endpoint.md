# Workflow: Thêm Endpoint Mới

1. Kiểm tra endpoint đã có trong `contracts/openapi.yaml`; chỉ sửa contract khi yêu cầu thực sự thay đổi.
2. Chạy `npm run gen:api` để cập nhật types.
3. Nếu ở chế độ `mock`:
   - Thêm fixture mẫu trong `src/mocks/fixtures/`.
   - Cập nhật adapter tương ứng trong `src/server/bff/mock-adapter.ts`.
4. Viết service trong `src/features/<feature>/services/` sử dụng `src/lib/api/client.ts`.
5. Không trả thành công cho endpoint chưa triển khai. Test dữ liệu, lỗi, phân trang và quyền liên quan.
6. Cập nhật `docs/project-status.md`. Real proxy chỉ mở endpoint sau khi có kiểm tra session/CSRF cần thiết.
