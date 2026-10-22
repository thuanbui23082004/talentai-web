# Chi tiết ứng viên — đã triển khai theo kế hoạch được duyệt

## Route và bố cục

- Thêm `/recruiter/candidates/[applicationId]`: chi tiết hồ sơ ứng tuyển trong phạm vi doanh nghiệp.
- Nhấn tên ứng viên trong cả chế độ thẻ và bảng để vào chi tiết; giữ nguyên nút Xem CV.
- Dùng nguyên khung Recruiter đã có: header cố định, không nút ba gạch, sidebar chọn Ứng viên, cùng gutter/max-width.
- Ba cột theo ảnh: hồ sơ cá nhân bên trái, nội dung và tiến trình ở giữa, đánh giá/lịch phỏng vấn/tin tuyển dụng/tệp bên phải.
- Tablet hai cột, mobile 360px một cột; có skeleton, lỗi/thử lại, không tìm thấy và các phần chưa có thông tin.
- Không đưa dòng dữ liệu minh họa vào giao diện.

## API hiện có, không đổi spec

| Chức năng | API |
|---|---|
| Chi tiết hồ sơ, profile, CV, matching, lịch sử và lịch phỏng vấn | GET /recruiter/applications/{applicationId} |
| Tin ứng tuyển, hiringRounds | GET /recruiter/jobs/{jobId} |
| Xem/tải CV | GET /recruiter/applications/{applicationId}/cv — tái sử dụng viewer và service hiện có |
| Nhà tuyển dụng đổi trạng thái/vòng | PATCH /recruiter/applications/{applicationId}/status |
| Đánh giá, phân loại, ghi chú | PUT /recruiter/applications/{applicationId}/evaluation |
| Lên lịch phỏng vấn trong form tại chỗ | POST /recruiter/interviews, có Idempotency-Key |

Service chỉ gọi apiClient, dữ liệu ngoài qua Zod, Query quản lý server state. BFF mock dùng cùng application store của trang danh sách; đổi trạng thái/đánh giá/lên lịch phải thực sự cập nhật dữ liệu và invalidate query liên quan. Mock kiểm tra role/company/CSRF và chuyển trạng thái không hợp lệ. Không tự động từ chối ứng viên.

## Đối chiếu với ảnh

- CandidateProfile có email, phone, giới tính, ngày sinh, địa chỉ, links, summary, học vấn, kinh nghiệm, kỹ năng, chứng chỉ; dùng các trường này khi có.
- Ngôn ngữ lấy từ cv.content.languages nếu response có; không bịa language field trong profile.
- Không có sở thích trong schema: phần này chỉ hiển thị trạng thái chưa có thông tin hoặc được bỏ khỏi trang, không tự thêm field API.
- Không trả/hiển thị nationalIdMasked cho recruiter dù field có trong CandidateProfile dùng chung.
- Không có field điểm văn hóa. Không bịa các điểm 10/10, 20/30, 20/20 trong ảnh.
- Độ hoàn thiện hồ sơ dùng completenessPercent. Điểm AI dùng matching.score và breakdown đã có, luôn hiển thị explanation và “chỉ mang tính tham khảo”. Nếu không có matching, hiển thị chưa có kết quả, không gán 50% mặc định.
- Đánh giá của nhà tuyển dụng là rating 1–5, độc lập với điểm AI 0–100.
- Vòng tuyển dụng lấy từ hiringRounds của job và currentRound của application, không coi ảnh là workflow cố định.
- Chỉ tạo link Portfolio khi có link tương ứng trong dữ liệu; không tạo endpoint tệp mới.
- Không có API chat/gửi email. Nếu giữ biểu tượng thư thì dùng thao tác sao chép email, không tạo URL chứa email/SĐT.
- Dữ liệu cá nhân trong fixture phải giả; không dùng người/email/SĐT từ ảnh. Không log dữ liệu hồ sơ hoặc đưa vào URL/analytics.

## Hành vi chính

