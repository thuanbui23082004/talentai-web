# Trạng thái triển khai

## Tổng quan admin qua API thật (2026-11-25)

Khi `COMPANY_DATA_MODE=real`, BFF tổng hợp `/admin/stats/overview` từ API
company-service (tổng công ty, công ty PENDING, báo cáo PENDING) và danh sách tin công khai ACTIVE
của job-service. Biểu đồ dùng ngày tạo từ danh sách công ty; nhật ký gần đây đọc
`/admin/audit-logs`. Không suy diễn số ứng viên, nhà tuyển dụng hoặc tin chờ duyệt
vì backend hiện chưa có API admin cho các chỉ số này; giao diện hiển thị dấu `—`.
Doanh thu lấy từ `GET /admin/orders/statistics` (tổng đơn PAID); nếu payment-service
chưa sẵn sàng thì ô này giữ dấu `—` mà không làm hỏng các chỉ số còn lại.

## Xác minh doanh nghiệp qua company-service (2026-11-24)

Onboarding yêu cầu một tài liệu pháp lý PDF/PNG/JPG tối đa 10 MB ở bước xác nhận.
BFF tải tài liệu qua `POST /recruiter/company/documents`, sau đó gọi
`POST /recruiter/company/verification` để chuyển công ty sang `PENDING`.
Trang hồ sơ recruiter hiển thị trạng thái từng tài liệu và cho phép gửi bổ sung.
Admin `/admin/companies` dùng danh sách công ty thật khi `COMPANY_DATA_MODE=real`;
chi tiết ghép danh sách với `GET /admin/companies/{companyId}/documents` vì backend
chưa có endpoint chi tiết admin. Admin có thể tra cứu MST, xem tài liệu, duyệt/từ chối
từng tài liệu, rồi xác minh hoặc từ chối công ty. BFF chỉ cho xác minh khi có tài liệu
đã duyệt, không còn tài liệu chờ và kết quả tra cứu MST khớp, đang hoạt động.
Backend chỉ hỗ trợ quyết định công ty `VERIFIED`/`REJECTED`; thao tác đình chỉ và
khôi phục của mock không hiển thị ở chế độ real. Backend chưa lưu lý do từ chối
ở cấp công ty; lý do từ chối từng tài liệu được lưu qua API tài liệu.

Đã kiểm thử BFF bằng phản hồi theo Swagger. Chưa nghiệm thu toàn bộ luồng với tài khoản
recruiter và admin thật; cần chạy thử upload và xét duyệt trên môi trường tích hợp.

## Admin — vị trí việc làm (2026-11-24)

Tab “Vị trí việc làm” trong `/admin/catalog` dùng BFF nối tới `GET/POST /api/v1/admin/job-categories`
và `PUT/DELETE /api/v1/admin/job-categories/{id}` khi `ADMIN_CATALOG_DATA_MODE=real`.
Danh sách ngành cha lấy từ `GET /api/v1/industries`; vị trí có thể không chọn ngành, và khi sửa
BFF gửi `industryId: null` để bỏ ngành. BFF kiểm tra vai trò admin và CSRF, chuyển ID số của Java
thành chuỗi trong contract frontend, đổi phân trang Java từ 0 sang 1, và không lộ lỗi thô.
`DATA_MODE=mock` vẫn giữ mock danh mục khi không bật cờ riêng. Các tab danh mục khác hiện chỉ có mock.
Chưa nghiệm thu thao tác CRUD bằng tài khoản admin thật; unit test của BFF đã kiểm tra ánh xạ và lỗi.

## Auth — đăng xuất và khôi phục mật khẩu (2026-11-22)

Menu ứng viên/nhà tuyển dụng đăng xuất trực tiếp về `/login`, không còn màn hình xác nhận.
`/logout` cũ tự gửi yêu cầu thu hồi phiên và có nút thử lại nếu lỗi. Hai trang
`/forgot-password` yêu cầu mã OTP, `/reset-password` cho nhập mã và mật khẩu mới.
BFF gửi mã trong trường `token` tới `/auth/reset-password`; backend kiểm tra mã khi lưu.
Chưa nghiệm thu email OTP và API trên backend thật.

## Cấu hình gateway hiện tại (2026-11-21)

