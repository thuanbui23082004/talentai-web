# Tích hợp company service thật

Nguồn: Swagger tại `http://localhost:3003/swagger-ui/index.html#/`.
Snapshot các endpoint/schema công khai tại `contracts/upstream/company-service.openapi.json`.
Contract frontend/BFF tiếp tục ở `contracts/openapi.yaml`; không dùng DTO Java trực tiếp trong component.

## Phạm vi và cấu hình

Đã nối dữ liệu thật cho khu vực công ty trên trang chủ, `/companies`, tìm kiếm/bộ lọc,
tải thêm trang và `/companies/[companyId]`.

```dotenv
DATA_MODE=mock
COMPANY_DATA_MODE=real
COMPANY_API_URL=http://localhost:3003/api/v1
```

`.env.local` đã được cấu hình hai biến COMPANY_* trên. Khởi động lại `npm run dev`
nếu tiến trình đang chạy chưa nhận cấu hình mới. Company service có chế độ riêng để không
chuyển những nghiệp vụ khác chưa tích hợp sang backend thật. Khi không đặt COMPANY_DATA_MODE,
các endpoint công ty tuân theo DATA_MODE. Chỉ BFF đọc các biến này.

Hai API xem công ty và hai danh mục là public; BFF không đính kèm token, cookie hoặc header
ủy quyền của trình duyệt. Backend đã mở public trong quá trình nghiệm thu.

## Các bước triển khai

1. Đọc Swagger và gọi trực tiếp endpoint thật để xác nhận cấu trúc, phân trang, ID và quyền public.
2. Đồng bộ contract BFF, thêm danh mục công ty, ID dạng chuỗi chứa số, khoảng quy mô,
   ảnh bìa và số nhân viên thực tế. Chạy `npm run gen:api` để sinh types.
3. Thêm `src/server/bff/public/company-service.ts` để gọi backend, validate phản hồi bằng Zod,
   ánh xạ dữ liệu và chuẩn hóa lỗi. Không chuyển phản hồi lỗi thô hoặc dữ liệu nội bộ ra UI.
4. Nối danh mục vào form tìm kiếm; bộ lọc lưu trong URL và tự trở về trang 1 khi thay đổi.
5. Nối khu vực công ty trang chủ vào cùng API, có dữ liệu đầu SSR và Query phía client để thử lại.
6. Cập nhật trang chi tiết, xử lý dữ liệu thiếu, 404 và danh sách công ty liên quan.
7. Đồng bộ mock/contract example; kiểm thử mapping, privacy, lỗi, responsive và API thật.

## Endpoint và ánh xạ

| Frontend/BFF | Company service |
|---|---|
| GET `/api/bff/companies` | GET `/api/v1/companies` |
| GET `/api/bff/companies/{id}` | GET `/api/v1/companies/{id}` |
| GET `/api/bff/companies/catalogs` | GET `/api/v1/industries` và GET `/api/v1/locations` |

| Tham số BFF | Tham số backend | Xử lý |
|---|---|---|
| `q` | `name` | Từ khóa tìm tên công ty |
| `industryId` | `industryId` | ID số từ danh mục thật |
| `locationId` | `locationId` | ID số từ danh mục thật |
| `size` | `minSize`, `maxSize` | Tách khoảng có sẵn, ví dụ 51–200 |
| `minSize`, `maxSize` | Cùng tên | Khoảng số nhân viên tùy nhập |
| `page` | `page` | Frontend từ 1, backend từ 0 |
| `pageSize` | `size` | Số công ty mỗi trang |
| `city` (URL cũ) | `locationId` | Đối chiếu tên với danh mục, không gửi tên sai vào ID |

Backend trả `content`, `number`, `size`, `totalElements`, `totalPages`.
BFF chuẩn hóa thành `items` và `meta` để UI dùng chung giữa mock/real.
Danh mục ID số được chuyển thành chuỗi để dùng thống nhất trong Select/URL.

## Luồng xử lý

### Trang chủ

Server page → `loadHomePage()` → BFF `/companies?pageSize=8` → company service.
SSR truyền kết quả vào `HomeCompanyList`; client Query tiếp quản cache và thao tác thử lại.
Chỉ sử dụng dữ liệu công ty từ API, không lấy danh sách editorial làm fallback khi lỗi.
Số công ty trong hero lấy từ `totalElements` đã chuẩn hóa; nếu lỗi thì hiển thị dấu gạch,
không dùng số công ty minh họa trước đây. Thống kê việc làm/ứng viên vẫn ngoài phạm vi tích hợp này.

