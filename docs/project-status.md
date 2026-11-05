# Trạng thái triển khai

## Job-posting thật — tìm kiếm/lọc việc làm

Đã nối `/jobs`, `/jobs/categories`, `/jobs/{id}` qua BFF với job-posting `localhost:3004/api/v1`.
`.env.local` bật JOB_DATA_MODE=real; cấu hình độc lập với company/auth và các nghiệp vụ mock khác.
Bộ lọc dùng experienceLevel, jobType, workMode, categoryId theo Swagger, bỏ số năm kinh nghiệm,
giới tính, tuyển nhanh và sắp xếp “phù hợp nhất” khỏi form public. Địa điểm gửi chuỗi tỉnh/thành,
không gửi wardCode/provinceCode. Query cũ không hỗ trợ trả 422 trong real.
Đã kiểm tra với 10 tin công khai của backend. API không trả tên công ty nên UI hiển thị nhãn
chưa cập nhật, không dùng công ty mock hay gọi N+1. Tài liệu review: `docs/job-posting-integration.md`.
Các ghi chú tìm việc chỉ mock phía dưới là trạng thái cũ; recruiter/save/apply chưa nằm trong tích hợp này.

## Company service thật — dữ liệu công ty công khai

Trang chủ, danh sách/tìm kiếm/lọc công ty, tải thêm và chi tiết đã nối company service
`http://localhost:3003/api/v1` qua BFF. Cấu hình riêng `COMPANY_DATA_MODE=real` và
`COMPANY_API_URL` đã đặt trong `.env.local`; các nghiệp vụ khác tiếp tục theo DATA_MODE.
Đã đồng bộ danh mục ngành/địa điểm ID số, phân trang Spring từ 0, tìm tên và khoảng nhân viên.
Không ghép việc mock hoặc số liệu giả vào công ty thật. Hai bộ lọc xác minh/đang tuyển chưa có
trong backend nên đã bỏ khỏi UI tìm kiếm. Các ghi chú công ty chỉ mock bên dưới là trạng thái cũ.
Đã nghiệm thu bằng backend thật với 20 công ty, 195 unit test, 7 E2E mock và 2 E2E real pass;
typecheck, lint, build và contract lint pass. Bộ lọc ngành/địa điểm rỗng
do dữ liệu mẫu chưa gắn danh mục. Chi tiết triển khai, luồng và cách chạy tại
`docs/company-service-integration.md`.

## Hoàn thiện hồ sơ công ty sau đăng ký nhà tuyển dụng

Theo yêu cầu người dùng, đăng ký chỉ tạo tài khoản đại diện. Nhà tuyển dụng đăng ký thành công
được chuyển tới `/recruiter/onboarding`, có server guard role recruiter và giao diện riêng
theo token tím/trắng. Ứng viên vẫn về trang chủ.

Theo yêu cầu cập nhật, onboarding chỉ chia nhỏ phần thông tin công ty thành 3 bước:
1. Thông tin doanh nghiệp: tên, mã số thuế tùy chọn, lĩnh vực hoạt động.
2. Địa chỉ và liên hệ: tỉnh/thành, địa chỉ trụ sở, số điện thoại.
3. Kiểm tra và hoàn tất: xem lại thông tin, quay lại chỉnh sửa và xác nhận tạo hồ sơ.

Đã bỏ bước email, tải giấy tờ và trạng thái chờ duyệt khỏi onboarding.
Form dùng Zod, kiểm tra từng nhóm trường, giữ bản nháp khi chuyển bước/quay lại/lỗi mạng.
Chỉ POST/PUT `/recruiter/company` khi xác nhận ở bước cuối; không tạo công ty chưa đủ dữ liệu.
Bản nháp chưa lưu sẽ mất khi tải lại. Công ty đã lưu được tải lại và hiển thị màn hình hoàn tất.
Sau hoàn tất có liên kết tạo tin tuyển dụng và chỉnh sửa hồ sơ công ty.
Các API và trang quản lý xác thực công ty hiện có không thay đổi.
API nghiệp vụ sử dụng mock hiện có theo DATA_MODE; chưa nghiệm thu công ty với backend thật.
Yêu cầu onboarding và validation bổ sung ở đây là yêu cầu task, không phải SRS đã xác nhận.

