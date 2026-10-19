---
trigger: always_on
---


# Luật dữ liệu: Contract-first và chế độ Mock/Real

## 1. Mục tiêu

Làm FE song song với BE. FE chạy được hoàn toàn bằng dữ liệu mock, và khi BE sẵn sàng chỉ cần đổi biến môi trường,
**không sửa code FE**.

## 2. Luồng gọi dữ liệu (một chiều, không đi tắt)

```
Component → hook → service → lib/api/client → /api/bff/* → server/bff → (mock-adapter | proxy → Backend)
```

1. Component và hook chỉ gọi `services/` của feature. Cấm dùng `fetch`/`axios` trực tiếp.
2. Service chỉ gọi `lib/api/client` (openapi-fetch, `baseUrl = /api/bff`).
3. **Chỉ `src/server/bff` được biết đang mock hay real.** Không đọc `DATA_MODE` ở nơi nào khác, không có `if (mock)` trong component, hook hay service.
4. Cấm tạo thư mục mock ngoài `src/mocks/fixtures/`. Không có `features/*/mocks`, không có `api/mock`.
5. Feature chỉ import feature khác qua `@/features/<name>`.

## 3. Biến môi trường

- `DATA_MODE=mock|real` (mặc định `mock`), `BACKEND_URL=...`. Validate bằng zod trong `lib/env.ts`.
- Cả hai là biến **server-only**, không đặt tiền tố `NEXT_PUBLIC_`. Client không được biết chế độ dữ liệu.
- `.env.example` luôn đồng bộ với `lib/env.ts`.

## 4. Contract-first

`contracts/openapi.yaml` là nguồn sự thật duy nhất cho API.

Thứ tự bắt buộc khi thêm hoặc đổi endpoint:
1. Sửa `contracts/openapi.yaml` (path, schema request/response, mã lỗi).
2. Thêm/cập nhật ví dụ trong `contracts/examples/`.
3. Chạy `npm run gen:api` để sinh lại `src/lib/api/generated/schema.d.ts`.
4. Thêm/cập nhật fixture trong `src/mocks/fixtures/` và route tương ứng trong `server/bff/mock-adapter.ts`.
5. Viết service, rồi hook, rồi UI.

Cấm:
- Sửa tay `src/lib/api/generated/`.
- Tự viết kiểu cho payload API. Dùng `components["schemas"]["..."]` và re-export trong `features/*/types.ts`.
- Bịa endpoint, field hay enum không có trong contract. Thiếu thì dừng lại và đề xuất sửa contract.

## 5. Endpoint dự kiến (để định hướng; contract mới là chuẩn)

| Nhóm | Ví dụ path | Dùng bởi |
|---|---|---|
| Xác thực | `/auth/register`, `/auth/login`, `/auth/logout`, `/auth/forgot-password`, `/auth/reset-password`, `/auth/change-password` | auth |
| Tài khoản | `/me`, `/me/export`, `DELETE /me` | auth |
| Hồ sơ ứng viên | `/candidate/profile`, `.../education`, `.../experience`, `.../skills`, `.../certificates` | profile |
| CV | `/cvs`, `/cvs/{id}`, `/cvs/{id}/versions` | cv |
| AI phân tích | `POST /cvs/{id}/analysis`, `POST /jobs/{id}/analysis`, `GET /analysis-tasks/{taskId}` | cv-analysis |
| AI đối sánh | `POST /matching`, `GET /matching/{taskId}`, `GET /recommendations` | matching |
| Việc làm | `GET /jobs`, `GET /jobs/{id}`, `/saved-jobs` | jobs |
| Ứng tuyển | `POST /applications`, `GET /applications`, `POST /applications/{id}/withdraw` | applications |
| Nhà tuyển dụng | `/recruiter/company`, `/recruiter/jobs`, `/recruiter/jobs/{id}/applications`, `PATCH /applications/{id}/status`, `/recruiter/stats` | recruiter |
| Phỏng vấn | `/interviews`, `POST /interviews/{id}/respond` | interviews |
| Thông báo | `/notifications`, `PATCH /notifications/{id}/read` | notifications |
| Quản trị | `/admin/users`, `/admin/companies`, `/admin/jobs`, `/admin/categories/*`, `/admin/reports`, `/admin/audit-logs`, `/admin/stats` | admin |

## 6. AI bất đồng bộ

