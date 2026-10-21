# Workflow: Đồng bộ contract

Áp dụng khi `contracts/openapi.yaml` hoặc `contracts/examples/` thay đổi.

1. Đọc đúng endpoint và schema liên quan, chốt thay đổi với yêu cầu của task.
2. Chạy `npm run contract:lint`; không bỏ qua error.
3. Chạy `npm run gen:api`. Đích duy nhất: `src/lib/api/generated/schema.d.ts`; không sửa tay.
4. Cập nhật ví dụ trong `contracts/examples/`, fixture có kiểu và BFF mock tương ứng.
5. Cập nhật types, service, hook, UI và test của feature. Không dùng `any` để né lỗi.
6. Test bằng mock tích hợp (`npm run dev`); kiểm tra thành công, empty, error và validation.
7. Chạy `npm run typecheck`, `npm run lint`, `npm run test`, `npm run build`.
8. Cập nhật `docs/project-status.md` nếu thêm endpoint đã triển khai hoặc đổi phạm vi mock.

Frontend luôn gọi `/api/bff`. Không dùng `NEXT_PUBLIC_API_URL` hoặc chuyển service sang gọi Prism.
Prism (`npm run mock`) là công cụ khám phá contract riêng, không thay thế adapter có hành vi.
Khi backend sẵn sàng, chỉ đổi cấu hình server `DATA_MODE=real`, `BACKEND_API_URL`, rồi kiểm thử tích hợp.