BFF dùng duy nhất `BACKEND_API_URL=http://localhost:3000/api/v1` cho mọi request thật,
kể cả auth và thông báo. Các biến `*_API_URL` riêng từng service trong ghi chú lịch sử
bên dưới không còn được dùng. Frontend mặc định chạy ở `http://localhost:3000`;
gateway phải chuyển sang cổng host khác và cập nhật `BACKEND_API_URL` để chạy đồng thời.
Chế độ mock/real theo từng nhóm vẫn được giữ.

## Candidate — theo dõi hồ sơ ứng tuyển qua application-service (2026-11-17)

Trang `/candidate/applications` hiện dùng BFF `/candidate/application-tracking` để đọc danh sách,
chi tiết và lịch sử trạng thái từ GET `/api/v1/applications`, `/{id}` và `/{id}/history` của
application-service cổng 3005 khi `APPLICATION_DATA_MODE=real`. Backend phân trang từ 0;
BFF trả trang từ 1 và giữ đủ 8 trạng thái backend. Chỉ hiển thị tiêu đề/công ty nếu có trong
`jobSnapshot`, không ghép dữ liệu minh họa hoặc lộ snapshot cá nhân. Trang có lọc trạng thái,
phân trang, làm mới, loading/empty/error và xem lịch sử. Chưa có tìm kiếm/sắp xếp phía backend.

Application-service chưa có API lịch phỏng vấn candidate; trang real không hiển thị lịch mock.
Mock cũ của `/applications` và `/candidate/interviews` giữ cho các luồng chưa chuyển real;
BFF tracking mới có mock tương ứng để chạy E2E. Test unit với phản hồi Swagger đã pass;
GET tracking real trả 200/danh sách rỗng với tài khoản candidate mới. E2E tạo hồ sơ thật
chưa tới bước POST vì profile-service trả 403 FORBIDDEN khi upload CV của tài khoản test.
Cần kiểm tra quyền CV ở backend rồi chạy lại để nghiệm thu danh sách có hồ sơ thật.
Xem `docs/candidate-application-tracking.md`. Ghi chú `/candidate/applications` ở bảng cũ bên dưới
mô tả màn hình mock trước thay đổi này.

## Admin — Thống kê và báo cáo (2026-11-08)

Đã triển khai giao diện `/admin/statistics`, truy cập từ Hệ thống → Thống kê và báo cáo.
Tổng quan hiện tại dùng API overview; báo cáo theo khoảng ngày gồm chuỗi hoạt động
(6 chỉ số, nhóm ngày/tuần/tháng), hồ sơ theo trạng thái/ngành và tuyển dụng theo ngành/doanh nghiệp.
Chỉ số vận hành dùng ảnh chụp thu thập gần nhất, không áp dụng bộ lọc khoảng ngày.
Các endpoint `/admin/stats/applications`, `/admin/stats/recruitment`, `/admin/stats/system-metrics`
và các metric/interval còn lại của `/admin/stats/timeseries` đã có mock theo contract.
Không thêm endpoint hoặc sửa schema tự sinh. Chưa nghiệm thu backend thật.
Kết quả kiểm tra và các lỗi nền của dự án được ghi tại `reviews/admin-statistics.md`.

Đăng nhập gửi loại tài khoản đang chọn tới BFF. BFF đối chiếu role Java trả về trước khi đặt cookie;
sai loại tài khoản trả `403 AUTH_ROLE_MISMATCH`, giữ người dùng ở trang đăng nhập.

## Recruiter — ứng viên theo tin tuyển dụng

Trang `/recruiter/candidates` dùng GET `/recruiter/jobs/{jobId}/applications` qua application-service cổng 3005
khi `APPLICATION_DATA_MODE=real`. Chọn tin, trạng thái đơn và phân trang theo URL; hiển thị dữ liệu snapshot,
CV đã nộp và thư giới thiệu. Danh mục tin dùng job-service thật; có lối “Xem ứng viên” từ chi tiết tin.
BFF xác thực recruiter, chuyển trang 1 → 0, giữ lỗi quyền/không thuộc công ty, kiểm tra jobId của từng hồ sơ;
không lấy thông tin ứng viên/công ty bằng N+1 hoặc ghép fixture vào dữ liệu thật.
Card mở chi tiết snapshot qua GET `/applications/{id}`; nút “Xem CV” riêng lấy CV đã nộp qua `/applications/{id}/resume`.
PDF được BFF đọc từ kho Cloudinary và trả inline để xem trong popup; DOCX có liên kết mở/tải tệp.
Trang chi tiết mở từ card dùng `?from=job`, giữ luồng chi tiết/sàng lọc cũ cho các trang mock hiện có.
Các mutation trạng thái/đánh giá/AI cũ chưa được gắn vào chi tiết thật.
Đã pass 7 unit test trọng tâm và 1 E2E UI. Lượt đọc backend thật chưa nghiệm thu do chưa có tài khoản/tin kiểm thử phù hợp.
Xem `docs/recruiter-job-applicants-integration.md`. Luồng sàng lọc AI cũ dùng endpoint danh sách mock riêng.

