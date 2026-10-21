# Chi tiết công ty

Route `/companies/[companyId]`, ví dụ `/companies/20000000-0000-4000-8000-000000000001`.
Trang công khai render server, tạo metadata từ hồ sơ công ty và dùng React cache để chia sẻ lần tải giữa metadata/page.

GET `/companies/{companyId}` và `/companies/{companyId}/jobs` đã có trong contract. Mock triển khai hai endpoint, chỉ trả việc đang open của đúng company ID, lọc trước phân trang và hỗ trợ empty/error/slow.
Trang hồ sơ và công ty cùng lĩnh vực lấy dữ liệu qua BFF server; danh sách việc làm dùng TanStack Query/service/API client, có loading/empty/error/retry và Pagination.
Không mở proxy real mới khi chưa xác minh backend.

Tái sử dụng CompanyCard, JobCard, LocationMap, AvailabilityButton, Button, Skeleton, EmptyState, Pagination và public header/footer.
Ảnh bìa mặc định dùng banner_company.png trong dự án do chưa có ảnh bìa doanh nghiệp trong contract. Logo có fallback wordmark.
Giới thiệu hỗ trợ xem thêm/thu gọn, chia sẻ hỗ trợ clipboard/Web Share và các URL mạng xã hội.
Theo dõi chỉ mở thông báo chưa triển khai, không giả vờ lưu thành công. Khối đánh giá hiện trạng thái chưa có dữ liệu; không tạo điểm/đánh giá giả. Website chỉ hiện liên kết HTTP(S) hợp lệ.
Banner ứng dụng sử dụng AppDownloadBanner chung; ứng dụng hiện ở trạng thái sắp ra mắt.

Card danh sách công ty và link công ty trong trang chi tiết việc làm dẫn tới hồ sơ công ty.
ID không hợp lệ/không tồn tại hiển thị 404; lỗi tải hồ sơ có error boundary và thử lại.
Kiểm thử gồm lọc việc theo company ID, điều hướng, SEO, mở rộng giới thiệu, chia sẻ, empty/error/retry và responsive 375/1280px.
