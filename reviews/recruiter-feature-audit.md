# Đối chiếu giao diện nhà tuyển dụng

Rà soát lại theo 8 nhóm chức năng đã gửi. Phạm vi: route, component, ánh xạ form, API client, BFF mock và OpenAPI trong checkout hiện tại. Báo cáo đã cập nhật sau khi hoàn thiện ba phần quản lý tin được người dùng yêu cầu. Đăng nhập/đăng ký do đồng đội phụ trách, không làm lại.

## Kết luận

Ba phần còn thiếu về tin tuyển dụng đã được hoàn thiện: trạng thái tin lưu qua API/mock; form chỉ hiển thị các ô có hợp đồng lưu dữ liệu; tạo/sửa tin có cấu hình các vòng tuyển dụng. Phần xác thực do đồng đội đã làm theo xác nhận của người dùng, nằm ngoài phạm vi sửa đổi này. Backend thật vẫn chưa được tích hợp.

## Các trang hiện có

- `/recruiter/dashboard`: tổng quan, bộ lọc, biểu đồ, funnel, lịch và hồ sơ gần đây.

Dashboard đã được cân chỉnh lại theo ảnh Figma: bốn thẻ số liệu, biểu đồ đường/vùng tím, ba thẻ vị trí đang tuyển và bảng ứng viên ở cột chính; lịch và thẻ bắt đầu tuyển dụng ở cột phải. Bộ lọc mở từ biểu đồ; các số liệu bổ sung, funnel và bảng dữ liệu đặt trong phần thống kê chi tiết thu gọn. Dữ liệu vẫn qua API/mock, không phục hồi các con số hoặc tỷ lệ tăng/giảm cố định trong ảnh mẫu.
- `/recruiter/jobs`: danh sách tin.
- `/recruiter/jobs/new`: tạo và lưu bản nháp.
- `/recruiter/jobs/[jobId]`: chi tiết, xóa/đăng bản nháp, sàng lọc/xếp hạng/đề xuất.
- `/recruiter/jobs/[jobId]/edit`: sửa tin bằng form chung và PUT.
- `/recruiter/candidates`: danh sách/thẻ, tìm kiếm, lọc tin/trạng thái/kỹ năng/kinh nghiệm/học vấn, xem/tải CV.
- `/recruiter/candidates/[applicationId]`: hồ sơ, CV, đối sánh AI, kỹ năng khớp/thiếu, đánh giá, trạng thái/vòng, lịch sử, tạo lịch và kết quả phỏng vấn.
- `/recruiter/candidates/pipeline`: bảng tiến trình và chuyển giai đoạn.
- `/recruiter/interviews`: danh sách, bộ lọc, phân trang và lịch tháng.
- `/recruiter/interviews/[interviewId]`: sửa lịch, gửi lại lời mời, hủy có lý do, nhập/chỉnh sửa kết quả.
- `/recruiter/account`: cập nhật liên hệ, avatar, đổi mật khẩu.
- `/recruiter/company`: cập nhật thông tin, địa chỉ, lĩnh vực, giới thiệu, website, logo và hồ sơ xác thực.
- `/recruiter/services`: danh mục sáu công cụ tuyển dụng, liên kết đến các luồng đang có và FAQ.
- `/recruiter/pricing`: gói mẫu, kỳ tháng/năm, so sánh, xem quyền lợi và giá tạm tính theo ưu đãi.
- `/recruiter/promotions`: chương trình mẫu, lọc nhóm, điều kiện, sao chép mã và chuyển đến bảng giá với mã đã chọn.

## Đối chiếu chức năng