## Tạo tin recruiter — backend thật

`JOB_DATA_MODE=real` nối form tạo/sửa tin, danh mục, danh sách và chi tiết tới job-posting service.
UI đã được người dùng xác nhận: kinh nghiệm theo enum, tách loại hình/chế độ làm việc,
ngành nghề và kỹ năng dùng ID backend, bỏ cấp bậc riêng, bằng cấp và vòng tuyển dụng.
Popup tỉnh/xã dùng chung; BFF tra ID địa điểm thật, không gửi mã địa phương thay cho ID.
Mã tỉnh đã đồng bộ theo danh mục hiện hành cho đủ 34 tỉnh/thành; mã phường/xã giữ 5 chữ số.
Helper chuyển ID theo nhóm `1000000 + mã tỉnh`, `3000000 + mã phường/xã`, có chiều chuyển
ngược để sửa tin và kiểm tra tỉnh/phường trước khi ghi; đã đối chiếu đủ 3.321 phường/xã với backend.
Lương VND đổi triệu đồng → đồng; ngày hết hạn gửi cuối ngày theo múi giờ Việt Nam.
Đã kiểm tra UI desktop/mobile với backend thật: tạo DRAFT, reload, đọc/sửa/lưu lại,
giữ dữ liệu khi lỗi và thử lại; xóa các bản nháp trong lần nghiệm thu thành công.
Tài liệu và thứ tự đọc code: `docs/recruiter-job-posting-integration.md`.

## Job-posting thật — tìm kiếm/lọc việc làm

Đã nối `/jobs`, `/jobs/categories`, `/jobs/{id}` qua BFF với job-posting `localhost:3004/api/v1`.
`.env.local` bật JOB_DATA_MODE=real; cấu hình độc lập với company/auth và các nghiệp vụ mock khác.
Bộ lọc dùng experienceLevel, jobType, workMode, categoryId theo Swagger, bỏ số năm kinh nghiệm,
giới tính, tuyển nhanh và sắp xếp “phù hợp nhất” khỏi form public.
URL cũ dùng city vẫn được hỗ trợ. Bộ lọc địa điểm tái sử dụng popup chọn một tỉnh/thành và tùy chọn phường/xã;
URL lưu provinceCode/wardCode, BFF kiểm tra quan hệ rồi đổi sang provinceId/wardId giống form tạo tin.
Query cũ khác không hỗ trợ trả 422 trong real. Backend hiện chưa hỗ trợ tìm nhiều địa điểm.
Đã kiểm tra với 10 tin công khai của backend. API không trả tên công ty nên UI hiển thị nhãn
chưa cập nhật, không dùng công ty mock hay gọi N+1. Tài liệu review: `docs/job-posting-integration.md`.
Các ghi chú mock phía dưới là trạng thái cũ; phần ứng tuyển và thống kê recruiter chưa nằm trong tích hợp job-posting này.

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

Trang `/forgot-password` hướng người dùng nhập OTP tại `/reset-password`, không đưa mã vào URL. Form OTP có validation, trạng thái đang gửi và lỗi mã hết hạn. BFF nối POST `/api/v1/auth/forgot-password` và `/api/v1/auth/reset-password`; payload reset vẫn dùng trường `token` theo Java. Swagger backend hiện mô tả email dạng liên kết, nên luồng OTP qua email cần được backend xác nhận trước khi nghiệm thu tích hợp thật.
Lần kiểm thử cũ với tài khoản test riêng: forgot lấy token → reset
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

## Popup ứng tuyển — CV tài khoản và API nộp hồ sơ