### Danh sách, tìm kiếm và lọc

`CompanySearch` tải ngành nghề/địa điểm từ `/companies/catalogs` → người dùng nhập tên,
chọn ngành/địa điểm/quy mô hoặc nhập khoảng số nhân viên → cập nhật query URL →
`useCompanies` → service `getCompanies` → apiClient → BFF → company service.
BFF kiểm tra tham số, ánh xạ và gọi backend. Các bộ lọc được backend áp dụng trước phân trang.
UI hiển thị kết quả, trạng thái rỗng hoặc lỗi có nút thử lại. Tải thêm yêu cầu trang kế tiếp,
không tải toàn bộ dữ liệu để lọc phía client.

### Chi tiết

Chọn thẻ công ty → `/companies/{id}` → loader server kiểm tra UUID → BFF gọi chi tiết thật.
Backend 404 được chuyển thành trang không tìm thấy. Lỗi kết nối đi vào error boundary.
Trang hiển thị tên, logo/ảnh bìa nếu có, giới thiệu, quy mô, ngành nghề, địa chỉ và website.
Công ty cùng ngành được tìm theo ID ngành; nếu thiếu ngành thì hiển thị công ty khác với nhãn phù hợp.

### Dữ liệu thiếu và lỗi

- Zod kiểm tra cấu trúc phản hồi trước khi trả về frontend.
- HTTP 400/422 → lỗi bộ lọc; 404 → không tìm thấy; 401/403 → lỗi truy cập;
  lỗi mạng, phản hồi sai schema và lỗi server → 503 với thông báo an toàn.
- Chỉ retry GET, tối đa 3 lần đối với lỗi kết nối/5xx; không redirect theo backend.
- Không trả `taxCode`, `contactEmail`, `contactPhone`, version và các trường nội bộ từ DTO Java.
- Chỉ giữ URL ảnh/website HTTP(S) hợp lệ. Nội dung giới thiệu được React render như văn bản.
- Thiếu logo thì dùng tên công ty; thiếu ngành/địa điểm thì không tự gán dữ liệu giả.
- Danh sách backend chưa trả verificationStatus/openJobsCount nên không tạo badge hoặc số việc giả.

## Giới hạn đúng theo Swagger

Company service chưa có API việc làm theo công ty và chưa có bộ lọc xác minh/đang tuyển.
Giao diện tìm kiếm chỉ đưa ra các tiêu chí backend hỗ trợ. Trang công ty thật không ghép
việc làm mock vào ID thật. Endpoint jobs của company trong real trả lỗi chưa sẵn sàng nếu gọi trực tiếp;
UI không gọi endpoint này khi backend không cung cấp số việc làm.

Tạo/chỉnh sửa hồ sơ công ty của recruiter không nằm trong phạm vi tích hợp công khai lần này.

## Nghiệm thu

Typecheck, lint, build và contract lint đã pass (contract có cảnh báo license sẵn có).
195 unit test, 7 E2E mock và 2 E2E với API thật đã pass. Đã kiểm tra giao diện 375px và 1280px.

- Đã gọi trực tiếp backend và qua BFF: danh mục, danh sách 20 công ty, trang 2, tên,
  ngành, địa điểm, khoảng quy mô, tổ hợp bộ lọc, kết quả rỗng và ID không tồn tại.
- Hai E2E real dùng backend thật, không intercept response: danh mục/404/responsive và
  đối chiếu ID/tổng số phần tử/tải thêm/tìm kiếm/chi tiết/trang chủ.
- Dữ liệu backend lúc kiểm tra chưa gắn ngành/địa điểm vào các công ty mẫu; hai bộ lọc này
  trả rỗng đúng với truy vấn trực tiếp. Không tự bổ sung ngành/địa điểm để làm dữ liệu trông đầy đủ.
- Lệnh real trên PowerShell:

```powershell
$env:COMPANY_DATA_MODE = 'real'
$env:COMPANY_REAL_E2E = '1'
npm.cmd run test:e2e -- tests/e2e/company-service-real.spec.ts
```

Các test mặc định dùng company mock để giữ độc lập với backend; test real chỉ chạy khi bật biến trên.