| Nhóm | Hiện trạng | Điểm còn thiếu |
|---|---|---|
| Tài khoản | Có cập nhật tài khoản, avatar và đổi mật khẩu qua API/mock. Xác thực do đồng đội đã làm theo xác nhận của người dùng. | Không sửa hoặc triển khai lại phần xác thực. |
| Doanh nghiệp | Có cập nhật thông tin, logo, địa chỉ, lĩnh vực và giới thiệu. | Không thấy thiếu màn hình bắt buộc theo danh sách chức năng được gửi. |
| Tin tuyển dụng | Có tạo nháp, sửa PUT, xóa mềm DELETE, đăng nháp POST publish, pause/reopen/close qua API/mock; cấu hình hiringRounds khi tạo/sửa. Các ô hiển thị trong form đều thuộc dữ liệu lưu được. | Những trường Figma chưa có trong JobInput đã bỏ khỏi form; không tự mở rộng API. |
| Ứng viên | Có danh sách/hồ sơ, tìm tên/kỹ năng/chức danh, xem/tải CV, lọc kỹ năng/kinh nghiệm/học vấn và trang chi tiết. | Không thấy thiếu màn hình bắt buộc trong phạm vi quản lý hồ sơ ứng tuyển hiện có. Không đồng nhất với một kho tìm CV bên ngoài hệ thống. |
| AI sàng lọc | Có chạy hàng loạt/theo hồ sơ, tiến độ, lỗi/thử lại, Matching Score, explanation, kỹ năng khớp/thiếu, xếp hạng và đề xuất theo tin. | Polling theo OpenAPI; chưa có SSE endpoint. AI hiện chạy mock, không phải dịch vụ AI thật. |
| Quá trình tuyển dụng | Có pipeline, đổi trạng thái/vòng, lịch sử, đánh giá và kết quả phỏng vấn. Vòng của tin được cấu hình trong form tạo/sửa. | Chỉnh cấu hình vòng không tự chuyển trạng thái/vòng của ứng viên. |
| Phỏng vấn | Có tạo/gửi lịch, danh sách/lịch tháng, chi tiết, sửa thời gian/hình thức/địa điểm, gửi lại, hủy và nhập/chỉnh sửa kết quả. | Mock chỉ cập nhật dữ liệu/trạng thái; chưa gửi email thật. |
| Thống kê | Có overview/funnel/timeseries, lọc ngày/tin, chỉ số/nhóm thời gian, số hồ sơ đã đến vòng và tỷ lệ so với vòng trước. | Chưa nối backend thật; mock tổng hợp từ store chung. |

## Ba phần đã hoàn thiện

### Trạng thái tin tuyển dụng

- Chi tiết tin dùng mutation gọi POST pause/reopen/close trong OpenAPI; không đổi local state thay cho lưu.
- Mock lưu trạng thái và updatedAt; kiểm tra quyền, CSRF và trạng thái nguồn. Tạm dừng từ open; mở lại từ paused/closed; đóng từ open/paused theo luồng nút hiện có.
- Có xác nhận, trạng thái đang lưu, lỗi/thử lại và thông báo thành công. Cập nhật cache chi tiết, danh sách và thống kê; tải lại giữ đúng trạng thái.

### Form tạo và sửa tin

- Giữ các trường có ánh xạ JobInput: thông tin tin, JD/yêu cầu/quyền lợi, loại công việc, lương, kinh nghiệm, hạn nộp, số lượng, địa điểm, học vấn, kỹ năng và vòng tuyển dụng.
- Bỏ các ô chưa có field trong JobInput: liên hệ riêng của tin, số điện thoại bổ sung, địa chỉ phỏng vấn, thử việc, giới tính, độ tuổi, tùy chọn không cần CV. Không đưa ghi chú kỹ thuật hoặc dữ liệu minh họa vào giao diện.
- Thanh bước điền tin chỉ liên kết đến các phần thực sự có trên form. Không sửa hợp đồng API hay phần xác thực.

### Vòng tuyển dụng

- Form tạo/sửa có thêm, đổi tên, xóa và sắp xếp các vòng; gửi hiringRounds dưới dạng danh sách tên theo đúng thứ tự.
- Kiểm tra tên rỗng và trùng tên; nạp lại đúng dữ liệu khi sửa, hỗ trợ xóa hết các vòng.
- Dữ liệu vòng được dùng chung khi cập nhật vòng của ứng viên và xem funnel thống kê. Không tự thay đổi trạng thái của ứng viên.

## Ngoài danh sách chức năng đã gửi

