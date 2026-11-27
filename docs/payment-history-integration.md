# Lịch sử thanh toán recruiter

Trang `/recruiter/payment-history` đã thay trạng thái trống cố định bằng dữ liệu `GET /api/bff/orders/my`. Đọc Swagger Payment Service tại `/docs/openapi/pay`, đối chiếu `OrderController.getMyOrders`: backend trả `Page<OrderResponse>` trực tiếp.

## Luồng

UI → `usePaymentHistory` → `paymentApi.history` → API client/session → BFF → `GET {BACKEND_API_URL}/orders/my`.

- Dùng `SUBSCRIPTION_DATA_MODE` cùng luồng tạo đơn. Real dùng gateway server-only hiện có, không cần thêm biến payment ở FE.
- BFF xác thực recruiter, không nhận userId từ client, không cache dữ liệu riêng tư. Nếu backend trả đơn có userId khác tài khoản đang đăng nhập thì từ chối hiển thị.
- Query BFF: `page` từ 1, `pageSize` mặc định 10 (tối đa 100), `status` tùy chọn. Chuyển thành query Spring `page` từ 0, `size`, `status`, sort cố định `createdAt,desc`. BFF trả `{ items, meta }`.
- Hiển thị mã đơn, tên gói từ danh mục hoặc mô tả đơn, tiền VNĐ, ngày dd/MM/yyyy, phương thức, trạng thái; không tự suy đoán ngày hoặc tên gói đã bị xóa. Có nút mở lại đơn đăng ký gói tại `/recruiter/billing/result?orderId=...` để kiểm tra/tiếp tục/hủy theo luồng có sẵn.
- API trả tất cả loại đơn; đơn mua lượt xem hồ sơ/đẩy tin vẫn xuất hiện với tên loại tương ứng, nhưng không mở vào màn kích hoạt subscription.
- Lọc CREATED/PENDING/PAID/FAILED/CANCELLED/EXPIRED/REFUNDED; đổi lọc về trang đầu. URL giữ `page`/`status`, hỗ trợ reload/Back. Làm mới hoặc quay lại trang sẽ gọi lại API.
- Mock lấy đúng đơn đã tạo trong store thanh toán của từng user, cùng trạng thái sau thanh toán/hủy. Khởi động lại server thì reset; tài khoản mới thật sự rỗng. `x-mock-scenario=empty|error|slow` hỗ trợ kiểm tra; không chuyển header mock sang backend.

## File thay đổi

- Contract/types: `contracts/openapi.yaml`, `src/lib/api/generated/schema.d.ts` (sinh bằng gen:api), `src/features/recruiter-services/types.ts`.
- Dữ liệu ví dụ có kiểu: `contracts/examples/payment-history.json`, `src/mocks/fixtures/payment-history.ts`.
- BFF: thêm `src/server/bff/recruiter/payment-history.ts`, nối vào `subscription-checkout.ts`; thêm đọc/phân trang/lọc từ store trong `subscription-checkout-mock.ts`.
- Service/hook: `services/payment-api.ts`, `query-keys.ts`, thêm `hooks/use-payment-history.ts` trong feature recruiter-services.
- UI: `src/features/recruiter-services/components/payment-history-page.tsx`, nhãn dùng chung ở `payment-presentation.ts`, route `src/app/(recruiter)/recruiter/payment-history/page.tsx` đọc searchParams.
- Test: `tests/unit/payment-history.test.ts`, thêm kịch bản lịch sử trong `tests/e2e/subscription-checkout.spec.ts`.
- Tài liệu: báo cáo này và `docs/project-status.md`.

## Cách kiểm tra

1. Đăng nhập recruiter có công ty, mở Lịch sử thanh toán. Tài khoản chưa tạo đơn sẽ hiện trạng thái trống đúng dữ liệu.
2. Tạo vài đơn từ Bảng giá, quay lại lịch sử: thấy mã/giá/phương thức/trạng thái. Mở Xem giao dịch để tiếp tục hoặc hủy; quay lại kiểm tra cập nhật.
3. Tạo hơn 10 đơn để thử phân trang; chọn trạng thái, reload và Back. Chọn bộ lọc không có đơn để kiểm tra empty khác trạng thái chưa có lịch sử.
4. Tắt dịch vụ/ép mock error để kiểm tra lỗi tiếng Việt và Thử lại. Xem ở 375px và 1280px.

```powershell
npm.cmd run gen:api
npm.cmd run contract:lint
npm.cmd run typecheck
npm.cmd run lint
npm.cmd run test -- --maxWorkers=2 --testTimeout=30000
$env:SUBSCRIPTION_E2E_AUTH_STUB='1'
npm.cmd run test:e2e -- tests/e2e/subscription-checkout.spec.ts --grep 'payment history lists'
npm.cmd run build
```

E2E sử dụng upstream auth fixture chỉ dành cho test và Payment mock. Không tạo giao dịch ở cổng thật. Tích hợp backend thật cần kiểm tra riêng với tài khoản có đơn; test proxy hoặc mock pass không xác nhận dữ liệu backend thật.

## Kết quả kiểm tra

- `gen:api`, `contract:lint`, `typecheck`, `lint`, `build`: pass. Lint còn 10 cảnh báo có sẵn ngoài phần lịch sử; contract còn 4 cảnh báo có sẵn.
- Toàn bộ unit: 79 file, 449 test pass với `--maxWorkers=2 --testTimeout=30000`.
- E2E lịch sử: pass trên Chromium; tạo 11 đơn mock, danh sách 10 đơn/trang, chuyển trang/reload, lọc không có dữ liệu, lỗi/thử lại, mở lại đơn.
- Đã xem ảnh 1280px và 375px, kiểm tra không tràn ngang. Artifact `payment-history-desktop.png` và `payment-history-mobile.png` nằm trong thư mục kết quả E2E tương ứng ở `test-results/`.
- Lượt khởi động E2E đầu timeout do filesystem chậm; lượt chạy lại đã pass.
