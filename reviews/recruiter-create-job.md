# Tạo tin tuyển dụng
## Kết quả cần có

- Route `/recruiter/jobs/new`, thay form nhỏ đang nằm trong trang danh sách.
- Hai cột: form bên trái, xem trước và các bước bên phải; chuyển một cột ở mobile 360px.
- Các nhóm thông tin cơ bản, chi tiết, địa điểm, liên hệ, tùy chọn; có thu gọn/mở rộng.
- React Hook Form + Zod, báo lỗi cạnh trường, giữ nguyên nội dung khi API lỗi, chặn gửi trùng khi đang lưu.
- Toolbar ghi Markdown vào nội dung, không gửi HTML hoặc gọi AI sinh văn bản không có trong contract.
- Nút lưu gọi API qua service và TanStack Query. Thành công nhận ID thật từ mock BFF, chuyển đến trang chi tiết ID đó. Danh sách và chi tiết đọc cùng kho mock để không mất tin vừa tạo.
- Không thêm dòng dữ liệu minh họa/bản xem trước vào thông báo giao diện.

## Luồng dữ liệu

```text
Form (React Hook Form)
  → Zod: dữ liệu form → JobInput
  → useCreateJob (TanStack Query mutation)
  → createRecruiterJob (service)
  → apiClient (/api/bff)
  → BFF: DATA_MODE
      mock → mock-adapter + kho jobs trên globalThis
      real → proxy backend, quản lý cookie tại BFF
```

Không import fixture vào form/service. Client không đọc chế độ mock/real. Không dùng Zustand lưu tin tuyển dụng.

## Đối chiếu field

| Giao diện | Payload |
|---|---|
| Tiêu đề | title, 3–200 ký tự |
| Ngành nghề | industryId, một ngành theo contract |
| Cấp bậc | level |
| Kinh nghiệm | minExperienceYears |
| Hạn nộp | applicationDeadline |
| Lương từ/đến nhập theo triệu | salary.min/max nhân 1.000.000, số nguyên VNĐ |
| Thỏa thuận | salary.negotiable; bỏ min/max khi bật |
| Mô tả/yêu cầu/quyền lợi | description/requirements/benefits, văn bản hoặc Markdown |
| Hình thức | workType, enum của contract |
| Số lượng | headcount, số nguyên ≥ 1 |
| Tỉnh/thành, quận/huyện, địa chỉ | location.city/district/address |
| Bằng cấp/kỹ năng | educationLevel/skills |
| Liên hệ, địa chỉ phỏng vấn, không cần CV, tuổi, giới tính, thử việc | Chỉ thuộc state form/UI; không thêm vào JobInput |

Giữ bố cục giống Figma nhưng chỉ chọn một ngành và một địa điểm khi lưu, không âm thầm bỏ bớt phần tử trong mảng. Chưa triển khai nút thêm 3 ngành/5 địa điểm thành thao tác lưu backend. Các trường chưa được hỗ trợ không được đánh dấu bắt buộc để tạo JobInput. Không sao chép số điện thoại/email trong ảnh làm fixture.

## Các file sẽ thay đổi

| File | Thay đổi |
|---|---|
| src/app/(recruiter)/recruiter/jobs/new/page.tsx | Route mỏng, ghép feature |
| src/features/jobs/components/recruiter/create-job-form.tsx | Form, watch preview, trạng thái submit |
| src/features/jobs/components/recruiter/job-form-section.tsx | Nhóm thu gọn và tiêu đề |
| src/features/jobs/components/recruiter/job-editor.tsx | Textarea với các nút Markdown hoạt động |
| src/features/jobs/components/recruiter/job-create-preview.tsx | Thẻ xem trước và các bước |
| src/features/jobs/schemas/create-job.ts | Zod và chuyển đổi payload |
| src/features/jobs/services/recruiter-jobs.ts | API service và kiểm tra response |
| src/features/jobs/hooks/use-create-job.ts | Mutation và invalidate list/detail/stats |
| src/features/jobs/query-keys.ts, errors.ts, types.ts, index.ts | Factory key, lỗi tiếng Việt, kiểu generated và public exports |
| src/features/recruiter/messages.ts | Chuỗi form và thông báo tiếng Việt |
| src/features/recruiter/components/recruiter.css | Bố cục và token đang có |
| src/features/recruiter/components/recruiter-jobs.tsx | Bỏ form inline, nút Đăng tin dẫn route mới; lấy danh sách qua Query |
| src/features/recruiter/components/recruiter-dashboard.tsx | Nút Soạn tin dẫn route mới |
| src/app/(recruiter)/recruiter/jobs/page.tsx | Xử lý compose cũ và search params trong Suspense |
| src/app/(recruiter)/recruiter/jobs/[jobId]/page.tsx | Đọc chi tiết qua cùng lớp API, hỗ trợ ID vừa tạo |
| src/features/recruiter/components/recruiter-shell.tsx | Gắn QueryProvider hiện có chỉ trong vùng Recruiter |
| src/app/api/bff/[...path]/route.ts | Điều phối request thay response placeholder, chỉ mở nhóm được triển khai |
| src/server/bff/mock-adapter.ts | Dispatch các API job/catalog/company/CSRF cần cho form |
| src/server/bff/proxy.ts | Chuyển tiếp nhóm API đã triển khai ở chế độ real; cookie httpOnly ở BFF |
| src/mocks/fixtures/jobs.ts | Dữ liệu giả theo generated types, ID UUID |
| src/mocks/fixtures/recruiter-catalog.ts | Danh mục giả có UUID hợp lệ |
| src/mocks/fixtures/recruiter-company.ts | Doanh nghiệp giả, không dữ liệu cá nhân thật |
| src/lib/api/generated/schema.d.ts | Chỉ sinh bằng pnpm gen:api từ spec hiện có, không sửa tay |
| tests/unit/create-job.test.ts, tests/e2e/recruiter-create-job.spec.ts | Validation, payload, lỗi mock và luồng tạo→danh sách→chi tiết |

`src/components/ui/` hiện chỉ có Button. Cần bổ sung Input, Textarea, Select, Checkbox shadcn bằng dependency đã có. Đây là thư mục được bảo vệ, chỉ áp dụng phần này khi được duyệt rõ. Không chạy cài thư viện hoặc thay lockfile.


## Kiểm tra sau khi áp dụng

1. Vitest: title giới hạn; salary từ≤đến; triệu→VNĐ; headcount; deadline; bỏ salary min/max khi negotiable; không gửi contact hoặc UI-only field.
2. Mock integration: POST tạo tin trả 201; GET list/detail có cùng ID; dữ liệu giữ qua HMR; request không đủ quyền/CSRF bị từ chối.
3. Playwright: nhập form→preview đổi→submit→chi tiết→quay danh sách thấy tin; lỗi giữ nguyên dữ liệu; chống submit trùng.
4. Kiểm tra toolbar Markdown, mở/đóng section, tăng giảm số lượng, mobile 360px không tràn ngang.
5. Chạy typecheck và lint, báo mã thoát thật.

Kết quả sau triển khai: typecheck và lint đạt; 16 kiểm thử Vitest đạt; 2 luồng Playwright chạy với mock bằng Edge headless đạt. Đã kiểm tra tạo tin → chi tiết → danh sách, validation, nhóm thu gọn và giữ dữ liệu khi API lỗi, bố cục 360px. Generated types được sinh từ spec hiện có; contract, dependencies, lockfile và middleware giữ nguyên. Backend thật chưa có nên chưa kiểm thử tích hợp thực tế.