Đã nối POST `/applications` tới application-service cổng 3005 qua service/hook/BFF, payload jobId/resumeId/coverLetter theo Swagger.
`APPLICATION_DATA_MODE=real`, `APPLICATION_API_URL=http://localhost:3005/api/v1` đã đặt trong `.env.local`.
Có xác thực candidate, CSRF/Origin, khóa gửi trùng, loading/thành công/lỗi, giữ form khi lỗi và không tự retry POST.
Form thật bỏ lựa chọn AI/thỏa thuận/địa điểm mong muốn vì API chưa hỗ trợ; địa điểm tin chỉ để hiển thị.
Mock lưu hồ sơ riêng từng user, kiểm tra CV chính chủ, tin mở và chống trùng; GET mock đọc được hồ sơ vừa nộp.
Đã kiểm tra thật nhưng backend trả `503 DEPENDENCY_UNAVAILABLE: Job Service is unavailable` từ kết nối gRPC nội bộ;
chưa nghiệm thu nộp thật thành công. GET danh sách hồ sơ vẫn theo tích hợp cũ. Xem `docs/application-submission-integration.md`.

Popup tải CV tài khoản qua hook `useCvs`, dùng chung service/BFF `/cvs` với trang quản lý CV. Chọn CV mặc định khi mở; PDF/DOCX không rỗng tối đa 5 MB được upload ngay khi chọn/kéo thả qua `useCvActions`, sau đó tải lại danh sách và chọn CV vừa upload. Có loading/empty/error/retry, khóa upload trùng và yêu cầu đăng nhập candidate. Cấu hình `PROFILE_DATA_MODE=real` nối profile-service cổng 3002; không dùng CV mẫu trong popup nghiệp vụ. Showcase `/ui/application` vẫn nhận CV minh họa tường minh để kiểm tra giao diện.

Form thật hiển thị địa điểm từ tin và chỉ gửi các trường API hỗ trợ. Showcase `/ui/application` giữ ba trường hợp một/nhiều địa điểm và chưa có CV để xem thử giao diện; các ô xác nhận/địa điểm lựa chọn ở showcase chưa được gửi vào hồ sơ thật.

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
| GET `/jobs` | 18 tin mẫu; tìm từ khóa, nhiều tỉnh/thành và phường/xã bằng checkbox, lương, kinh nghiệm, cấp bậc, loại hình, phân trang và sắp xếp. BFF chuyển `provinceCodes`/`wardCodes` sang `provinceIds`/`wardIds` của Job Posting Service; BE ghép các tỉnh theo OR, các phường/xã theo OR và hai nhóm theo AND. |
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
| `/candidate/cv` | Đã tích hợp thật danh sách/upload/chi tiết/đặt mặc định/xóa qua BFF `/cvs` và profile-service cổng 3002. PDF/DOCX tối đa 5 MB; kiểm tra session/role/CSRF/quyền sở hữu. CV đầu tiên tự mặc định; xóa CV mặc định tự chọn bản còn lại gần nhất. Loading/empty/error/retry, xác nhận xóa, thống kê số CV từ API và phân trang client. Thư viện mẫu/editor giữ riêng dạng bản nháp cục bộ, không trộn vào CV tài khoản. AI/lưu template/xuất PDF nằm ngoài phạm vi. Xem `docs/cv-integration.md`. |
| Phân tích AI, matching, recruiter, admin | Trang `/candidate/matching` chọn CV đã lưu và job đang tuyển để gọi `POST /matching/previews` qua BFF; kết quả điểm/kỹ năng hiển thị từ phản hồi 200, xử lý `FAILED/AI_UNAVAILABLE`. Mock có phản hồi xác định và kiểm tra quyền sở hữu CV; real chuyển bearer token ứng viên tới gateway. `MATCHING_DATA_MODE` có thể chọn riêng; khi chưa đặt, matching dùng real nếu cả CV và jobs đều real, tránh so CV thật với kho mock. File CV mới chọn chưa được endpoint này hỗ trợ; cần lưu CV và chọn job. Ban đầu chỉ hiện form; khi chấm, khung kết quả mở ra với loading rồi hiển thị điểm, kỹ năng và sáu tiêu chí từ BE. Recruiter/admin còn các phần khung. |
| `/candidate/applications` | Quản lý 12 hồ sơ minh họa, tái sử dụng JobCard với biến thể ứng tuyển; lọc trạng thái, tìm kiếm debounce, sắp xếp ngày nộp/phân trang qua URL; tiến trình và CV đã nộp. Thẻ phỏng vấn có lịch GMT+7, hình thức/địa điểm, xác nhận lời mời và tải lịch `.ics`; khối lịch gần nhất; loading/empty/error/retry và responsive. “Đã kết thúc” gồm rejected/withdrawn; không suy diễn lý do từ chối hay thông tin offer khi contract chưa có |
| API quản lý ứng tuyển | GET `/applications`, GET `/candidate/interviews`, POST `/candidate/interviews/{interviewId}/respond` theo contract sẵn có. Mock kiểm tra session/role; phản hồi kiểm tra CSRF/Origin và chống phản hồi trùng, lưu riêng từng tài khoản trong bộ nhớ (reset khi server khởi động lại). Chưa nối backend thật; real proxy vẫn đóng. Chưa triển khai nộp/rút hồ sơ, từ chối lời mời trên UI, chi tiết riêng `/applications/{id}` hoặc thông báo phát sinh từ xác nhận. Toàn bộ lịch/công ty/hồ sơ trên màn hình là minh họa, không cam kết cập nhật thời gian thực |
| Thông báo ứng viên | Popup ở chuông header và trang `/candidate/notifications`; lọc tất cả/chưa đọc, phân trang, mở thông báo và đánh dấu đã đọc/tất cả đã đọc; loading/empty/error/retry; badge lấy số chưa đọc từ notification-service thật |
| Thông báo nhà tuyển dụng | Chuông ở header dùng notification-service thật: chỉ hiện badge khi có thông báo chưa đọc; popup hiện tối đa 5 mục, trạng thái tải/rỗng/lỗi và đánh dấu đã đọc khi bấm mục. Giữ nguyên bố cục chuông và popup hiện có |
| `/recruiter/payment-history` | Trang lịch sử thanh toán trong nhóm Dịch vụ, có trạng thái chưa có dữ liệu và lối sang Bảng giá. Chưa có API giao dịch của nhà tuyển dụng hoặc luồng mua gói trong contract nên chưa hiển thị lịch sử thật; không dùng giao dịch demo của admin làm dữ liệu nhà tuyển dụng. |
| API thông báo | BFF luôn gọi notification-service ở `NOTIFICATION_API_URL` (mặc định `http://localhost:3007/api/v1`), không còn dữ liệu mock. GET danh sách và số chưa đọc; PATCH đánh dấu một hoặc tất cả đã đọc. BFF đổi trang 1-based sang 0-based, `isRead=false` sang `unreadOnly=true`, và chuẩn hóa `subject/read` cho UI. Token chỉ gửi từ server; ghi kiểm tra CSRF/Origin. Kiểm tra local ngày 18/11/2026: auth-service xác nhận session nhưng notification-service trả 401 cho cùng access token; cần kiểm tra hai service dùng cùng `JWT_SECRET` rồi khởi động lại. BFF hiển thị lỗi dịch vụ, không đăng xuất nhầm người dùng. Xóa/cài đặt thông báo chưa triển khai |
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

