# Danh sách công ty

Trang `/companies` dựng theo ảnh tham chiếu: background `public/images/banner/banner_company.png`, hero có số đếm và hai mascot hiện có, CompanySearch riêng, lưới 4 cột desktop/3 cột tablet/2 cột mobile và nút tải thêm. Hero và danh sách căn chung khung tối đa 1120px; mascot nằm ngoài vùng điều khiển, bộ lọc nhanh cuộn ngang trên mobile.
Nav/footer dùng public layout. `CompanyCard` được tách từ HomeCompanies để tái sử dụng ở cả trang chủ và danh sách.
Trang chủ lấy tối đa 20 tin cho bộ sưu tập thay vì chỉ 6 tin để các ID nổi bật/tuyển gấp trong dữ liệu mẫu vẫn có thể được tìm thấy; bộ sưu tập vẫn hiển thị 6 card theo cấu hình.

`100,000+` là nội dung tiêu đề theo thiết kế được cung cấp, không phải tổng số doanh nghiệp từ API. Số chạy trong 1,4 giây, một lần mỗi phiên truy cập; tắt animation nếu người dùng chọn giảm chuyển động.
Mock chỉ có 18 doanh nghiệp minh họa, dùng tên công ty và số tin đang tuyển từ jobs fixture. Khi chưa có logo, card dùng wordmark; không lấy logo doanh nghiệp thật ngoài dự án.

Luồng: URL → useCompanies (TanStack useInfiniteQuery) → service → API client → BFF → mock/real. Tên và địa điểm áp dụng khi submit, dropdown/chip áp dụng ngay. Tải thêm giữ cache của các trang đã tải, nên quay lại cùng bộ lọc sẽ khôi phục các card trước đó.
Hỗ trợ tìm tên không dấu, địa điểm, industryId, size, isVerified, hiringOnly. Các chip tương ứng dữ liệu đã hỗ trợ, không tạo rating/quyền lợi giả.
Contract `/companies` bổ sung size/isVerified/hiringOnly; frontend có thể giữ nguyên khi backend triển khai cùng contract. Real proxy cho companies chưa mở và chưa xác minh tích hợp thật.
Card mở `/companies/[companyId]` để xem hồ sơ công ty, việc đang tuyển và công ty cùng lĩnh vực; xem `docs/company-detail-page.md`.

Kiểm thử: tìm kiếm, kết hợp bộ lọc trước phân trang, tải thêm không trùng, empty/error/retry, URL, responsive 375/1280px và animation một lần mỗi phiên.
