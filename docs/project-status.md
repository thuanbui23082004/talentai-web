# Trạng thái triển khai

## Nguyên tắc giai đoạn mock trước

Backend đang phát triển. Hoàn thành feature frontend dựa trên contract và mock có hành vi,
không phụ thuộc vào backend chạy local. Không coi tên thư mục, page mẫu hoặc types sinh sẵn là feature đã xong.

| Phần | Trạng thái |
|---|---|
| API client, BFF, env validation, QueryProvider | Đã nối |
| `/` trang chủ | Đã dựng theo ảnh: hero, tìm việc, hai bộ sưu tập, ngành nghề, công ty, tin tức và CV; SSR jobs/cache client. Nội dung trình bày mẫu, xem `docs/home-page.md` |
| Header/footer public | Nav tím, dropdown, menu mobile tự đóng, tài khoản theo session; footer 4 cột, app/social có modal trạng thái |
| Bộ UI dùng chung | Có 18 nhóm component, token tím/trắng, Inter local; đặc tả tại `docs/ui-spec.md` |
| `/ui` | Trang xem thử biến thể, trạng thái và tương tác; dữ liệu tuyển dụng ở đây chỉ để minh họa |
| GET `/jobs` | 6 tin mẫu; tìm từ khóa, thành phố, lương, kinh nghiệm, cấp bậc, loại hình, phân trang và sắp xếp |
| GET `/health` | Mock trả `status: ok` |
| `/jobs` | Tìm kiếm qua URL; loading, empty, error, thử lại |
| Thẻ việc làm | Popup xem nhanh khi hover/focus, tự điều chỉnh theo viewport; chạm tiêu đề mở modal. Hiển thị JobSummary; mô tả chi tiết chưa có, ứng tuyển/lưu việc vẫn chưa triển khai |
| Backend proxy | Chỉ mở GET `/jobs`, GET `/health`; chưa xác minh với backend thật |
| Auth/session | Mock đăng ký/đăng nhập/refresh/CSRF/me/logout; cookie và guard server; xem `docs/auth-flow.md` |
| `/login`, `/register`, `/logout` | Form hai role; khung/ảnh/logo cố định, chỉ content cuộn; ảnh từ `public/images/auth`; logout có xác nhận |
| Dashboard ba role | Trang chào/tài khoản và lối đăng xuất; dashboard nghiệp vụ vẫn chưa triển khai |
| CV, phân tích AI, matching, ứng tuyển, recruiter, admin | Chỉ có khung; chưa có mock hoạt động |

Mock `/jobs` chỉ trả tin `open`. `sort=match_score` cần auth nên trả 401.
Bộ lọc đã hỗ trợ thêm: `salaryMin`, `salaryMax` (giao khoảng), `minExperience`, `maxExperience`, `level`, `workType`. Bộ lọc khác chưa triển khai trả 422.
`relevance` hiện giữ thứ tự mới nhất, chưa có thuật toán xếp hạng từ khóa.
Tìm kiếm thực hiện khi gửi form. Home đã có SSR jobs; `/jobs` hiện dùng client Query. Debounce tự tìm, chi tiết đầy đủ, ứng tuyển và lưu việc chưa triển khai.

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
