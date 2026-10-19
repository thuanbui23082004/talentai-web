---
trigger: glob
globs: src/**/*.{ts,tsx}
---


# Quy ước Frontend (áp dụng cho file .ts/.tsx trong src/)

Các con số dưới đây lấy từ yêu cầu phi chức năng của SRS. Đừng tự đổi.

## 1. Giao diện và định dạng dữ liệu

- Font **Inter** (nạp bằng `next/font`, có fallback `system-ui, sans-serif`).
- Nội dung chính cỡ 14 (SRS ghi 14pt, dùng 14px = `text-sm`). Tiêu đề in đậm, cỡ 16–20.
- Màu chữ `#1A1A1A` (hoặc `#000000`) trên nền `#FFFFFF`. Màu khai báo thành token (CSS variables), không hard-code trong component.
- Tiền: dấu phân cách hàng nghìn, ví dụ `10,000,000 VNĐ`. Chỉ dùng helper `formatVND()` trong `lib/utils.ts`, không format tay.
- Khoảng lương, ngày giờ, phần trăm cũng đi qua helper chung để thống nhất.
- SRS định nghĩa nền trắng. Dark mode chỉ làm khi nhóm xác nhận; nếu làm thì phải đạt độ tương phản WCAG AA.

## 2. Responsive và trình duyệt

- Thiết kế mobile-first. Hỗ trợ từ **375px** (di động) đến **1920px** (máy tính, trọng tâm 1024–1920).
- Bảng dữ liệu rộng: đặt trong container `overflow-x-auto` hoặc đổi thành danh sách thẻ trên mobile. Không để trang cuộn ngang.
- Phải chạy đủ tính năng trên Chrome/Edge/Firefox 110+ và Safari 16+. Trước khi dùng CSS/JS API mới, kiểm tra tương thích Safari 16 và Chrome 110.

## 3. Luồng người dùng và form

- Ba luồng chính **không quá 3 lần click**: Đăng ký tài khoản, Tìm kiếm việc làm, Nộp hồ sơ ứng tuyển.
  Ví dụ nộp hồ sơ: Chi tiết việc làm → "Ứng tuyển" → chọn CV và xác nhận. Làm bằng dialog/drawer tại chỗ, không chuyển nhiều trang.
- Mọi form có schema `zod` trong `features/*/schemas/`, dùng chung cho validate phía client.
- **Inline validation thời gian thực dưới 200 ms**: validate phía client khi `onChange`/`onBlur`, không gọi mạng cho kiểm tra cú pháp.
- Khi sai: viền đỏ ở đúng trường, thông báo nằm dưới trường, nói rõ lỗi gì và cách sửa
  (ví dụ "Mật khẩu cần tối thiểu 8 ký tự, gồm chữ hoa và số"), không thông báo chung chung.
- Lỗi từ server theo trường (ví dụ email đã tồn tại) cũng hiển thị dưới đúng trường đó.
- Form đăng ký: họ tên, email, mật khẩu, nhập lại mật khẩu, chọn loại tài khoản (Ứng viên / Nhà tuyển dụng).

## 4. Trạng thái màn hình

Mọi màn hình lấy dữ liệu phải có: loading (skeleton), empty, error, và nút thử lại.
Dùng đúng thông điệp trong SRS khi có:
- Không có kết quả tìm việc: gợi ý nới rộng tiêu chí.
- "Chưa có ứng viên ứng tuyển", "Không tìm thấy ứng viên phù hợp".
- Tin đã đóng: thông báo vị trí không còn nhận hồ sơ và vô hiệu hóa nút ứng tuyển.
- Đã ứng tuyển rồi: thông báo, không cho nộp trùng.
- Không hiển thị lỗi thô, stack trace, câu SQL hay mã lỗi kỹ thuật cho người dùng.

## 5. Tìm kiếm và lọc việc làm

- Tiêu chí: từ khóa, ngành nghề, vị trí, công ty, địa điểm, mức lương, kinh nghiệm, cấp bậc, hình thức làm việc. Có sắp xếp và phân trang.
- Lưu bộ lọc trong URL `searchParams` để chia sẻ link và nút Back hoạt động.
- Debounce ô từ khóa khoảng 300 ms. Giữ dữ liệu cũ khi đang tải trang kế (`placeholderData`).
- Mục tiêu hiệu năng: tải xong kết quả dưới 2 giây ở tải thường, dưới 3 giây ở tải đỉnh.
- Trang công khai (danh sách, chi tiết việc làm) dùng Server Component, có `generateMetadata` cho SEO.

