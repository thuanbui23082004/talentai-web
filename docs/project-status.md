# Trạng thái triển khai

## Loading dùng chung

Đã thêm animation nhân vật 8 khung hình từ `animationloading.png`, dùng sprite WebP nền trong suốt. Tích hợp fallback trang chủ/public/candidate và các vùng dữ liệu việc làm, công ty, ứng tuyển, đã lưu; không thêm thời gian chờ giả, có reduced-motion. Xem thử `/ui/loading`, hướng dẫn tại `docs/loading-animation.md`. Không thay đổi contract hoặc trạng thái tích hợp backend.

## Minh họa 404, trống và lỗi tải

Đã tạo ba tư thế mascot từ nhân vật gốc, dùng WebP nền trong suốt 640×640 (~47–50 KiB/ảnh) tại `public/images/states/`. `FeedbackState`/`EmptyState` dùng chung cho 404 toàn site, không tìm thấy job/công ty, lỗi trang, tìm kiếm việc làm/công ty, việc làm đã lưu, ứng tuyển, CV và thông báo (bản compact). Có CTA quay về/xóa lọc/thử lại, thông điệp lỗi an toàn và reduced-motion. Các lỗi validation/mutation nhỏ vẫn dùng Alert/inline, không thay đổi API, quyền hay dữ liệu. Error boundary dùng `retry()` của Next 16.4 để tải lại nội dung. Xem `/ui/states` và `docs/feedback-states.md`.

## Popup ứng tuyển — chỉ giao diện

Theo lựa chọn của người dùng, nút ứng tuyển ở chi tiết việc làm, popup xem nhanh và dashboard mở giao diện chọn CV/tệp cục bộ, thư giới thiệu, địa điểm và các ô xác nhận. CV mẫu tái sử dụng từ phần CV minh họa; không phải CV trong tài khoản. Chỉ chấp nhận PDF/DOCX không rỗng, tối đa tạm 5 MB, hỗ trợ kéo thả/thay/bỏ tệp; không upload, ghi nhận đồng ý, chạy AI hay tạo hồ sơ. Nút nộp báo rõ chưa gửi. Contract và mock không thay đổi.

Một địa điểm được chọn mặc định. UI nhận được danh sách nhiều địa điểm qua prop riêng và yêu cầu chọn đúng danh sách; API JobSummary hiện chỉ có `location`, nên các job API vẫn chỉ có một địa điểm. Showcase `/ui/application` có ba trường hợp một/nhiều địa điểm và chưa có CV. Muốn nối backend phải thống nhất contract cho danh sách/địa điểm đã chọn, sự đồng ý và nội dung thỏa thuận của nhà tuyển dụng.

