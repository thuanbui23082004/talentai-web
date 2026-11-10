# Sửa icon tìm kiếm và thông báo dữ liệu minh họa

- Phạm vi: các trang admin, theo ảnh tài khoản/danh mục và yêu cầu rà soát các trang liên quan.
- Nguyên nhân: Input dùng chung đã tự tạo icon tìm kiếm, nhưng tài khoản/doanh nghiệp/tin/đối soát/nhật ký còn thêm Search bên ngoài. CSS `.admin-search-input svg` đặt vị trí cho cả icon bên trong Input, khiến icon trùng và lệch xuống.
- Gỡ icon và wrapper thủ công ở 5 trang, xóa 3 quy tắc CSS cũ; tất cả ô tìm kiếm admin dùng nguyên Input chung. Không sửa component UI chung hoặc giao diện recruiter/candidate.
- Gỡ banner minh họa khỏi danh mục, danh sách và chi tiết báo cáo. Bỏ các cụm “giả lập” khỏi thông báo thao tác; thông báo thanh toán chưa sẵn sàng vẫn giữ trạng thái không khả dụng. Không đổi mock/backend hay quyền thao tác.
- Playwright đạt: 10 trang chính ở 1280px/375px và 5 trang chi tiết. Xác nhận mỗi ô search có 1 SVG, tâm icon lệch tâm ô nhập tối đa 2px, icon nằm trong ô và trang không cuộn ngang. Kiểm tra không còn thông báo minh họa/mô phỏng/giả lập trên nội dung các trang được mở.
- Đã xem ảnh tài khoản/danh mục desktop; ảnh được chụp lúc loading nhưng ô tìm kiếm và phần banner đã hiển thị đầy đủ để kiểm tra lỗi này.
- Lint các file TS/TSX thay đổi đạt, git diff --check đạt. Đã chạy typecheck/lint toàn repo: vẫn thất bại vì lỗi cũ (ApiError, import feature sâu, fixture/kiểm thử recruiter và cấu hình Playwright pipeline); lint toàn repo có 65 lỗi và 1 warning. Không tuyên bố toàn repo pass.

## Bổ sung sau ảnh icon dư bên ngoài ô

- Mã trang hiện tại đã không còn Search thủ công; thêm quy tắc CSS chỉ cho phép `.lucide-search` hiển thị khi nằm trong `.ui-input-wrap` của vùng tìm kiếm admin. Quy tắc cũng xử lý icon cũ bên ngoài wrapper nếu còn trên DOM khi hot reload.
- Kiểm thử trước chỉ đếm SVG trong Input nên chưa bao quát icon bên ngoài. Bổ sung kiểm tra một SVG hiển thị trong toàn label, chèn icon ngoài ô để xác nhận bị ẩn và vẫn giữ icon trong ô căn giữa. Chỉ kiểm tra trang/input đang hiển thị để tránh các trang giữ lại trong cache điều hướng của Next.js.
- Đã chạy lại typecheck/lint toàn repo; vẫn là các lỗi nền nêu trên. Lint kiểm thử sửa đổi đạt.
- Kiểm thử trình duyệt sau bổ sung đạt: 10 trang chính, 5 trang chi tiết, desktop/mobile; cả tình huống icon ngoài ô được chèn thêm cũng chỉ còn một icon hiển thị trong vùng tìm kiếm.

## Cân chỉnh khoảng cách và cột thao tác

- Khoảng cách giữa các khối nội dung admin thống nhất 20px. Tab con thẳng mép nội dung, cao 48px; tab điều hướng nhóm bên ngoài giữ nguyên. Dòng mô tả rỗng không chiếm một hàng grid.
- Nút ở tiêu đề không còn margin-top của footer form. Trong bảng, nhóm nút thao tác bỏ margin-top 16px và căn giữa cùng tiêu đề cột, không xuống dòng; nội dung ô căn giữa theo chiều dọc. Các liên kết thao tác có vùng bấm cao 40px.
- Chỉ CSS admin, không sửa dữ liệu, quyền, UI dùng chung hay recruiter/candidate. Khoảng cách của footer xác nhận trong form vẫn giữ nguyên.
- Bổ sung kiểm tra căn cột và nhóm nút vào lượt rà soát trang, đợi hết skeleton trước khi chụp ảnh. Lint kiểm thử và git diff --check đạt; typecheck/lint toàn repo vẫn báo lỗi nền như các lượt trước.
- Lượt kiểm thử cuối đạt (1,5 phút): 10 trang chính desktop/mobile và 5 trang chi tiết. Đã xem ảnh danh mục có dữ liệu thật từ mock: khoảng cách gọn, tiêu đề Thao tác và nhóm nút cùng cột, các nút không còn bị đẩy xuống.

## Nhóm bộ lọc nhật ký

- Thay flex-wrap tùy chỗ trống bằng grid cho tìm kiếm và 4 tiêu chí. Nhóm hai ngày và nút xóa thành hàng riêng có đường phân cách; hai ngày luôn cùng hàng, nút xóa ở cuối hàng desktop và hàng riêng mobile.
- Dưới 1000px, tìm kiếm chiếm toàn hàng, các tiêu chí chia 4 cột; dưới 700px chia 2 cột. Không đổi cách lọc hoặc reset dữ liệu.
- Bổ sung kiểm tra vị trí hai ô ngày tại 1280px/375px và ảnh trang nhật ký. Lint các TSX/kiểm thử sửa đổi đạt; typecheck/lint toàn repo vẫn vướng lỗi nền đã ghi ở trên.
- Kiểm thử trình duyệt cuối đạt (52,7 giây) trên toàn bộ ma trận admin, gồm kiểm tra hai ô ngày cùng hàng và trang không cuộn ngang ở cả hai kích thước.

### Điều chỉnh theo yêu cầu một hàng

- Thay bố cục hai hàng ở trên bằng một grid gồm tìm kiếm, 4 tiêu chí, 2 ngày và nút xóa. Nhóm ngày dùng display:contents; không còn đường phân cách hoặc hàng riêng.
- Khi không đủ chiều rộng, chỉ thanh bộ lọc cuộn ngang; không làm trang cuộn ngang hoặc đẩy một ô xuống hàng mới. Bổ sung kiểm tra toàn bộ control có đáy cùng hàng ở desktop/mobile.
- Lượt kiểm thử sau điều chỉnh một hàng đạt (1,3 phút). Lint kiểm thử đạt; typecheck/lint toàn repo vẫn không đạt do lỗi nền đã ghi nhận.