Người dùng đã yêu cầu bổ sung Dịch vụ, Bảng giá và Khuyến mãi, đồng thời duyệt dùng dữ liệu mẫu để đề xuất giao diện. Ba trang đã có liên kết từ sidebar/header/footer và thanh điều hướng dùng được trên điện thoại.

OpenAPI hiện chưa có nghiệp vụ gói dịch vụ/khuyến mãi/thanh toán. Các gói, hạn mức, giá và mã ưu đãi trong `src/mocks/fixtures/recruiter-services.ts` là mô hình giao diện được đề xuất; không phải API mới hoặc thuê bao đã kích hoạt. Trang cho xem quyền lợi, giá tạm tính, điều kiện, sao chép mã và mở công cụ hiện có; không giả lập mua thành công, trừ tiền hoặc áp hạn mức vào tài khoản. Cần chốt nghiệp vụ và duyệt hợp đồng trước khi nối mua gói/thanh toán.

Trợ giúp ở header và Hỗ trợ ở sidebar cùng mở `/recruiter/help`: tìm kiếm tiếng Việt có/không dấu, lọc chủ đề, mở câu trả lời và đi đến chức năng tương ứng. Có liên kết trợ giúp ở footer cho điện thoại. Nội dung bao gồm tin tuyển dụng, hồ sơ/CV, AI, vòng tuyển dụng, lịch/kết quả phỏng vấn, thống kê, tài khoản, doanh nghiệp và dịch vụ. OpenAPI chưa có API ticket nên chưa có luồng gửi yêu cầu hỗ trợ; không giả lập gửi thành công. Một số mục chính sách vẫn chưa có luồng riêng. Ảnh bìa, 2FA, chat và kho CV bên ngoài không được coi là yêu cầu bắt buộc nếu chưa chốt phạm vi.

## Xác minh lần này

- `pnpm typecheck`: đạt.
- `pnpm lint`: đạt.
- `pnpm test`: 12 file, 84 test đạt.
- Kiểm tra trình duyệt cho tạo/sửa tin, trạng thái tin, đăng/xóa, lỗi/thử lại và cấu hình vòng; có kiểm tra màn hình 360px. Không coi đây là kiểm thử tích hợp backend thật.

## Tìm kiếm trên header và viền focus

- Ô tìm kiếm header nhận từ khóa, nhấn Enter hoặc biểu tượng tìm kiếm để xem hai nhóm kết quả ứng viên/tin tuyển dụng và mở chi tiết. Dùng các API/hook hiện có, có tải dữ liệu, rỗng, lỗi và thử lại; không thêm hợp đồng API.
- Kiểm tra từ khóa qua schema hiện có để chặn email/số điện thoại; không đưa từ khóa vào URL trang, localStorage hoặc log. Kết quả mỗi nhóm giới hạn 5; nhóm tin tìm trong danh sách hiện được API trả về (tối đa 100 tin theo luồng danh sách hiện tại).
- Chuyển viền focus từ input sang cả cụm tìm kiếm bo góc; giữ chỉ báo focus cho thao tác bàn phím. Không sửa component shadcn sinh sẵn hay phần xác thực.
## Định dạng và cân đối bố cục nhà tuyển dụng

- Áp dụng Inter bằng next/font riêng trong layout recruiter; nội dung 14px, tiêu đề trang 20px, tiêu đề phần 16–18px và token màu chữ theo 10-frontend.md.
- Tiêu đề danh sách ứng viên, phỏng vấn, tin đăng, tạo tin và bảng theo dõi thống nhất vị trí và khoảng cách 24px tới nội dung; chiều cao khối tiêu đề theo nội dung, tối thiểu 40px.
- Lịch Dashboard dùng T2–T7/CN và hai hàng có chiều cao cố định, giữ bảy số ngày trên cùng đường ngang. Tăng cột lịch để giữ đủ khoảng trống; chuyển bố cục ở màn hình hẹp.
- Hồ sơ ứng viên tăng độ rộng cột bên, thống nhất padding/gap, căn các nhãn điểm/kinh nghiệm, phân bố lại nút và các phần đối sánh; dùng 3/2/1 cột theo chiều rộng màn hình.
- Playwright: kiểm tra tiêu đề năm trang chính, 10 trang ở 375/1024/1920px, các trang chi tiết ứng viên/tin/phỏng vấn ở 375/1440px và bảy cột lịch thẳng hàng. Bốn bài kiểm tra đã đạt sau các lần chỉnh; dữ liệu phỏng vấn được tạo trong mock riêng cho bài kiểm tra.
- Không sửa API, xác thực, file shadcn hay các trang của vai trò khác.
## Kéo thẻ trên bảng theo dõi và cố định thông tin hồ sơ

