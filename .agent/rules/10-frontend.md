# Quy tắc Frontend

## Cấu trúc thư mục Feature
Mỗi feature trong `src/features/*` bắt buộc có:
- `components/`: UI components nội bộ của feature.
- `hooks/`: Custom hooks sử dụng React Query / UI logic.
- `services/`: Logic gọi API thông qua BFF client.
- `schemas/`: Zod schemas cho validation.
- `types.ts`: TypeScript definitions đặc thù cho feature.
- `index.ts`: Public API của feature (chỉ re-export những gì cần thiết cho bên ngoài).

## Quy ước Route Group
- Phân định rõ vai trò bằng route group kèm segment thật:
  - `(candidate)/candidate/...`
  - `(recruiter)/recruiter/...`
  - `(admin)/admin/...`
- Không đặt trùng path để tránh xung đột routing.
