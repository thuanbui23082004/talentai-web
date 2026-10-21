# Trang chi tiết việc làm

Route công khai: `/jobs/[jobId]`. Ví dụ: `/jobs/10000000-0000-4000-8000-000000000004`.

Trang dùng Server Component, `generateMetadata` và tải dữ liệu qua cùng BFF handler của ứng dụng.
GET `/jobs/{jobId}` đã có trong contract; không thêm trường hoặc endpoint mới.
Mock cung cấp nội dung minh họa cho 18 tin, không phải thông tin doanh nghiệp thật.
Endpoint chi tiết chưa mở trong proxy real vì chưa xác minh với backend.

Tái sử dụng `JobSearch`, `JobCard`, `JobHoverPreview`, `AvailabilityButton`, `Badge`, `Input`, `Button`, nav và footer của public layout.
Tiêu đề card và nút xem chi tiết trong hover preview dẫn đến trang chi tiết.
Tin liên quan lấy từ API tìm kiếm theo thành phố, loại tin hiện tại, tối đa 6 card; không phải gợi ý cá nhân hóa từ AI.
Nội dung mô tả được render dưới dạng văn bản, không chèn HTML từ API.

Ứng tuyển và lưu việc mở thông báo trạng thái chưa triển khai; không gửi hồ sơ hoặc giả vờ lưu thành công.
Khối AI chỉ hiển thị kỹ năng của tin và trạng thái chưa phân tích CV, không tạo điểm phù hợp giả.
Form liên hệ trong thiết kế đang khóa và chưa gửi dữ liệu. Bản đồ mở tìm kiếm địa điểm trên Google Maps, không hiển thị tọa độ chưa có trong contract.
Chia sẻ dùng Web Share API hoặc sao chép URL, có phản hồi khi clipboard không khả dụng.

Có loading skeleton, error boundary với nút thử lại và trang 404 cho ID không tồn tại/không hợp lệ.
Kiểm thử trình duyệt bao gồm điều hướng từ card, URL trực tiếp, metadata, responsive 375/1280px và tìm kiếm từ trang chi tiết.