## Google/Facebook social login

Đã nối SDK provider → hook/service → BFF → Java `/api/v1/auth/social-login`.
Google gửi ID token, Facebook gửi access token; Java xác minh và quyết định user/role,
BFF đặt JWT HttpOnly như login thường. UI chọn role candidate/recruiter cho tài khoản mới.
Cần điền NEXT_PUBLIC_GOOGLE_CLIENT_ID / NEXT_PUBLIC_FACEBOOK_APP_ID trong `.env.local`
và cấu hình origin/domain tại provider; thiếu cấu hình thì nút tương ứng bị vô hiệu hóa.
Hướng dẫn tại `docs/auth-flow.md`. Đã điền hai ID người dùng cung cấp vào `.env.local`
(gitignored) và tải được SDK thật. Google báo origin `http://localhost:3000` chưa
được cho phép cho Client ID; Facebook SDK báo FB.login không còn hỗ trợ trang HTTP.
Đã thêm `npm run dev:https` cho local HTTPS. Cần cấu hình origin/domain tại provider;
chưa nghiệm thu đăng nhập tài khoản provider thật.
Đã chạy 25 test auth và smoke trình duyệt bằng SDK double: đúng loại token, đúng role
hiện chọn, hủy popup không gửi request, lỗi hiển thị và mobile không tràn ngang.
Đã gọi BFF → Java thật với token sai cho cả hai provider: 401, không đặt cookie.

## Giao diện khôi phục mật khẩu

Đã thêm `/forgot-password` và `/reset-password?token=...`, dùng chung AuthFrame,
input, button, màu sắc và thông báo lỗi của auth. Có liên kết từ trang đăng nhập,
validation tại trường, trạng thái đang gửi, thành công và liên kết thiếu/hết hạn.
Form gọi BFF theo contract; reset chuyển token trong URL qua POST, không lưu vào storage.
BFF đã nối POST `/api/v1/auth/forgot-password` và `/api/v1/auth/reset-password` theo
Swagger Java. Forgot trả 200; chỉ khi `NODE_ENV=development` mới chuyển `resetToken`
đến UI để tạo liên kết thử nghiệm (không prefetch). Production loại bỏ token, không
báo đã gửi thư. Backend chưa gửi email; token dùng một lần/hạn 15 phút do Java quản lý.
Reset chấp nhận 8–100 ký tự theo Java, ánh xạ `PASSWORD_RESET_TOKEN_INVALID` sang
`INVALID_RESET_TOKEN` để hiển thị liên kết hết hạn. Chưa có luồng email thực tế.
Đã kiểm thử thật qua UI/BFF/Java với tài khoản test riêng: forgot lấy token → reset
→ đăng nhập bằng mật khẩu mới; dùng lại token trả 400; email không tồn tại trả 200
không có token. Không dùng response giả lập cho lần nghiệm thu này.

## Đăng ký và đăng nhập ngay

Đăng ký thành công đặt cookie từ token Java, trả RegisterResponse dạng auth
response; ứng viên chuyển về `/`, nhà tuyển dụng sang `/recruiter/onboarding`.
Thông báo thành công cho ứng viên ở góc dưới phải dùng toast chung
timeout 5 giây; bỏ màn hình thành công và bước đăng nhập thủ công.

## Auth: createdAt chưa có khi đăng ký

BFF chấp nhận createdAt null/thiếu từ Java, bỏ trường đó khi map sang User.
Contract User và schema tài khoản frontend cho phép thiếu createdAt; không sinh
ngày thay thế. Có test đăng ký trả 201, login/me với null và từ chối chuỗi ngày sai.

## Đăng ký ứng viên

Đã bỏ trường số điện thoại khỏi form và payload đăng ký ứng viên; validation
không còn chặn ứng viên thiếu phone. Nhà tuyển dụng giữ trường phone bắt buộc.
Contract và generated types đã đồng bộ theo role; auth service Java không đổi.

