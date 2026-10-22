# Bảng theo dõi ứng viên — đã triển khai theo kế hoạch được duyệt

## Phạm vi

- Thêm route `/recruiter/candidates/pipeline`, đặt mã trong feature applications đang có.
- Thêm nút “Bảng theo dõi” tại danh sách ứng viên và nút trở lại danh sách trên bảng.
- Dùng shell Recruiter hiện tại: header/sidebar cố định, không hamburger, cùng khoảng cách và footer.
- Bố cục năm cột theo ảnh: Đã ứng tuyển (submitted), Đang xét duyệt (reviewing), Phỏng vấn (interview), Đã tuyển dụng (hired), Từ chối (rejected).
- Hồ sơ withdrawn hiển thị riêng dưới bảng, chỉ đọc; không mất hồ sơ và không kéo sang trạng thái khác.

## Dữ liệu và API

- Tái sử dụng GET `/recruiter/applications` với bộ lọc status và phân trang riêng từng cột. Số lượng dùng meta.totalItems, có “Tải thêm” khi còn dữ liệu; không giả định trang đầu là toàn bộ hồ sơ.
- Tái sử dụng PATCH `/recruiter/applications/{applicationId}/status` và mock store đang dùng. Sau cập nhật, làm mới query của bảng, danh sách và chi tiết.
- Không sửa contracts, middleware, env, lockfile, component shadcn; không thêm dependency.
- Không tạo nguồn fixture mới. Tên, chức danh, ngày nộp, điểm lấy từ hồ sơ đã có; không hardcode số lượng từ Figma.
- Response danh sách không có email hoặc số lượng bình luận/tệp: không bịa các trường này, không tải từng chi tiết chỉ để lấy email.
- Điểm AI nếu hiển thị phải đọc explanation từ API chi tiết khi người dùng mở phần giải thích, có trạng thái tải/lỗi và dòng bắt buộc “chỉ mang tính tham khảo”; không hiển thị điểm không có dữ liệu. Không tạo tác vụ AI mới.

## Tương tác

- Nhấn tên hoặc “Xem chi tiết” để mở trang chi tiết đã có.
- Kéo thả thẻ sang cột để đề nghị đổi trạng thái; có lựa chọn “Chuyển giai đoạn” dùng được bằng bàn phím và cảm ứng.
- Chuyển vào Đã tuyển dụng/Từ chối luôn yêu cầu xác nhận của nhà tuyển dụng trước khi gọi API; AI không tự quyết định.
- Không di chuyển giả khi lưu thất bại: giữ thẻ tại cột cũ, hiển thị thông báo tiếng Việt và cho thử lại. Khóa thao tác lặp khi đang lưu.
- Dấu cộng tại cột dùng để chọn hồ sơ đã có và chuyển sang cột đó; không tạo hồ sơ ứng tuyển thủ công vì chưa có API tương ứng. Tái sử dụng API danh sách để tìm tên/chức danh, xác nhận quyết định cuối như kéo thả.
- Responsive từ 360px: cuộn ngang bên trong bảng, header/sidebar vẫn cố định; không làm toàn trang tràn ngang.
- Có loading skeleton, cột rỗng, lỗi/thử lại, thành công. Chữ qua next-intl, màu qua token hiện có; forms qua RHF + Zod khi cần nhập dữ liệu.

## Kiểm tra

- Vitest cho ánh xạ trạng thái và quy tắc chuyển giai đoạn.
- Playwright mock cho mở bảng/chi tiết, chuyển thẻ và đồng bộ danh sách, xác nhận tuyển/từ chối, lỗi API, tải thêm và mobile.
- Chạy `pnpm typecheck` và `pnpm lint`, báo kết quả thật.

## Kết quả

- Route: `/recruiter/candidates/pipeline`. Mở bằng nút “Bảng theo dõi” ở trang danh sách ứng viên.
- Đã triển khai năm cột có tổng số hồ sơ từ API và tải thêm riêng; khu vực hồ sơ đã rút chỉ đọc bên dưới.
- Kéo bằng biểu tượng tay nắm trên thẻ, hoặc chọn “Chuyển giai đoạn”. Dấu cộng mở bộ chọn hồ sơ có tìm kiếm và phân trang. Mọi thao tác mở panel để người dùng xem lại; tuyển dụng/từ chối cần đánh dấu xác nhận trước khi lưu.
- Mutation dùng lại API cập nhật trạng thái, làm mới Query của bảng/danh sách/chi tiết và cập nhật cache chi tiết. Lỗi lưu giữ nguyên thẻ và thông tin đã chọn để thử lại.
- Dữ liệu không có email hoặc số bình luận/tệp không được tự thêm. Điểm AI đọc từ dữ liệu hiện có, giải thích tải khi mở; có lời nhắc bắt buộc về tính tham khảo.
- Header/sidebar dùng lại shell hiện có. Đã kiểm tra ảnh desktop và mobile 360px; bảng cuộn ngang trong vùng riêng, không tràn ngang toàn trang.
- `pnpm typecheck`: đạt. `pnpm lint`: đạt. Vitest: 43/43 đạt. Playwright: cả 4 kịch bản pipeline đạt (luồng xác nhận/lỗi API được chạy lại sau khi giới hạn locator vào panel để tránh trùng route announcer).
- Chỉ xác minh với API mock. Không sửa hợp đồng, middleware, env, lockfile, file sinh tự động hoặc component shadcn; không thêm dependency.


