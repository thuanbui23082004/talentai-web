# Job-posting: tìm kiếm và lọc việc làm thật

Swagger: `http://localhost:3004/swagger-ui/index.html#/Public%20Job%20Postings/detail_1`.
Snapshot endpoint/schema liên quan: `contracts/upstream/job-posting.openapi.json`.

## Thứ tự review

1. `src/server/bff/public/job-service.ts`: toàn bộ HTTP request, đổi tham số và đổi response nằm trong một file.
2. `src/features/jobs/components/job-search.tsx` và `search-options.ts`: các bộ lọc khớp enum backend.
3. `src/lib/jobs/validation.ts`: validation trước khi gọi backend.
4. `src/server/bff/handler.ts`, `src/lib/env.ts`: chọn job service thật, không ảnh hưởng chế độ của company/auth/nghiệp vụ riêng tư.
5. `contracts/openapi.yaml` và generated types: đồng bộ contract, không sửa tay file sinh tự động.

## Cấu hình và API

`.env.local` đã đặt:

```dotenv
JOB_DATA_MODE=real
JOB_API_URL=http://localhost:3004/api/v1
```

Frontend tiếp tục gọi cùng-origin `/api/bff/jobs`. BFF gọi trực tiếp job-posting service.
Không gọi backend từ component, không thêm thư viện hoặc tầng service/factory mới.

| BFF | Backend |
|---|---|
| GET `/jobs` | GET `/api/v1/jobs` |
| GET `/jobs/categories` | GET `/api/v1/job-categories` |
| GET `/jobs/{id}` | GET `/api/v1/jobs/{id}` |

Chi tiết được nối cùng mapper để các link từ kết quả tìm kiếm không rơi vào mock/404.
Không mở endpoint recruiter, lưu việc hay ứng tuyển trong lần tích hợp này.

## Các trường đã xử lý xung đột

| Trước đây | Theo job-posting |
|---|---|
| Kinh nghiệm theo số năm min/max | `experienceLevel`: INTERN, FRESHER, JUNIOR, MIDDLE, SENIOR, EXPERT |
| Remote/Hybrid lẫn trong workType | Tách `jobType` khỏi `workMode`: ONSITE, HYBRID, REMOTE |
| Cấp bậc manager/director/lead | Không đưa vào bộ lọc thật vì backend không hỗ trợ |
| Mã tỉnh/phường | Tái sử dụng popup `LocationPicker`, chọn một tỉnh/thành và tùy chọn một phường/xã. URL/BFF nhận `provinceCode`, `wardCode`; BFF kiểm tra quan hệ và chuyển sang `provinceId`, `wardId` theo danh mục backend |
| industryId UUID | `categoryId` số, lấy từ danh mục job-posting |
| Sắp xếp phù hợp nhất/matching | Bỏ khỏi UI; mặc định mới nhất |
| Response `id` | Backend trả `jobPostId`, BFF đổi về id cho thẻ việc làm hiện có |
| Response salary/location lồng nhau | Backend trả phẳng; mapper giữ model hiển thị hiện có |
| Response có số năm kinh nghiệm | Backend chỉ có enum; hiển thị đúng enum, không tự gán 0 năm |
| Currency chỉ VND/USD | Response chấp nhận mã tiền tệ 3 chữ cái; form recruiter cũ vẫn kiểm tra rõ VND/USD |
| Chu kỳ lương mặc định tháng | Backend không trả chu kỳ; response không tự thêm tháng/năm |

`q` → `keyword`, `city` → `location`, `pageSize` → `size`, `page` frontend từ 1 → backend từ 0.
Giữ 4 tên URL/frontend này để tránh sửa các link và phân trang dùng chung không cần thiết.
Các trường còn lại gửi nguyên tên backend. Bộ lọc lương trên UI dùng VNĐ và gửi salaryCurrency=VND.

Sort được đổi qua bảng 4 giá trị: newest → publishedAt,desc; salary_desc → salaryMax,desc;
salary_asc → salaryMin,asc; deadline → deadline,asc.

`provinceCode`/`wardCode` là bộ lọc hiện hành, dùng chung danh mục 34 tỉnh/thành và 3.321 phường/xã với form tạo tin.
BFF dùng cùng helper chuyển mã sang ID của form tạo tin (`1000000 + provinceCode`, `3000000 + wardCode`).
Không gửi đồng thời chuỗi `location` khi đã có mã tỉnh. URL `city` cũ vẫn hỗ trợ tìm theo chuỗi.
Swagger hiện chỉ nhận một `provinceId` và một `wardId`, chưa hỗ trợ chọn nhiều địa điểm.
Các query cũ khác đã deprecated trong contract vẫn được giữ cho test/mock cũ, không xuất hiện trong UI mới.
Ở chế độ real chúng trả 422 nếu gọi trực tiếp, không bị âm thầm bỏ qua.
Các thuộc tính salaryRangeValid/salaryCurrencyValid trong Swagger là kết quả validation,
không được đưa vào form hoặc chuyển thành tham số tìm kiếm.

## Luồng

Form → URL → `useJobs` → `getJobs` → apiClient → BFF → job-posting.
Backend lọc trước phân trang. BFF kiểm tra envelope `{ code, data }`, chuẩn hóa
`data.items/page/size/totalElements/totalPages` thành `{ items, meta }` cho UI hiện tại.
Lỗi tham số trả 422, tin không tồn tại/đã đóng trả 404; lỗi mạng/phản hồi sai trả lỗi an toàn 503.
Chỉ GET được retry tối đa 3 lần, timeout 5 giây mỗi lần.

## Dữ liệu backend chưa cung cấp

JobSummaryResponse/PublicJobResponse chỉ có companyId, không có tên/logo công ty.
UI dùng nhãn “Tên chưa cập nhật”; không lấy tên công ty mock và không thêm request company cho từng thẻ.
Nếu cần hiện tên/logo thật, backend nên bổ sung chúng vào response tìm kiếm để tránh N+1 request.
Các số liệu cá nhân hóa isSaved/hasApplied/matchScore cũng không được tự sinh.

## Kiểm thử

Đợt cập nhật bộ lọc mã địa điểm: typecheck, lint, contract lint, build, 314 unit test,
8 E2E mock và 1 E2E real pass. E2E kiểm tra tỉnh/phường, reload/Back, xóa lọc,
desktop/mobile và đối chiếu provinceId/wardId với backend thật. Chạy unit với
`--testTimeout=30000`, E2E mock với `--timeout=90000` để tránh timeout khi biên dịch lần đầu.

Đã pass typecheck, lint, build, contract lint, 200 unit test, 7 E2E mock và 1 E2E real
với 10 tin công khai. E2E real đã đối chiếu trang 2 có dữ liệu, các bộ lọc, UI mobile và chi tiết tin.

Unit test adapter tại `tests/unit/job-service.test.ts`: enum, tổ hợp bộ lọc, phân trang,
tiền tệ, detail, kết quả rỗng, phản hồi sai và từ chối query không hỗ trợ.
E2E thật tại `tests/e2e/job-service-real.spec.ts`: đối chiếu trực tiếp backend với BFF,
lọc UI, danh mục, responsive và mở chi tiết. Không intercept API cho test real.

```powershell
$env:JOB_DATA_MODE = 'real'
$env:JOB_REAL_E2E = '1'
npm.cmd run test:e2e -- tests/e2e/job-service-real.spec.ts
```

Test mặc định tiếp tục chạy mock; không phụ thuộc backend local để chạy regression.