- Dùng @dnd-kit/core đã có trong dự án thay cho HTML drag trên nút nhỏ: kéo từ phần trống của thẻ hoặc tay nắm, có hình thẻ nổi, cột đích nổi bật, tự cuộn và hỗ trợ bàn phím/cảm ứng. Liên kết, nút và bộ lọc giữ thao tác riêng.
- Thả giữa các giai đoạn thông thường lưu qua API cập nhật trạng thái hiện có và đồng bộ các màn hình. Thả sang tuyển dụng/từ chối vẫn phải xác nhận quyết định; không tự loại ứng viên. Lưu lỗi giữ thẻ ở cột cũ, có Thử lại.
- Các cột có cùng chiều cao, độ rộng tối thiểu phù hợp chữ 14px, cuộn hồ sơ độc lập; bảng cuộn ngang bên trong trên màn hình hẹp. Không bổ sung API sắp xếp vị trí thẻ trong cùng cột.
- Cột thông tin cá nhân ở chi tiết ứng viên sticky dưới header khi màn hình rộng, có vùng cuộn riêng nếu dài. Dưới 901px trở về luồng trang bình thường để nội dung không bị che.
- Xác minh: 6 bài Playwright đạt qua các lượt chạy, gồm kéo lưu/đồng bộ, lỗi và thử lại, xác nhận quyết định, phân trang, lỗi tải, mobile và vị trí cột thông tin khi cuộn; 12 file/84 test unit đạt.
- Không sửa contracts, xác thực, component shadcn hay thêm thư viện.
## Cân đối bộ lọc phỏng vấn

- Nhóm bộ lọc có tiêu đề và nút xóa riêng; trạng thái, lời mời, từ ngày và đến ngày đều có nhãn và nằm trong bốn cột bằng nhau, ô nhập cao 40px.
- Chế độ lịch đặt điều hướng tháng trong cùng nhóm bộ lọc; tháng chiếm hai cột, giữ các điều khiển thẳng hàng. Thông báo lịch trống chuyển thành dòng tóm tắt thay vì thêm khung trắng lớn trước lịch.
- Ở màn hình hẹp, nhóm tự chuyển hai/một cột, giữ đầy đủ thao tác chọn ngày, tháng và xóa lọc. Không đổi API hay luồng quản lý phỏng vấn.
- Hai bài Playwright bộ lọc đạt, gồm đo vị trí/kích thước, chọn ngày/tháng, xóa lọc và 360/375/768/1024px. Bài cũ kiểm tra lỗi tải/thử lại/lọc rỗng đạt; bài cũ tạo và quản lý lịch không hoàn thành vì dữ liệu mock sẵn có trùng thời gian trả 409 khi tạo, chưa chạy đến phần giao diện.
## Cân đối trang tạo và chỉnh sửa tin

- Khối tiêu đề chung tối thiểu 40px thay vì 60px: giảm khoảng trống trên các trang có tiêu đề một dòng, vẫn giữ vị trí và khoảng cách 24px, tiêu đề có mô tả tự tăng chiều cao.
- Form tin dùng cột xem trước 360px thay cho 285px, khoảng cách hai cột 24px; tăng khoảng đệm và khả năng xuống dòng cho nội dung xem trước, đồng nhất các bước điền tin.
- Màn hình dưới 1101px chuyển các khối xem trước/hướng dẫn lên hàng riêng; điện thoại dùng một cột. Áp dụng chung tạo và sửa, không đổi validation, dữ liệu hay API.
- Ba bài Playwright đạt: tỷ lệ hai cột, căn đầu cột/khoảng trống tiêu đề, xem trước cập nhật, tạo/sửa và kích thước 360/375/768/1024/1280/1440px; kiểm tra vị trí/cỡ chữ tiêu đề của năm trang chính đạt.
## Cột thông tin chi tiết tin tuyển dụng

