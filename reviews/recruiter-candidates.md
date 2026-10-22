# Trang ứng viên của nhà tuyển dụng — đã duyệt và triển khai

Route hiện có: `/recruiter/candidates`. Chỉ thay nội dung placeholder, không tạo route hoặc layout trùng lặp.

## Giao diện

- Dùng header cố định, không có nút ba gạch, sidebar/footer hiện tại.
- Dùng cùng gutter và max-width của Dashboard, Tin đăng, Tạo tin.
- Tiêu đề Ứng viên, tổng số hồ sơ từ meta.totalItems, chuyển chế độ Thẻ/Danh sách.
- Thẻ ba cột desktop, hai cột tablet, một cột mobile 360px. Bảng có vùng cuộn ngang riêng.
- Tìm kiếm tên/kỹ năng/chức danh, lọc theo tin, trạng thái, kinh nghiệm, kỹ năng, sắp xếp và phân trang API.
- Thẻ có avatar hoặc chữ cái tên, họ tên, chức danh, kỹ năng nổi bật, trạng thái, vị trí ứng tuyển, mã hồ sơ, ngày nộp và Xem CV.
- Có skeleton, empty, error/retry và success. Không thêm dòng dữ liệu minh họa vào giao diện.

## API đã có trong contract

1. GET `/recruiter/applications`: danh sách, tìm kiếm, lọc, sắp xếp và phân trang.
2. GET `/recruiter/jobs`: dữ liệu bộ lọc tin đăng, dùng service hiện có.
3. GET `/recruiter/applications/{applicationId}/cv`: trả binary PDF/DOCX qua phiên cookie httpOnly, không URL CV công khai.

Client → hook TanStack Query → service → apiClient → BFF → mock/proxy, giữ cấu trúc đang có. Dữ liệu ngoài qua Zod. Bổ sung handler và fixture cho hai endpoint applications/CV; mở allowlist đúng các path này. Không sửa spec.

## Khác biệt cần giữ đúng contract

| Trong ảnh | Dữ liệu thực tế |
|---|---|
| Email dưới tên | CandidateBrief không có email, thay bằng headline hoặc thành phố, không tự thêm email |
| Lương mong muốn | Không có trong RecruiterApplicationSummary; giữ hàng hiển thị “Chưa cung cấp” thay vì tự tạo lương |
| Phòng ban | Không có field/query department; thay bộ lọc bằng kỹ năng được API hỗ trợ |
| Ngày ứng tuyển dạng bộ lọc | Không có from/to trong endpoint; dùng sắp xếp ngày nộp mới nhất/cũ nhất |
| Tìm bằng mã ứng viên | q chỉ hỗ trợ tên/kỹ năng/chức danh; placeholder hiển thị đúng phạm vi |
| Freelance/Part-time trên thẻ | Không phải trạng thái hồ sơ; dùng ApplicationStatus và nhãn tiếng Việt |
| Mã hồ sơ | Dùng application.id, rút gọn phần hiển thị, giữ nguyên ID khi gọi API |
| 1.285 ứng viên | Dùng tổng hồ sơ từ API; không hardcode số trong ảnh hoặc nhận nhầm số hồ sơ là số người duy nhất |

Không dùng tên/email trong ảnh làm dữ liệu thật. Fixture dùng tên giả và hồ sơ/CV giả. Không đưa q chứa thông tin cá nhân vào URL trình duyệt; API q giới hạn tên/kỹ năng/chức danh như contract, không gửi email/SĐT vào query.

## File dự kiến

- Sửa page có sẵn `src/app/(recruiter)/recruiter/candidates/page.tsx` để ghép feature.
- Mở rộng feature `src/features/applications/`: types từ generated schema, schemas, service, hooks, query-keys, errors, messages và component Recruiter.
- Component chính, thẻ, bảng và bộ lọc nằm trong `features/applications/components/recruiter/`, stylesheet scoped với token sẵn có.
- Sửa BFF allowlist và mock adapter, thêm kho applications riêng phía server, kiểm tra session/role/quyền sở hữu công ty.
- Mở rộng `src/mocks/fixtures/applications.ts`, thêm tài liệu CV giả được sinh từ dữ liệu giả khi trả binary.
- Gắn messages vào provider Recruiter hiện có; không đổi cấu trúc khung trang.
- Không sửa middleware, contracts, env, lockfile, components/ui; không thêm dependency.

## Kiểm tra

- Vitest cho parsing/validation query, mock phân trang/lọc/sắp xếp, kiểm quyền và CV không còn khả dụng.
- Playwright với mock cho thẻ↔danh sách, tìm/lọc/phân trang, xem CV và responsive 360px.
- Chạy typecheck + lint, báo kết quả thật.

Đã áp dụng code theo phê duyệt. Typecheck và lint đạt; 31 kiểm thử Vitest và 5 luồng Playwright chạy với mock bằng Edge headless đạt. Đã kiểm tra thẻ/bảng, tìm/lọc/phân trang, xem CV và lỗi CV, thử lại khi lỗi danh sách, chặn email/SĐT trong tìm kiếm và bố cục 360px. Luồng tạo tin cũ cũng chạy lại thành công. Không thay đổi contract, dependency hoặc các component UI được bảo vệ. Backend thật chưa có nên chưa kiểm tra tích hợp thực tế.
