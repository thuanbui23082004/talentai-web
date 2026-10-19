---
trigger: always_on
---

TalentAI — Tổng quan dự án
1. Sản phẩm

TalentAI là nền tảng tuyển dụng việc làm đa ngành, tích hợp AI để: phân tích CV, phân tích Job Description (JD), và đối sánh CV–JD (Matching Score).

Repo này là frontend web (Next.js App Router). Backend và AI service là hệ thống riêng.
FE chỉ nói chuyện với backend qua BFF tại src/app/api/bff/[...path]/route.ts.
FE không bao giờ gọi trực tiếp AI/LLM provider hay backend thật từ trình duyệt.
Nguồn sự thật về nghiệp vụ: tài liệu SRS của nhóm. Nguồn sự thật về API: contracts/openapi.yaml.

Nguyên tắc sản phẩm quan trọng nhất: AI chỉ hỗ trợ ra quyết định, không thay thế quyết định của ứng viên hay nhà tuyển dụng. Mọi màn hình hiển thị kết quả AI phải:

Gắn nhãn là "gợi ý từ AI".
Kèm giải thích (kỹ năng phù hợp, kỹ năng thiếu, lý do).
Không tự động loại/ẩn ứng viên hoặc việc làm chỉ vì điểm thấp.
2. Vai trò và vùng route
Vai trò	Giá trị Role	Route prefix	Mục đích
Khách (chưa đăng nhập)	—	/, /jobs, /login, /register	Xem danh sách và chi tiết việc làm
Ứng viên	candidate	/candidate/*	Hồ sơ, CV, tìm việc, ứng tuyển, AI, phỏng vấn
Nhà tuyển dụng	recruiter	/recruiter/*	Doanh nghiệp, tin tuyển dụng, sàng lọc, phỏng vấn, thống kê
Quản trị viên	admin	/admin/*	Người dùng, kiểm duyệt, danh mục, báo cáo, nhật ký
Khi đăng ký chỉ được chọn candidate hoặc recruiter. Không bao giờ có lựa chọn admin trên UI.
Sau đăng nhập, điều hướng tự động theo role về /candidate/dashboard, /recruiter/dashboard, /admin/dashboard.
3. Thuật ngữ và enum nghiệp vụ
CV: file PDF/DOCX do ứng viên tải lên. Một ứng viên có nhiều CV/phiên bản.
JD: mô tả công việc trong tin tuyển dụng (vị trí, mô tả, yêu cầu, kỹ năng, kinh nghiệm, lương, địa điểm, hình thức).
Matching Score: điểm phù hợp CV–JD, đơn vị %, kèm kỹ năng phù hợp/thiếu, điểm mạnh/yếu, giải thích.

Enum dự kiến (tên giá trị thật lấy từ openapi.yaml; nếu khác thì contract thắng):

Đối tượng	Giá trị
Job status	draft, pending_review, open, paused, closed (admin có thể ẩn/khóa: xác nhận trong contract)
Application status	submitted, reviewing, interview, rejected, hired, withdrawn
Interview invite	pending, accepted, declined
Interview result	passed, failed, need_more
Account status	active, locked (+ recruiter chờ kiểm duyệt doanh nghiệp)

Nhãn hiển thị bằng tiếng Việt (Đã nộp, Đang xem xét, Được mời phỏng vấn, Đã từ chối, Đã tuyển dụng...) đặt trong một file map duy nhất của feature, không rải chuỗi trong component.

4. Bản đồ feature ↔ SRS
Feature (src/features/)	Nhóm chức năng SRS	Ghi chú
auth	1. Tài khoản và xác thực	Đăng ký, đăng nhập, quên/đổi mật khẩu, session
jobs	3. Tuyển dụng, 4. Tìm kiếm	Tìm, lọc, chi tiết, lưu việc; UI recruiter nằm ở components/recruiter/
cv	2.2 Quản lý CV	Upload, xem, xóa, nhiều phiên bản, chọn CV để ứng tuyển
cv-analysis	5.1 Phân tích CV/JD bằng AI	Trích xuất, chất lượng CV, gợi ý cải thiện; hook useAnalysisStatus
matching	5.2, 5.3 Đối sánh và gợi ý việc làm	Matching Score, kỹ năng thiếu, AI gợi ý việc làm
applications	6. Ứng tuyển, 7.4	Nộp, theo dõi, rút hồ sơ; recruiter cập nhật trạng thái
recruiter	3.1, 7, thống kê	Chỉ phần đặc thù role: dashboard, thống kê, sàng lọc ứng viên
admin	Quản trị	Chỉ phần đặc thù role: kiểm duyệt, danh mục, báo cáo, nhật ký

SRS có thêm các nhóm chưa có thư mục. Đề xuất tạo khi cần (dùng workflow /new-feature, không tự tạo sớm): profile (hồ sơ cá nhân, học vấn, kinh nghiệm, kỹ năng, chứng chỉ), companies (hồ sơ doanh nghiệp), interviews (lịch, lời mời, kết quả), notifications. Chức năng chat/trao đổi giữa ứng viên và nhà tuyển dụng không có trong yêu cầu chức năng: không tự thêm.

5. Kiến trúc và hướng phụ thuộc
app  →  features  →  components, lib
server/bff  →  lib, mocks
app/ chỉ ghép trang (page/layout), không chứa logic nghiệp vụ.
features/* không import từ app/. lib/ và components/ui không import từ features/.
Mỗi feature có template cố định: components/ hooks/ services/ schemas/ types.ts index.ts.
Feature chỉ import feature khác qua @/features/<name> (file index.ts), không import sâu.
src/server/* chỉ chạy phía server, không import vào client component.
6. Quy ước chung
TypeScript strict, cấm any (dùng unknown rồi thu hẹp kiểu).
Tên file: kebab-case. Component: PascalCase. Hook: useXxx. Hằng số: UPPER_SNAKE_CASE.
Mặc định Server Component. Chỉ thêm "use client" khi cần state, effect hoặc event handler.
Chuỗi hiển thị cho người dùng: tiếng Việt. Tên biến, hàm, commit: tiếng Anh.
Commit theo Conventional Commits (feat:, fix:, chore:...).
Không thêm thư viện mới ngoài danh sách đã cài; cần thêm thì hỏi trước.
7. Định nghĩa "xong" cho một thay đổi
npm run typecheck, npm run lint, npm run test đều pass.
Có đủ trạng thái loading, empty, error cho mọi màn hình lấy dữ liệu.
Chạy được ở cả DATA_MODE=mock và DATA_MODE=real mà không sửa code FE.
Đúng quyền theo role, hiển thị tốt ở 375px và 1280px.
8. Ngoài phạm vi (không tự làm)

Thanh toán, chat thời gian thực, app mobile native, huấn luyện hay gọi mô hình AI trực tiếp từ FE.