- Cột thông tin bên phải rộng 360px, khoảng cách 24px giống trang tạo/sửa; khối thông tin padding 24px. Tiêu đề Thông tin tin đăng giữ nguyên một dòng, nhãn trạng thái tự xuống hàng khi không đủ chỗ.
- Dưới 1101px chuyển thành một cột; thông tin chia hai cột ở tablet và một cột trên điện thoại. Không thu nhỏ chữ hoặc đổi API.
- Một bài Playwright đạt: kích thước/vị trí cột, tiêu đề một dòng và không cuộn ngang ở 360/375/768/1024/1280/1440px.
## Đơn giản hóa phần địa điểm làm việc

- Bỏ khung nền và tiêu đề Địa điểm làm việc 1 lặp bên trong, giữ một tiêu đề phần; tỉnh/thành và quận/huyện chia hai cột bằng nhau, địa chỉ chiếm hàng đầy đủ.
- Nhãn địa chỉ rút gọn, gợi ý số nhà/đường/phường chuyển vào placeholder; bổ sung placeholder quận/huyện. Dùng chung cho tạo và sửa, giữ nguyên field, dữ liệu, validation và API.
- Một bài Playwright đạt trên cả hai trang: nhãn bắt buộc, căn hai ô đầu, ô địa chỉ toàn chiều rộng, giữ dữ liệu nhập và bố cục một cột 375px; có ảnh desktop/mobile.
## Tìm/chọn tỉnh và thành phố

- Bổ sung danh mục mock 34 tỉnh/thành theo Nghị quyết 202/2025/QH15, giữ nguyên ID/tên của ba địa điểm cũ. Tham chiếu: https://baochinhphu.vn/nghi-quyet-cua-quoc-hoi-ve-sap-xep-don-vi-hanh-chinh-cap-tinh-102250612191145158.htm
- Dùng combobox của Base UI đã có trong dự án cùng Input/Button hiện có, không thêm thư viện hoặc sửa file shadcn. Form tạo/sửa và bộ lọc tin đăng dùng chung danh mục locations qua API hiện có; bỏ ba địa điểm ghi cố định ở bộ lọc.
- Bấm chọn hoặc gõ tên có/không dấu, dùng phím mũi tên/Enter/Escape; chữ tìm chỉ là state UI, giá trị đã chọn mới cập nhật form/bộ lọc. Đóng mà không chọn sẽ giữ giá trị cũ. Giữ địa điểm đã lưu nếu danh mục backend thay đổi.
- Có tải dữ liệu, không có kết quả, lỗi và thử lại; popup dùng cùng token/font, phù hợp điện thoại. Mock catalog xử lý q và phân trang đúng hợp đồng hiện có, không sửa contracts.
- Xác minh: hai unit test tìm tên và tính đầy đủ/không trùng ID của danh mục đạt; bốn bài Playwright đạt, gồm API catalog/q, tìm không dấu/bàn phím, bộ lọc, xóa chọn, lỗi/thử lại, sửa tin, mobile và căn ô địa điểm với quận/huyện.
## Căn lại khoảng lương trên form tin

- Cấp bậc, kinh nghiệm và hạn nộp nằm trên cùng một hàng ba cột; màn hình nhỏ chuyển thành một cột.
- Khoảng lương là một nhóm riêng có legend đúng đơn vị hiện có; Từ/Đến chia hai cột bằng nhau, ô cao 40px. Thỏa thuận ở hàng bên dưới thay vì chen vào cạnh hai ô số. Không đổi giá trị, đơn vị, validation hoặc API.
- Hai bài Playwright đạt: cân hai ô/từng hàng trên tạo và sửa, bật Thỏa thuận vô hiệu hóa hai ô, bỏ chọn giữ nguyên số tiền, cập nhật xem trước và không tràn ngang trên điện thoại/máy tính bảng.