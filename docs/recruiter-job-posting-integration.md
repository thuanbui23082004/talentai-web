# Tạo tin tuyển dụng qua job-posting service

Swagger: http://localhost:3004/swagger-ui/index.html#/Recruiter%20Job%20Postings/create

Snapshot liên quan: `contracts/upstream/recruiter-job-posting.openapi.json`.
Contract trình duyệt/BFF: `contracts/openapi.yaml`. Types được sinh bằng `npm run gen:api`.

## Luồng code

1. `features/jobs/components/recruiter/job-posting-form.tsx`: form, validation, trạng thái đang lưu/lỗi, preview.
2. `features/jobs/schemas/job-posting-form.ts`: chuyển dữ liệu form sang request, khôi phục dữ liệu sửa tin.
3. `features/jobs/hooks/use-create-job.ts` và `services/recruiter-jobs.ts`: gọi BFF và cập nhật query cache.
4. `server/bff/handler.ts`: chọn mock/real bằng `JOB_DATA_MODE`.
5. `server/bff/recruiter/job-posting-service.ts`: session/role/CSRF, danh mục, HTTP backend, ánh xạ địa điểm.
6. `server/bff/recruiter/job-posting-mapper.ts`: giữ nguyên record Java trong `posting`, tương thích card/detail hiện có.

Không có nhánh mock trong component hoặc service trình duyệt. `JOB_DATA_MODE=real`
không quay lại mock khi backend lỗi. Auth tiếp tục dùng service 3001, công ty dùng service 3003.

## Cấu hình

```dotenv
JOB_DATA_MODE=real
JOB_API_URL=http://localhost:3004/api/v1
COMPANY_DATA_MODE=real
COMPANY_API_URL=http://localhost:3003/api/v1
```

Các giá trị JOB đã có trong `.env.local`. Auth phải là recruiter và đã có hồ sơ công ty.
Frontend chỉ gọi `/api/bff`, token chỉ được chuyển bằng BFF và không trả về JSON.

## API sử dụng

| BFF | Backend |
|---|---|
| GET `/recruiter/jobs/options` | GET `/job-categories`, GET `/skills?page=…&size=100`, GET company-service `/recruiter/company` |
| POST `/recruiter/jobs` | POST `/recruiter/jobs` → DRAFT |
| GET `/recruiter/jobs?page=1&pageSize=100` | GET `/recruiter/jobs?page=0&size=100&sort=createdAt,desc` |
| GET `/recruiter/jobs/{id}` | GET `/recruiter/jobs/{id}` |
| PUT `/recruiter/jobs/{id}` | PUT `/recruiter/jobs/{id}`, có version đã đọc |
| POST `/recruiter/jobs/{id}/publish`, `/pause`, `/close` | POST endpoint tương ứng, `{version}` |
| POST `/recruiter/jobs/{id}/reopen` | POST `/recruiter/jobs/{id}/resume`, `{version}` |
| DELETE `/recruiter/jobs/{id}` | DELETE `/recruiter/jobs/{id}?version=…` |

Command/xóa dùng `If-Match` chứa version đã hiển thị. BFF không tự thay bằng version
mới nhất để vượt xung đột. Backend trả 409 thì UI báo dữ liệu đã thay đổi.
Danh mục kỹ năng lấy đủ các trang, không cắt ngầm sau 100 kỹ năng.

## Các trường đã đồng bộ

- Bỏ cấp bậc riêng, số năm kinh nghiệm, bằng cấp và vòng tuyển dụng theo xác nhận của người dùng.
- `experienceLevel`: INTERN, FRESHER, JUNIOR, MIDDLE, SENIOR, EXPERT.
- `jobType`: FULL_TIME, PART_TIME, CONTRACT, INTERNSHIP, FREELANCE.
- `workMode`: ONSITE, HYBRID, REMOTE.
- `categoryId`, `skillIds` lấy từ danh mục backend, không chuyển tên tự do thành ID.
- Form dùng triệu đồng với VND; request dùng số tiền nguyên theo đồng. Giữ tiền tệ đã lưu khi chỉnh sửa.
- Hạn nộp ngày `YYYY-MM-DD` → `YYYY-MM-DDT23:59:59+07:00`; khi đọc, đổi về ngày ở Việt Nam.
- `workplace` và `addressLine` là dữ liệu riêng của BFF. BFF tra `/job-locations` để lấy tỉnh,
  rồi `/job-locations?parentId={provinceId}` để xác minh phường/xã và lấy ID thực.
  Request Java dùng `locations[{provinceId,wardId,addressLine}]` và chuỗi `location` tổng hợp.
- Không có địa điểm hoặc phường không thuộc tỉnh đã chọn trả 422; không đoán ID hay bỏ mất phường.
- Response giữ record Java trong `RecruiterJob.posting`, gồm version, loại hình, chế độ, kỹ năng và địa điểm.
- UI tạo vẫn yêu cầu các trường nội dung chính trước khi lưu bản nháp; API Java cho phép bản nháp chưa đầy đủ.

Ví dụ request: `contracts/examples/job-posting-input.json`. ID trong ví dụ chỉ là mẫu;
luồng thật luôn lấy danh mục mới từ backend. Các trường `salaryRangeValid`, `skillSelectionUnique`
trong Swagger là thuộc tính validation, không đưa vào form hoặc request.

## Kiểm chứng và giới hạn

Kết quả: 285 unit test pass; 2 E2E real và 2 E2E mock pass; typecheck, lint,
contract lint và production build pass. Lint còn cảnh báo `Star` chưa dùng tại
`company-detail-page.tsx`; contract còn cảnh báo license URL đã có từ trước.

- Unit test: quyền recruiter, CSRF/Origin, payload, location ID, thứ tự đọc công ty trước POST,
  không retry mutation, xung đột version, catalog phân trang, khôi phục dữ liệu form.
- E2E `tests/e2e/recruiter-job-posting.spec.ts` dùng tài khoản/công ty mới, không phụ thuộc tài khoản demo.
- Đã chạy backend thật: tạo 201, đọc 200, sửa 200, xóa bản nháp kiểm thử 204; mobile giữ dữ liệu khi POST lỗi và thử lại thành công.
- Mock có fixture theo contract mới để chạy form khi `JOB_DATA_MODE=mock`.
- Các card/detail cũ vẫn dùng model tương thích; `posting` giữ dữ liệu backend đầy đủ cho form sửa.
  EXPIRED hiện được hiển thị cùng nhóm tin đã đóng, record gốc vẫn giữ EXPIRED.
- Không tích hợp API ứng tuyển, matching hay thống kê trong task này.