## 6. Giao diện AI (cv-analysis, matching)

- Các tác vụ AI chạy **bất đồng bộ**: gọi khởi tạo (phản hồi dưới 500 ms, trả `taskId`), sau đó polling bằng
  `useAnalysisStatus` cho đến trạng thái kết thúc. Mục tiêu có kết quả dưới 5 giây. Có timeout phía client; hết thời gian thì báo lỗi và cho thử lại.
- Trong lúc chờ: hiển thị tiến trình rõ ràng, không khóa toàn trang.
- Lỗi AI: dùng thông điệp "Không thể thực hiện phân tích, vui lòng thử lại".
  CV không đọc được: yêu cầu chọn CV khác. JD thiếu thông tin: báo không thể đối sánh chính xác.
- Component kết quả đối sánh phải hiển thị đủ: Matching Score (%), kỹ năng phù hợp, kỹ năng còn thiếu,
  điểm mạnh/yếu, giải thích lý do, đề xuất kỹ năng nên bổ sung.
- Nhà tuyển dụng thấy bảng xếp hạng theo điểm nhưng vẫn xem được toàn bộ ứng viên. Không ẩn/loại tự động.
- Luôn kèm nhãn "Gợi ý từ AI". Không dùng màu hay từ ngữ ngụ ý "đạt/không đạt" cho điểm số.
- Chỉ cho chạy đối sánh khi đã chọn đủ CV và JD; thiếu thì yêu cầu chọn trước khi gọi API.

## 7. CV và tải file

- Chỉ chấp nhận PDF và DOCX. Kiểm tra đuôi file và MIME ở client để báo lỗi sớm (backend vẫn là nơi quyết định).
- Giới hạn dung lượng lấy từ contract (nếu chưa có, ghi TODO, tạm 5 MB).
- Hiển thị tên file, trạng thái tải lên và nút hủy. Hỗ trợ nhiều CV/phiên bản và đánh dấu CV dùng khi ứng tuyển.
- Upload lớn đi theo cơ chế trong contract (multipart hoặc presigned URL); không nhồi file vào JSON.

## 8. Data fetching

- Component và hook gọi `services/`, không `fetch` trực tiếp (xem `20-data-mode.md`).
- TanStack Query: mỗi feature có file `query-keys.ts` dạng factory (`jobKeys.list(filters)`), không viết key tay rải rác.
- Mutation thành công phải `invalidateQueries` đúng key và hiển thị thông báo kết quả.
- Dữ liệu chỉ để hiển thị lần đầu và cần SEO: lấy ở Server Component. Dữ liệu tương tác: dùng Query ở Client Component.

## 9. Phân quyền trên UI

- Ẩn menu và nút theo role bằng helper trong `lib/auth/roles.ts`. Việc này chỉ là tiện ích hiển thị, **không phải** bảo mật (xem `30-security.md`).
- Layout của `/candidate`, `/recruiter`, `/admin` phải kiểm tra role phía server.
- Nhà tuyển dụng đang chờ kiểm duyệt doanh nghiệp: hiển thị trạng thái "chờ kiểm duyệt" và chặn hành động chưa được phép.

## 10. Quyền riêng tư trên UI

Trang cài đặt tài khoản cần có: **xuất dữ liệu cá nhân** (PDF/JSON) và **xóa vĩnh viễn tài khoản và CV**
(có bước xác nhận rõ ràng, nhắc hành động không thể hoàn tác).

## 11. Khả năng truy cập (a11y)

- Dùng thẻ ngữ nghĩa (`button`, `nav`, `main`, `label`). Mọi input có `label` gắn đúng `htmlFor`.
- Thông báo lỗi dùng `aria-live`/`role="alert"`. Trạng thái lỗi không chỉ dựa vào màu đỏ (kèm icon hoặc chữ).
- Điều hướng được bằng bàn phím, có focus ring nhìn thấy, dialog bẫy focus. Ảnh có `alt`.

## 12. Kiểm thử

- Unit test (vitest) cho schemas, helper định dạng, hook và service logic. Mục tiêu **độ phủ tối thiểu 70%**
  cho module lõi: `auth`, `jobs`, `cv`, `matching`, `applications`.
- E2E (playwright) cho 3 luồng: đăng ký → đăng nhập, tìm việc → ứng tuyển, nhà tuyển dụng sàng lọc ứng viên. Chạy với `DATA_MODE=mock`.
- ESLint không còn lỗi. Không dùng `// eslint-disable` nếu chưa nêu lý do trong comment.