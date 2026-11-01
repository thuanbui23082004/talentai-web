# Gói mã nguồn giao diện tuyển dụng TalentAI

Gói này chứa các file hiện đang lưu trong workspace liên quan đến khu tuyển dụng. Đây là gói mã nguồn để ghép vào dự án TalentAI hiện có, không phải bản build độc lập.

## Nội dung

- Route tuyển dụng trong `src/app/(recruiter)/`.
- Dashboard, tin tuyển dụng, tạo/sửa tin, ứng viên, pipeline, chi tiết hồ sơ, phỏng vấn, hộp thư, tài khoản, công ty, dịch vụ, bảng giá, khuyến mãi và trợ giúp.
- Component dùng chung, CSS, API client, provider và những module được các màn hình trên sử dụng.
- BFF, dữ liệu mock và hợp đồng API đang có trong dự án.
- Tài nguyên hình ảnh/logo, cấu hình dự án và các test liên quan.

Xem `DANH-SACH-FILE.txt` để biết đường dẫn đầy đủ. Cấu trúc thư mục gốc được giữ nguyên để tiện chép vào dự án.

## Lưu ý

- Không chứa `.env`, thông tin đăng nhập, `node_modules`, `.git` hoặc thư mục build.
- Các thao tác hộp thư vẫn sử dụng dữ liệu mock trong phiên; chưa kết nối dịch vụ gửi email thật.
- Một số module dùng chung còn phục vụ các luồng khác; chúng được giữ lại để tránh thiếu import.
- Dùng pnpm và cấu hình môi trường riêng của dự án đích khi tích hợp. Không chép đè các file cấu hình hoặc mã nguồn hiện có mà chưa so sánh thay đổi.
