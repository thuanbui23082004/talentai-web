# Danh sách ứng viên theo tin tuyển dụng

API thật: GET `http://localhost:3005/api/v1/recruiter/jobs/{id}/applications`.
Snapshot Swagger: `contracts/upstream/recruiter-job-applicants.openapi.json`.

## Thứ tự đọc code

1. `features/applications/components/recruiter/recruiter-candidates.tsx`: chọn tin, trạng thái, trang qua URL; loading/empty/error/retry, dạng thẻ và nút mở bảng theo dõi (bắt buộc chọn tin).
2. `hooks/use-recruiter-applications.ts` → `services/recruiter-applications.ts`: hook `useJobApplicants` gọi service `listJobApplicants`, query cache theo tài khoản/tin/bộ lọc.
3. `server/bff/recruiter/job-applicants-service.ts`: xác thực recruiter, kiểm tra query, gọi application-service bằng bearer token, chuyển snapshot sang dữ liệu hiển thị.
4. `lib/api/job-applicant-schemas.ts`: validation query và phản hồi backend.

API chỉ nhận một `status`, `page`, `size`. FE dùng trang từ 1, BFF đổi sang trang từ 0.
Không gọi N+1 lấy hồ sơ cá nhân/công ty; dùng applicantSnapshot/jobSnapshot trả trong danh sách.
Chỉ trả các trường cần hiển thị, không chuyển toàn bộ snapshot và thông tin lưu trữ xuống trình duyệt.
Backend là nơi kiểm tra tin thuộc công ty recruiter; BFF giữ nguyên 403/404 và không chuyển sang dữ liệu mock khi lỗi.

Trang ứng viên yêu cầu chọn một tin; nút “Xem ứng viên” trên chi tiết tin mở `/recruiter/candidates?jobId=...`.
Không hiển thị bộ lọc tìm kiếm/kỹ năng/kinh nghiệm/sắp xếp vì API này chưa hỗ trợ.
Danh mục tin phân trang 100 tin/trang; danh sách ứng viên phân trang 9 hồ sơ/trang.
Danh sách này chỉ xem hồ sơ: tên, chức danh, vị trí, trạng thái, ngày nộp, tên CV và thư giới thiệu.
Card mở trang chi tiết `/recruiter/candidates/{id}?from=job`; nút “Xem CV” riêng mở popup và không chuyển trang.
Hai luồng mới dùng GET `/applications/{id}` và `/applications/{id}/resume` của application-service qua BFF
`/recruiter/job-applications/{id}` và `/resume`. Trang chi tiết hiển thị snapshot và thư giới thiệu, không chạy các mutation/AI cũ.
Email và loại hình công việc lấy từ snapshot khi backend cung cấp; không tự tạo ảnh đại diện hoặc dữ liệu liên hệ.

API resume trả URL tải xuống có thời hạn. PDF được đọc qua BFF `/recruiter/job-applications/{id}/cv` để trả nội dung inline,
sau đó UI tạo Blob URL cho iframe và thu hồi khi đóng popup. BFF chỉ đọc HTTPS từ Cloudinary, không đi theo redirect,
không gửi bearer token sang kho file; kiểm tra giới hạn 5MB và chữ ký PDF. DOCX dùng URL tải/mở bằng ứng dụng đọc tài liệu.
Mọi endpoint chi tiết/CV kiểm tra role recruiter; backend kiểm tra hồ sơ thuộc công ty. Các URL CV và bytes không được cache công khai.

## Bảng theo dõi theo tin tuyển dụng

Route `/recruiter/candidates/pipeline?jobId=...` có select đổi tin. Truy cập chưa chọn tin chỉ hiển thị hướng dẫn, không tải hồ sơ.
Luồng đọc: `recruiter-pipeline.tsx` → `use-job-pipeline.ts` → `listJobPipeline` → API danh sách theo tin.
Service tải đủ các trang, mỗi trang 100 hồ sơ, rồi UI chia vào 8 cột trạng thái. Cache theo tài khoản/tin; đổi tin không giữ card của tin cũ.

Luồng cập nhật: kéo tay cầm trên thẻ hoặc dùng select chuyển trạng thái → `useJobPipelineMove` → `updateJobApplicantStatus`
→ BFF PATCH `/recruiter/job-applications/{id}/status` → backend PATCH `/api/v1/applications/{id}/status`.
Payload `{status, version, note?}` đúng Swagger. BFF kiểm tra session recruiter, CSRF và origin; backend kiểm tra quyền công ty và phiên bản.
Không tự retry PATCH. Card chỉ đổi cột sau khi backend xác nhận; tải lại bảng cả khi lỗi để đồng bộ kết quả chưa rõ do timeout.
UI chỉ cho bước tiếp theo hoặc từ chối: submitted → reviewing → shortlisted → interview_scheduled → offered → hired.
Hired/rejected/withdrawn là trạng thái kết thúc, không kéo tiếp. Luồng rút hồ sơ thuộc ứng viên.
Thông tin card lấy từ snapshot và CV đã nộp; không hiển thị điểm AI giả. Link tên mở chi tiết thật, nút CV dùng popup hiện có.

Kiểm thử bổ sung: `job-applicant-status-service.test.ts` kiểm tra payload/version, CSRF/quyền và lỗi/xung đột không retry;
`recruiter-pipeline.spec.ts` kiểm tra phân trang, kéo thả, version mới, xung đột, đổi tin, empty/error/retry và mobile bằng API kiểm soát trong test.
Chưa nghiệm thu thao tác cập nhật bằng tài khoản recruiter thật trên backend đang chạy.

## Chế độ dữ liệu

`APPLICATION_DATA_MODE=real`, `APPLICATION_API_URL=http://localhost:3005/api/v1` đã có trong `.env.local`.
`JOB_DATA_MODE=real` cung cấp danh mục tin của recruiter; UI/service không phân nhánh mock/real.
Mock cùng endpoint kiểm tra chủ công ty của tin, lọc trạng thái và phân trang từ fixture hiện có.

## Kiểm thử trọng tâm

- 3 unit test trong `tests/unit/job-applicants-service.test.ts`: tham số/token/phân trang, role, lỗi và dữ liệu trả sai tin.
- 4 unit test trong `tests/unit/job-application-detail-service.test.ts`: chi tiết, URL hết hạn/không hợp lệ, quyền truy cập và PDF inline không lộ token.
- Một E2E UI trong `tests/e2e/recruiter-candidates.spec.ts`: chọn tin, lọc, đổi trang, retry và empty/mobile.
- Test đọc backend thật bật bằng `RECRUITER_APPLICANTS_REAL_E2E=1` và `APPLICATION_DATA_MODE`, `JOB_DATA_MODE`, `COMPANY_DATA_MODE` bằng `real`; tài khoản lấy từ `RECRUITER_TEST_EMAIL`/`RECRUITER_TEST_PASSWORD`, mặc định tài khoản kiểm thử đã dùng trong repo.

Kết quả cập nhật card/chi tiết/CV: 7 unit test và 1 E2E UI pass; E2E kiểm tra nút CV không chuyển trang,
PDF được hiển thị bằng Blob URL và card mở đúng hồ sơ. Lượt đọc thật đã thử nhưng bị bỏ qua vì chưa có tài khoản/tin kiểm thử phù hợp;
chưa xác nhận nghiệm thu dữ liệu backend thật. Không chạy lại toàn bộ test suite trong thay đổi này.