## Cấu trúc BFF

Đã nhóm `src/server/bff` thành `auth/`, `public/`, `candidate/` và `recruiter/`.
Các điểm điều phối `handler.ts`, `proxy.ts`, `mock-adapter.ts` và helper lỗi
`responses.ts` ở gốc. Import source/test đã cập nhật theo đường dẫn mới;
không thay đổi contract hoặc hành vi endpoint. Bản đồ file và thứ tự đọc tại
`src/server/bff/README.md`.

## Auth luôn dùng backend thật

Đã bỏ mock auth khỏi runtime. Login/register/me/refresh/logout/CSRF và đổi mật
khẩu dùng auth service qua `AUTH_API_URL`, độc lập với DATA_MODE. Server guard
và dữ liệu nghiệp vụ mock gọi Java /auth/me để lấy danh tính. Không còn tài khoản demo đăng nhập.
JWT Java được đặt trực tiếp trong cookie HttpOnly. Đã bỏ session store, mã phiên,
idle timeout, thời hạn 8 giờ và thu hồi phiên cục bộ ở Next.js. Java quản lý
expiry/refresh/revocation; BFF chỉ chuyển tiếp, cookie, Origin/CSRF và mapping.
Contract login/refresh trả expiresInSeconds, không còn expiresAt/idleTimeoutSeconds.
Recovery chờ backend gửi email; social chưa nối.
Phone/consent trên form đăng ký chưa được auth service lưu. Unit test kiểm tra
HTTP upstream bằng test double; chưa nghiệm thu happy path với tài khoản backend
thật. Các E2E cũ dùng tài khoản demo cần chuyển sang tài khoản backend test.
Chi tiết tại `docs/auth-flow.md`; mục này thay thế các ghi chú auth mock bên dưới.

## Tích hợp nhánh nhà tuyển dụng

Đã ghép workspace nhà tuyển dụng với luồng đăng nhập hiện tại: dashboard thống kê,
quản lý tin tuyển dụng, danh sách/chi tiết ứng viên, pipeline, lịch/kết quả phỏng vấn,
sàng lọc AI, tài khoản và doanh nghiệp có BFF mock. Dữ liệu nhà tuyển dụng tách khỏi
18 tin công khai để giữ nguyên tìm việc, hồ sơ ứng tuyển và việc đã lưu của ứng viên.
Đăng nhập workspace mẫu theo `docs/auth-flow.md`; không tự tạo session khi truy cập.
Hộp thư, bảng giá, khuyến mãi và trợ giúp là giao diện minh họa; chưa nối backend.
Các endpoint riêng tư trong real proxy vẫn đóng; chưa xác nhận tích hợp backend thật.
Các ghi chú recruiter còn là khung trong bảng cũ bên dưới được thay thế bởi mục này.
Playwright chạy server riêng ở cổng 3100, dùng `.next-e2e` và một worker vì các
kịch bản nhà tuyển dụng cùng sửa workspace mock trong bộ nhớ.

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
| API việc làm đã lưu | GET `/candidate/saved-jobs`, PUT/DELETE `/candidate/saved-jobs/{jobId}`. Khi `JOB_DATA_MODE=real`, BFF gọi GET/POST/DELETE `/api/v1/saved-jobs` ở job-posting service; PUT chuyển thành POST `{ jobPostId }`, DELETE gửi `jobPostId` qua query; phân trang từ 1 chuyển về 0. Kiểm tra session/role candidate và CSRF/Origin cho ghi; token chỉ ở server. Phản hồi lưu là `{ jobPostId, saved }`, sau ghi tải lại danh sách từ backend. Client tải hết các trang rồi tìm kiếm/lọc/sắp xếp cục bộ. Chế độ mock vẫn có 9 tin minh họa, dữ liệu riêng từng tài khoản, reset khi khởi động server. Đã kiểm thử real lưu/bỏ lưu/hoàn tác/tải lại và cách ly tài khoản |
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
| `/candidate/profile` | Đã nối backend thật cho thông tin cá nhân/giới thiệu và danh sách/thêm/sửa/xóa kinh nghiệm, học vấn; thay thế kỹ năng; danh sách/thêm/xóa chứng chỉ. Popup cá nhân có họ tên, liên hệ, ngày sinh `dob`, giới tính, địa chỉ và quyền riêng tư; chọn tỉnh/xã bằng `LocationPicker`, ghép phường/xã và tỉnh/thành vào `address`, khôi phục lựa chọn khi mở lại. Không gửi tiêu đề nghề nghiệp, avatar và thông tin nghề nghiệp từ popup này. BFF chuyển `privacy` từ backend thành các cờ theo contract FE. `PROFILE_DATA_MODE=real`, `PROFILE_API_URL=http://localhost:3002/api/v1`; mock cùng contract, lưu riêng từng user. Đọc lại backend sau ghi, lỗi giữ nội dung/hiện lỗi theo trường. Giữ timestamp nếu không đổi ngày; backend chưa hỗ trợ xóa ngày sinh bằng null, form báo rõ khi để trống ngày đã lưu. Chứng chỉ chỉ nhập tên và file PDF/JPEG/PNG/WEBP/GIF tối đa 5 MB, tạo tên rồi POST multipart `certificates/{id}/attachment`; thử lại file dùng cùng ID, danh sách có link mở file. Chưa có API sửa tên. Dự án/CV vẫn là bản xem trước. Xem `docs/candidate-profile-integration.md` |

