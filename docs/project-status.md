# Trạng thái triển khai

## Nguyên tắc giai đoạn mock trước

Backend đang phát triển. Hoàn thành feature frontend dựa trên contract và mock có hành vi,
không phụ thuộc vào backend chạy local. Không coi tên thư mục, page mẫu hoặc types sinh sẵn là feature đã xong.

| Phần | Trạng thái |
|---|---|
| API client, BFF, env validation, QueryProvider | Đã nối |
| `/` trang chủ | Đã dựng theo ảnh: hero, tìm việc, hai bộ sưu tập, ngành nghề, công ty, tin tức và CV; SSR jobs/cache client. Nội dung trình bày mẫu, xem `docs/home-page.md` |
| Header/footer public | Nav tím, dropdown, menu mobile tự đóng, tài khoản theo session; footer 4 cột, app/social có modal trạng thái |
| `/companies` | Hero dùng banner_company.png, số đếm một lần mỗi phiên; tìm tên/địa điểm/ngành/quy mô/xác minh, tải thêm 12 công ty mỗi lần; dùng chung CompanyCard với trang chủ |
| `/companies/[companyId]` | Hồ sơ SSR + SEO; giới thiệu xem thêm, thông tin/liên hệ/bản đồ/chia sẻ, việc đang tuyển phân trang và công ty cùng lĩnh vực. Theo dõi/đánh giá chưa triển khai |
| GET `/companies/{companyId}` và `/companies/{companyId}/jobs` | Mock hồ sơ và việc open của đúng company ID, 404/empty/error/slow; chưa xác minh với backend thật |
| GET `/companies` | Mock 18 doanh nghiệp minh họa; lọc trước phân trang; hỗ trợ empty/slow/error. Contract thêm size/isVerified/hiringOnly; chưa tích hợp backend thật |
| Bộ UI dùng chung | Có 18 nhóm component, token tím/trắng, Inter local; đặc tả tại `docs/ui-spec.md` |
| `/ui` | Trang xem thử biến thể, trạng thái và tương tác; dữ liệu tuyển dụng ở đây chỉ để minh họa |
| GET `/jobs` | 18 tin mẫu; tìm từ khóa, tỉnh/thành, phường/xã, lương, kinh nghiệm, cấp bậc, loại hình, phân trang và sắp xếp |
| GET `/health` | Mock trả `status: ok` |
| `/jobs` | Tìm kiếm qua URL; 12 card/trang; bộ lọc sticky tự cập nhật; loading, empty, error, thử lại |
| `/jobs/[jobId]` | Trang chi tiết SSR và metadata; tái sử dụng JobSearch, JobCard, header/footer; mô tả, yêu cầu, quyền lợi, sidebar, chia sẻ, tin cùng địa điểm; loading/error/404 |
| GET `/jobs/{jobId}` | Mock chi tiết cho 18 tin công khai; trả 404 cho tin không có; kịch bản empty/error/slow. Real proxy chưa mở endpoint chi tiết |
| Thẻ việc làm | Popup xem nhanh khi hover/focus; chạm tiêu đề hoặc “Xem chi tiết” mở `/jobs/[jobId]`; ứng tuyển/lưu việc vẫn chưa triển khai |
| Backend proxy | Chỉ mở GET `/jobs`, GET `/health`; chưa xác minh với backend thật |
| Auth/session | Mock đăng ký/đăng nhập/refresh/CSRF/me/logout; cookie và guard server; xem `docs/auth-flow.md` |
| `/login`, `/register`, `/logout` | Form hai role; khung/ảnh/logo cố định, chỉ content cuộn; ảnh từ `public/images/auth`; logout có xác nhận |
| Dashboard ba role | Trang chào/tài khoản và lối đăng xuất; dashboard nghiệp vụ vẫn chưa triển khai |
| CV, phân tích AI, matching, ứng tuyển, recruiter, admin | Chỉ có khung; chưa có mock hoạt động |

Mock `/jobs` chỉ trả tin `open`. `sort=match_score` cần auth nên trả 401.
Bộ địa điểm hiện hành: snapshot Province Open API v2 gồm 34 tỉnh/thành và 3.321 phường/xã/đặc khu tại `src/lib/locations/`.
Chọn tỉnh rồi chọn phường/xã tùy ý; hỗ trợ tìm tên không dấu. `provinceCode` (2 chữ số) và `wardCode` (5 chữ số) được kiểm tra quan hệ trước khi lọc/phân trang.
`city` vẫn hỗ trợ URL cũ. Các mã mới đã cập nhật contract và mock; backend thật cần triển khai cùng tham số, chưa xác nhận tích hợp real.
Bộ lọc đã hỗ trợ thêm: `salaryMin`, `salaryMax` (giao khoảng), `minExperience`, `maxExperience`, `level`, `workType`. Bộ lọc khác chưa triển khai trả 422.
`relevance` hiện giữ thứ tự mới nhất, chưa có thuật toán xếp hạng từ khóa.
Từ khóa tìm kiếm thực hiện khi gửi form; tại `/jobs`, các bộ lọc và lựa chọn địa điểm tự cập nhật kết quả. Home đã có SSR jobs; `/jobs` hiện dùng client Query. Debounce từ khóa, chi tiết đầy đủ, ứng tuyển và lưu việc chưa triển khai.

## Thử các kịch bản mock

Gọi GET `/api/bff/jobs` với header `x-mock-scenario`:

| Giá trị | Hành vi |
|---|---|
| Không đặt | Dữ liệu bình thường, trễ 200ms |
| `empty` | Danh sách rỗng |
| `slow` | Trễ 1500ms |
| `error` | 500 INTERNAL_ERROR |
| `unauthorized` | 401 UNAUTHENTICATED |
| `forbidden` | 403 FORBIDDEN |
| `conflict` | 409 CONFLICT |
| `locked` | 423 ACCOUNT_LOCKED |

Header chỉ có tác dụng ở mock, để kiểm thử UI; một số lỗi ép kịch bản dùng chung
không phải response nghiệp vụ của GET `/jobs` trong contract. Không dùng header này để phân quyền.
Ví dụ: `curl -H "x-mock-scenario: empty" http://localhost:3000/api/bff/jobs`.

## Công việc tiếp theo

1. Đưa SRS hoặc liên kết được phép truy cập vào repo; ghi tiêu chí nghiệm thu cho mỗi task.
2. Hoàn thiện nội dung chính sách chính thức, hồ sơ doanh nghiệp và các chức năng khôi phục/đổi mật khẩu khi đến feature tương ứng.
3. Hoàn thiện jobs: bộ lọc nâng cao, chi tiết, lưu việc và dữ liệu khởi tạo phía server.
4. CV/ứng tuyển, sau đó AI polling và màn hình recruiter/admin theo từng task.
5. Khi thêm mutation: dùng state mock trong bộ nhớ có reset cho test, không hard-code response thành công.
6. Khi backend sẵn sàng: test tích hợp từng endpoint; không tuyên bố real đã chạy chỉ vì mock pass.