1. Nhấn tên trong danh sách → chi tiết đúng applicationId; quay lại danh sách.
2. Form đổi trạng thái/vòng và đánh giá mở tại chỗ, có xác nhận rõ với quyết định tuyển dụng/từ chối; lỗi không làm mất nội dung.
3. Nút Lên lịch phỏng vấn mở form: thời gian bắt đầu/kết thúc, online/offline, địa điểm/link họp, người phỏng vấn và nội dung lời mời. Validate bằng RHF + Zod; lưu thành công cập nhật thẻ lịch sắp tới.
4. Nút xem tin dẫn đúng trang chi tiết job có sẵn.
5. Xem CV tái sử dụng viewer và quyền truy cập hiện có. Hồ sơ đã mất CV vẫn đọc được profile và hiển thị CV không khả dụng.
6. Các link mạng xã hội chỉ chấp nhận HTTP(S), không render HTML từ backend.

## File dự kiến

- Route mới trong src/app/(recruiter)/recruiter/candidates/[applicationId]/page.tsx.
- Mở rộng feature applications hiện có: component chi tiết và các panel, form đánh giá/trạng thái/lịch phỏng vấn, schema, services, hooks, query keys, errors, messages; không tạo service hoặc feature trùng.
- Sửa CandidateIdentity để tên dẫn sang trang chi tiết trong cả thẻ và bảng.
- Mở rộng schema boundary trong src/lib/api/application-schemas.ts, dùng generated types hiện có.
- Mở rộng BFF allowlist và dispatch PATCH/PUT theo đúng các endpoint đã có.
- Thêm fixture chi tiết giả trong src/mocks/fixtures/, dùng applicationId/jobId hiện có; không tạo nguồn danh sách ứng viên thứ hai.
- Mock mutation cập nhật chung application store và dữ liệu lịch phỏng vấn.
- Thêm Vitest cho validation, kiểm quyền, mutation và đồng bộ danh sách/chi tiết; Playwright cho xem chi tiết, cập nhật trạng thái/đánh giá/lên lịch, CV và responsive.
- Chạy typecheck + lint và báo kết quả thật.

Không sửa contracts, middleware, env, lockfile hoặc components/ui. Không thêm dependency. Đây là một trang chi tiết; chưa xây toàn bộ phân hệ Interviews/Pipeline.

## Kết quả triển khai

- Đã thêm route chi tiết và liên kết tên ứng viên từ danh sách/thẻ. Giữ nguyên shell Recruiter, cân khoảng cách và responsive từ 360px.
- Đã nối API client, Zod, TanStack Query và BFF mock cho xem hồ sơ, đổi trạng thái, đánh giá và tạo lịch phỏng vấn. Dữ liệu đồng bộ với danh sách; thời gian nhập được chuyển từ giờ Việt Nam sang UTC.
- Schema chi tiết đặt riêng tại `src/lib/api/candidate-detail-schemas.ts` để không làm phình schema danh sách. Không sửa hợp đồng API hay file sinh tự động trong tính năng này.
- Đã sửa validation URL rỗng và tách thông báo lỗi ra khỏi nhãn trường để form vẫn truy cập đúng khi có lỗi. Thao tác lưu cũ không đóng nhầm panel mới mở.
- Kiểm thử: `pnpm typecheck`, `pnpm lint` đạt; Vitest 39/39 đạt. Playwright: 3/3 ca chi tiết đạt ở lượt cuối; 5/5 ca danh sách/tạo tin đạt ở lượt kiểm tra hồi quy trước đó.
- Playwright đã kiểm tra cập nhật trạng thái/đánh giá và đồng bộ danh sách, lịch phỏng vấn theo giờ Việt Nam, validation form rỗng, CV, hồ sơ không tồn tại và không tràn ngang ở 360px. Đã chụp desktop/mobile để kiểm tra bố cục.
- Chỉ xác minh với mock; chưa xác minh backend thật. Không thêm dependency, không đổi middleware, env, lockfile hoặc component shadcn trong lần triển khai này.