Phân tích CV, phân tích JD và đối sánh là tác vụ chạy lâu.
- Khởi tạo: `POST` trả nhanh `202 { taskId }` (mục tiêu dưới 500 ms).
- Theo dõi: `GET /analysis-tasks/{taskId}` trả `status`: `pending | processing | completed | failed`, kèm `result` khi xong.
- `useAnalysisStatus` polling (khoảng 1 giây) và dừng ở trạng thái kết thúc hoặc khi hết thời gian chờ.
- Mock phải mô phỏng đúng vòng đời này: `pending → processing → completed` sau khoảng 2–4 giây, và có kịch bản `failed`.
- Kết quả đối sánh trong contract cần có: `score` (0–100), `matchedSkills[]`, `missingSkills[]`, `strengths[]`, `weaknesses[]`, `explanation`, `suggestions[]`.

## 7. Quy tắc cho fixture (`src/mocks/fixtures/`)

- Khai báo kiểu bằng generated types để contract đổi thì biên dịch báo lỗi.
- Phải khớp `contracts/examples/`. Hai nơi lệch nhau là lỗi.
- Dữ liệu tiếng Việt thực tế: chức danh, công ty giả, địa điểm (Đà Nẵng, Hà Nội, TP.HCM), lương VNĐ.
- **Không dùng dữ liệu cá nhân thật.** Tên, email, số điện thoại đều là giả.
- Deterministic: không `Math.random()`/`Date.now()` trực tiếp (dùng seed hoặc hằng số), để test ổn định.
- Phủ mọi giá trị enum (mọi job status, application status), cộng các trường hợp biên:
  danh sách rỗng, tin đã đóng, đã ứng tuyển, CV sai định dạng, CV không đọc được, JD thiếu thông tin.
- Fixture đối sánh có nhiều mức điểm (ví dụ cao, trung bình, thấp) và danh sách kỹ năng thiếu khác nhau.

## 8. Quy tắc cho `mock-adapter`

- Hành vi phải giống backend thật: cùng hình dạng phân trang, cùng mã trạng thái, cùng định dạng lỗi.
- Giả lập độ trễ (khoảng 200–800 ms) để thấy loading state.
- Hỗ trợ ép kịch bản bằng header `x-mock-scenario`: `empty | slow | error | unauthorized | forbidden | conflict | locked`.
- Mock có trạng thái trong bộ nhớ (tạo/sửa/xóa phản ánh ngay); lưu trên `globalThis` để không mất khi hot reload.
  Khởi động lại server thì reset, đó là hành vi chấp nhận được.
- Mock cũng kiểm tra quyền theo cookie/session giả, để luồng phân quyền test được khi chưa có BE.

## 9. Lỗi chuẩn hóa

`lib/api/errors.ts` chuyển mọi lỗi về một dạng `ApiError { status, code, message, fieldErrors? }`.
Định dạng body lỗi do contract quy định (TODO: chốt với BE). Các mã lỗi nghiệp vụ cần có trong contract:

`EMAIL_ALREADY_EXISTS`, `INVALID_CREDENTIALS`, `ACCOUNT_LOCKED`, `SESSION_EXPIRED`, `VALIDATION_FAILED`,
`JOB_CLOSED`, `ALREADY_APPLIED`, `CV_INVALID_FORMAT`, `CV_UNREADABLE`, `JD_INSUFFICIENT`, `AI_ANALYSIS_FAILED`.

UI ánh xạ `code` sang thông điệp tiếng Việt thân thiện. Không bao giờ hiển thị `message` thô từ server nếu chưa qua ánh xạ.

## 10. Retry

Chỉ BFF được retry, và **chỉ cho request idempotent (GET)** khi lỗi mạng/timeout: tối đa 3 lần, cách nhau 1 giây.
Không tự retry `POST`/`PATCH`/`DELETE` (tránh nộp hồ sơ hay tạo tin hai lần) trừ khi contract hỗ trợ idempotency key.

## 11. Chuyển từ mock sang real

1. Đặt `DATA_MODE=real` và `BACKEND_URL` trong môi trường.
2. Chạy `npm run gen:api` với contract mới nhất của BE.
3. Chạy lại test E2E ở chế độ real với tài khoản test.
4. Khác biệt giữa mock và real được coi là **bug của mock** (hoặc của contract), sửa ở mock/contract, không vá ở FE.