Mock `/jobs` chỉ trả tin `open`. `sort=match_score` cần auth nên trả 401.
Bộ địa điểm hiện hành: snapshot Province Open API v2 gồm 34 tỉnh/thành và 3.321 phường/xã/đặc khu tại `src/lib/locations/`.
Chọn tỉnh rồi chọn phường/xã tùy ý; hỗ trợ tìm tên không dấu. `provinceCode` (2 chữ số) và `wardCode` (5 chữ số) được kiểm tra quan hệ trước khi lọc/phân trang.
`city` vẫn hỗ trợ URL cũ. Các mã mới đã cập nhật contract và mock; backend thật cần triển khai cùng tham số, chưa xác nhận tích hợp real.
Bộ lọc đã hỗ trợ thêm: `salaryMin`, `salaryMax` (giao khoảng), `minExperience`, `maxExperience`, `level`, `workType`. Bộ lọc khác chưa triển khai trả 422.
`relevance` hiện giữ thứ tự mới nhất, chưa có thuật toán xếp hạng từ khóa.
Từ khóa tìm kiếm thực hiện khi gửi form; tại `/jobs`, các bộ lọc và lựa chọn địa điểm tự cập nhật kết quả. Home đã có SSR jobs; `/jobs` hiện dùng client Query. Debounce từ khóa trên trang tìm việc và nộp hồ sơ ứng tuyển chưa triển khai. Lưu/bỏ lưu qua JobCard và trang `/candidate/saved-jobs` đã có mock hoạt động.

Trang `/candidate/job-preferences` đã tích hợp GET/PUT `/candidate/profile` qua BFF, dùng profile-service cổng 3002. Tải dữ liệu theo tài khoản; form trống cho tài khoản mới, loading/error/retry, lưu thật và Hủy khôi phục lần lưu gần nhất. Ngành nghề, nhóm kinh nghiệm, vị trí mong muốn, khoảng lương/thỏa thuận, nhiều địa điểm, cấp bậc, hình thức và ba phúc lợi đều có trường tương ứng trên backend. Chỉ gửi trường tiêu chí để giữ nguyên thông tin cá nhân và giới thiệu. Lương triệu đổi sang VNĐ; khi bật `salaryNegotiable`, giữ khoảng lương cũ và không gửi lại các trường tiền. Không dùng endpoint `/candidate/job-preferences` cũ. Xem `docs/candidate-profile-integration.md`.

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


## Tích hợp tạo hồ sơ công ty (2026-11-04)