Modal dùng chung luôn có backdrop tối, kể cả khi lồng dưới CandidateShell. Popup xem nhanh job có lớp phủ không chặn chuột; menu header, select, lịch và popup thông báo giữ tương tác riêng, không thêm backdrop tối.

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
| Thẻ việc làm | Popup xem nhanh khi hover/focus; chạm tiêu đề hoặc “Xem chi tiết” mở `/jobs/[jobId]`. Nút trái tim lưu/bỏ lưu hoạt động qua BFF cho ứng viên, đồng bộ với trang đã lưu; khách mở trang đăng nhập. Ứng tuyển chưa triển khai |
| `/candidate/saved-jobs` | Trang Việc làm đã lưu tái sử dụng JobCard: thống kê tổng/còn tuyển/hết hạn trong 7 ngày; tìm vị trí/công ty không dấu, lọc địa điểm/trạng thái, sắp xếp và phân trang 6 thẻ; bộ lọc qua URL. Tin ngừng tuyển không mở chi tiết/ứng tuyển. Bỏ lưu trực tiếp và hoàn tác; loading/empty/error/retry, desktop/mobile. Đã nối sidebar |
| API việc làm đã lưu | GET `/candidate/saved-jobs`, PUT/DELETE `/candidate/saved-jobs/{jobId}` theo contract hiện có. 9 tin minh họa (gồm 1 tin lưu trữ đã đóng), trạng thái riêng mỗi tài khoản trong bộ nhớ server, kiểm tra session/role/CSRF/Origin; PUT idempotent. Contract chỉ phân trang: client tải hết các trang rồi tìm kiếm/lọc/sắp xếp cục bộ, không thêm tham số API. Khởi động lại server sẽ reset; chưa xác minh backend thật, real proxy vẫn đóng |
| Backend proxy | Chỉ mở GET `/jobs`, GET `/health`; chưa xác minh với backend thật |
| Auth/session | Mock đăng ký/đăng nhập/refresh/CSRF/me/logout; cookie và guard server; xem `docs/auth-flow.md` |
| `/login`, `/register`, `/logout` | Form hai role; khung/ảnh/logo cố định, chỉ content cuộn; ảnh từ `public/images/auth`; logout có xác nhận |
| Dashboard ba role | Trang chào/tài khoản và lối đăng xuất; dashboard nghiệp vụ vẫn chưa triển khai |
| `/candidate/cv` | Trang Quản lý CV & Mẫu CV theo ảnh: toolkit AI, chọn file, hai thẻ CV minh họa, popup xem trước/chỉnh sửa, switch quyền tìm kiếm, xác nhận xóa, phân trang thật và sáu mẫu CV có lọc/sắp xếp/chọn mẫu. Bản CV được dựng HTML/CSS, không dùng ảnh hồ sơ thật. Tạo/sửa/xóa/switch chỉ cập nhật bản xem trước trong bộ nhớ trang; tải lại sẽ reset. Giới hạn 5 bản là lựa chọn trình bày theo ảnh, chưa phải giới hạn tài khoản/API. Chọn file kiểm tra đuôi/MIME PDF/DOCX, tệp không rỗng, tối đa tạm 5MB; chỉ chọn cục bộ, chưa upload hay trích xuất. AI và tải PDF có hộp thoại trạng thái, chưa hoạt động. Chưa nối API `/cvs`, lưu trữ tệp, editor đầy đủ hay thư viện mẫu từ server; contract chưa có thư viện mẫu, quyền tìm kiếm từng CV hoặc số lượt xem hồ sơ. Số lượt xem và trạng thái cơ hội ở đây minh họa |
| Phân tích AI, matching, recruiter, admin | Chỉ có khung; chưa có mock hoạt động |
| `/candidate/applications` | Quản lý 12 hồ sơ minh họa, tái sử dụng JobCard với biến thể ứng tuyển; lọc trạng thái, tìm kiếm debounce, sắp xếp ngày nộp/phân trang qua URL; tiến trình và CV đã nộp. Thẻ phỏng vấn có lịch GMT+7, hình thức/địa điểm, xác nhận lời mời và tải lịch `.ics`; khối lịch gần nhất; loading/empty/error/retry và responsive. “Đã kết thúc” gồm rejected/withdrawn; không suy diễn lý do từ chối hay thông tin offer khi contract chưa có |
| API quản lý ứng tuyển | GET `/applications`, GET `/candidate/interviews`, POST `/candidate/interviews/{interviewId}/respond` theo contract sẵn có. Mock kiểm tra session/role; phản hồi kiểm tra CSRF/Origin và chống phản hồi trùng, lưu riêng từng tài khoản trong bộ nhớ (reset khi server khởi động lại). Chưa nối backend thật; real proxy vẫn đóng. Chưa triển khai nộp/rút hồ sơ, từ chối lời mời trên UI, chi tiết riêng `/applications/{id}` hoặc thông báo phát sinh từ xác nhận. Toàn bộ lịch/công ty/hồ sơ trên màn hình là minh họa, không cam kết cập nhật thời gian thực |
| Thông báo ứng viên | Popup ở chuông header và trang `/candidate/notifications`; lọc tất cả/chưa đọc, phân trang, mở thông báo và đánh dấu đã đọc/tất cả đã đọc; loading/empty/error/retry; badge lấy số chưa đọc thật từ BFF mock |
| API thông báo | GET `/notifications`, GET `/notifications/unread-count`, PATCH `/notifications/{notificationId}/read`, POST `/notifications/read-all` theo contract. Mock minh họa lưu trạng thái riêng từng user trong bộ nhớ, kiểm tra session/CSRF và Origin; khởi động lại server sẽ reset. Real proxy vẫn đóng, chưa xác minh backend thật. Xóa/cài đặt thông báo chưa triển khai |
| `/candidate/profile` | Giao diện hồ sơ và popup nhập liệu theo ảnh: thông tin cá nhân, giới thiệu, kinh nghiệm, học vấn, tối đa 20 kỹ năng, dự án, chứng chỉ (xem trước ảnh PNG/JPEG ≤5MB), nhiều ngoại ngữ/mức độ. Form có Zod validation, Hủy/Lưu cố định, cuộn nội dung trên mobile. Chọn thời gian dùng DatePicker tùy biến: lịch ngày sinh (chặn tương lai), lưới tháng/năm cho kinh nghiệm/dự án, lưới năm học vấn; hỗ trợ bàn phím và xóa/chọn nhanh. Lưu cập nhật bản xem trước trong bộ nhớ trang; chỉnh sửa lại và hủy không đổi dữ liệu đã lưu. Có nhãn rõ dữ liệu mất khi tải lại, chưa kết nối API hồ sơ/upload/AI. Sáu việc làm gợi ý vẫn cố định theo yêu cầu |