## Bảng theo dõi ứng viên theo tin (2026-11-06)

- Chi tiết hồ sơ mở từ tin tuyển dụng hiển thị kỹ năng, kinh nghiệm, học vấn và chứng chỉ từ `applicantSnapshot` của application-service, tức dữ liệu tại lúc nộp hồ sơ. Hồ sơ cũ không có snapshot chi tiết hiển thị trạng thái trống; mock và contract đã bổ sung các trường này.

- Trang ứng viên dùng dạng thẻ; nút Bảng theo dõi thay nút Danh sách và yêu cầu chọn tin trước khi điều hướng.
- Bảng `/recruiter/candidates/pipeline?jobId=...` dùng API danh sách theo tin, tải đủ trang và chia 8 trạng thái thật; có select đổi tin.
- Kéo thả hoặc select trạng thái gửi PATCH `/recruiter/job-applications/{id}/status` qua BFF tới application-service, kèm `status` và `version`. Chỉ chuyển đúng từng bước hoặc từ chối; không retry ghi. Lỗi/xung đột tải lại bảng để đồng bộ.
- Mock cùng endpoint giữ trạng thái/version trong bộ nhớ và kiểm tra quyền công ty, CSRF, chuyển bước. Không dùng điểm AI giả trên card.
- Chi tiết luồng và giới hạn kiểm chứng backend thật: `docs/recruiter-job-applicants-integration.md`.
# CV mẫu từ hồ sơ (2026-11-22)