- Header nhà tuyển dụng có dropdown khi mở thông tin tài khoản, gồm Tài khoản và Đăng xuất. Đăng xuất đi tới trang xác nhận `/logout`, dùng luồng thu hồi phiên/xóa cookie hiện có. Dropdown đóng khi chọn liên kết, bấm ra ngoài hoặc nhấn Escape.
- Khu vực `/recruiter/*` (ngoài onboarding) kiểm tra company qua BFF ở server trước khi hiển thị. GET company trả 404 thì chuyển về `/recruiter/onboarding`, kể cả đăng nhập lại hoặc mở trực tiếp dashboard/trang tạo tin. Lỗi dịch vụ chặn truy cập và hiển thị trang thử lại; không xem lỗi mạng là chưa có company.
- Hoàn tất khởi tạo khi request tạo company thành công; bước 1–2 chưa lưu bản nháp. Dùng company-service làm nguồn kiểm tra, không dựa vào `companyId` trong hồ sơ auth. Dashboard hiển thị sau khi đã có company dù auth-service không trả `companyId`.
- E2E real kiểm tra đăng nhập lại trước/sau khởi tạo, mở route trực tiếp, tạo company sau xác nhận, dữ liệu lưu ở Java và lỗi trùng mã số thuế.
- `COMPANY_DATA_MODE=real` áp dụng cho đọc/lưu `/recruiter/company` và danh mục `/recruiter/company/catalogs`, ngoài các trang công ty công khai.
- Luồng hiện có 5 bước: thông tin doanh nghiệp → địa chỉ/liên hệ → website/số nhân viên/năm thành lập (có thể bỏ qua) → ảnh đại diện/ảnh bìa (có thể bỏ qua) → kiểm tra và xác nhận. Bước 1–4 chưa ghi; bước 5 lưu thông tin qua BFF, rồi upload các ảnh đã chọn. BFF chuyển POST/PUT thông tin sang `PUT /api/v1/recruiter/company` và ID danh mục chuỗi sang số.
- Đã thêm giới thiệu ngắn bắt buộc vì backend yêu cầu `description`. Mã số thuế bắt buộc; trùng mã hiển thị dưới trường và quay về bước 1.
- Cookie HttpOnly chứa token; BFF xác thực recruiter qua auth-service, kiểm tra origin/CSRF trước khi ghi. Không tự retry lưu.
- Mock vẫn hỗ trợ cùng endpoint danh mục với ID fixture; danh mục thực tế lấy từ company-service, không dùng UUID mock cho API thật.
- Đã nối PUT BFF `/recruiter/company/logo` và `/recruiter/company/cover` sang POST multipart tương ứng ở Java. Preview ảnh đại diện/ảnh bìa có ở bước chọn ảnh, kiểm tra và màn hình hoàn tất. PNG/JPEG/WebP tối đa 2MB trong onboarding; chọn/đổi/bỏ ảnh, lỗi đọc file, responsive. Nếu một ảnh lỗi, thông tin và ảnh đã upload vẫn được giữ; thử lại chỉ tải ảnh chưa thành công, hoặc hoàn tất để bổ sung sau. Ngoài phạm vi: giấy tờ, xác minh, ghi tin tuyển dụng thật.
- Onboarding nhập `companySize` là số nhân viên, không suy diễn từ khoảng `size` của form cài đặt. Website và năm thành lập đều tùy chọn, có validation và lưu thật.
- Kiểm tra ngày 2026-11-05: lưu thông tin company thành công; gọi trực tiếp cả API upload logo/cover trả `502 IMAGE_UPLOAD_FAILED`. Đã kiểm thử UI xử lý lỗi và hoàn tất không có ảnh; chưa xác nhận upload ảnh thật thành công. Backend cần kiểm tra dịch vụ lưu trữ ảnh/log exception. Xem `docs/company-images-onboarding.md`.
- Kiểm thử thật: `$env:COMPANY_REAL_E2E='1'; $env:COMPANY_DATA_MODE='real'; npx playwright test tests/e2e/company-onboarding-real.spec.ts`. Test tạo tài khoản/công ty kiểm thử riêng và kiểm tra lưu trực tiếp ở Java, tải lại trang, lỗi trùng mã số thuế.