Mock `/jobs` chỉ trả tin `open`. `sort=match_score` cần auth nên trả 401.
Bộ địa điểm hiện hành: snapshot Province Open API v2 gồm 34 tỉnh/thành và 3.321 phường/xã/đặc khu tại `src/lib/locations/`.
Chọn tỉnh rồi chọn phường/xã tùy ý; hỗ trợ tìm tên không dấu. `provinceCode` (2 chữ số) và `wardCode` (5 chữ số) được kiểm tra quan hệ trước khi lọc/phân trang.
`city` vẫn hỗ trợ URL cũ. Các mã mới đã cập nhật contract và mock; backend thật cần triển khai cùng tham số, chưa xác nhận tích hợp real.
Bộ lọc đã hỗ trợ thêm: `salaryMin`, `salaryMax` (giao khoảng), `minExperience`, `maxExperience`, `level`, `workType`. Bộ lọc khác chưa triển khai trả 422.
`relevance` hiện giữ thứ tự mới nhất, chưa có thuật toán xếp hạng từ khóa.
Từ khóa tìm kiếm thực hiện khi gửi form; tại `/jobs`, các bộ lọc và lựa chọn địa điểm tự cập nhật kết quả. Home đã có SSR jobs; `/jobs` hiện dùng client Query. Debounce từ khóa trên trang tìm việc và nộp hồ sơ ứng tuyển chưa triển khai. Lưu/bỏ lưu qua JobCard và trang `/candidate/saved-jobs` đã có mock hoạt động.

Trang `/candidate/job-preferences` là giao diện tiêu chí tìm việc theo ảnh tham chiếu, mở từ nhóm **Hồ sơ việc làm → Tiêu chí tìm việc**. Form có tối đa 3 ngành, 5 địa điểm, 5 cấp bậc và 5 hình thức; khoảng lương hoặc thỏa thuận; ba lựa chọn phúc lợi; phần nâng cao thu gọn/mở rộng; Zod validation và Lưu/Hủy bản xem trước trong bộ nhớ trang. Địa điểm dùng snapshot 34 tỉnh/thành hiện hành (Đà Nẵng thay cho tên Quảng Nam cũ trong ảnh). Dữ liệu mặc định chỉ minh họa; tải lại trang sẽ reset. Chưa gọi GET/PUT `/candidate/job-preferences`: contract hiện có một `desiredLevel`, chưa có kinh nghiệm, nhiều cấp bậc và các phúc lợi như UI. Cần thống nhất contract trước khi tích hợp đầy đủ backend; không gửi các trường trình bày vào API.

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