Thư viện 6 mẫu cho ứng viên mở editor 2 cột, tự điền từ GET profile/experience/education/skills/certificates. Dữ liệu dự án và ngoại ngữ chưa có endpoint profile tương ứng nên bắt đầu rỗng để nhập trong editor. Bản nháp lưu qua POST `/api/bff/cv` (alias `/api/cv`), chỉ là mock trong bộ nhớ tiến trình theo user với session/CSRF; backend thật chưa nhận payload này. Xuất PDF phía trình duyệt bằng html2pdf.js; schema đề xuất ở `docs/cv-template-payload.md`. CV tải lên trong tài khoản vẫn là luồng riêng.

## Cài đặt tài khoản ứng viên (2026-11-22)

`/candidate/settings` hiển thị email đăng nhập và trạng thái từ `/me`, đổi mật khẩu qua BFF `/auth/change-password`, rồi hướng đăng nhập lại vì backend thu hồi refresh token. Liên kết quên mật khẩu dùng luồng khôi phục hiện có. Trang không lặp lại họ tên, số điện thoại, địa chỉ và ảnh của hồ sơ ứng viên. Auth Swagger hiện chưa có endpoint sửa email/xác minh số điện thoại; chưa hiển thị hành động giả cho các mục đó.

## Thống kê đầu trang tổng quan ứng viên (2026-11-22)

Số hồ sơ đã ứng tuyển lấy từ `GET /candidate/application-tracking` (`meta.totalItems`); lời mời chờ phản hồi lấy từ `GET /candidate/interviews` (trạng thái `scheduled` và `pending`). Có trạng thái tải, lỗi và thử lại. Swagger profile-service hiện chưa có API dashboard/lượt xem hồ sơ; ô lượt xem hiển thị chưa có dữ liệu. Bỏ các số minh họa 12/148/3 và câu 18 việc làm phù hợp 90%+; các thẻ gợi ý phía dưới vẫn ghi rõ là minh họa.


## Báo cáo vi phạm

- Ứng viên có thể báo cáo tin tuyển dụng hoặc công ty từ trang chi tiết qua popup với lý do, mô tả và liên kết bằng chứng tùy chọn. Trang /candidate/reports trong mục Hỗ trợ hiển thị báo cáo của tài khoản, trạng thái, phân trang và số liệu tổng cùng số liệu theo trang.
- BFF xử lý GET /reports/my, POST /reports/jobs và POST /reports/companies; khi company service ở real, BFF chuyển sang /api/v1/reports/* với bearer token sau khi xác thực session và kiểm tra CSRF cho POST. Mock lưu riêng theo tài khoản trong bộ nhớ. Số đếm trạng thái trên trang chỉ áp dụng cho trang hiện tại vì API chỉ trả tổng số báo cáo, không trả tổng theo trạng thái.


- Đăng nhập admin trên web xác thực qua auth-service/gateway ngay cả khi DATA_MODE=mock; các trang quản trị mock chấp nhận phiên admin thật đã xác thực. Admin mock adapter vẫn dùng được trực tiếp trong test.


- Trang /admin/reports dùng API thật của company service khi COMPANY_DATA_MODE=real: BFF /admin/violation-reports ánh xạ GET danh sách/chi tiết và PATCH trạng thái sang /api/v1/admin/reports. Danh sách lọc loại đối tượng/trạng thái, phân trang 1-based ở FE và 0-based ở backend; bốn số đếm trạng thái lấy bằng các truy vấn có lọc. Chế độ mock giữ màn quản lý báo cáo cũ.


- POST báo cáo ở BFF trả 204 khi upstream trả HTTP 2xx; UI không kiểm tra lại JSON của lệnh ghi để tránh báo 503 sau khi backend đã lưu. Danh sách GET vẫn kiểm tra schema trước khi hiển thị.


- PATCH trạng thái báo cáo admin trả 204 từ BFF khi backend trả HTTP 2xx. Form hiển thị xác nhận ngay cạnh nút Lưu và tải lại chi tiết; không kiểm tra body của lệnh ghi để tránh báo lỗi sau khi backend đã cập nhật.


- Chi tiết báo cáo admin hiển thị nội dung tin bị báo cáo từ GET công khai /jobs/{jobId} và liên kết mở toàn bộ tin; nếu tin đã đóng hoặc không còn công khai thì giữ thông tin snapshot trong báo cáo và báo không tải được tin. API admin khóa/ẩn tin thật chưa có trong backend local, nên đổi trạng thái báo cáo không tự khóa tin.

