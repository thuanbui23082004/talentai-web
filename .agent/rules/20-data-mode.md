# Quy tắc Data Mode

## Chế độ hoạt động (DATA_MODE)
BFF route (`src/app/api/bff/[...path]/route.ts`) điều hướng theo biến môi trường `DATA_MODE`:
- `mock`: BFF trả về dữ liệu mẫu từ `src/mocks/fixtures/`.
- `real`: BFF proxy request sang backend thật qua `src/server/bff/proxy.ts`.

## Lưu ý về Mocks
- Mọi dữ liệu mock chỉ được đặt trong `src/mocks/fixtures/`.
- Tuyệt đối không tạo thư mục mock tại `features/*/mocks` hay `api/mock`.
