# Hai bước tùy chọn trong khởi tạo doanh nghiệp

Luồng gồm năm bước. Bước 3 nhận website, số nhân viên (số nguyên dương, tối đa int32) và năm thành lập không lớn hơn năm hiện tại. Bước 4 chọn ảnh đại diện và ảnh bìa. Cả hai có nút Bỏ qua; khi bỏ qua, các lựa chọn mới của bước đó được hủy, tránh giá trị chưa hợp lệ làm lỗi bước xác nhận.

Ảnh được kiểm tra định dạng/đuôi PNG, JPG hoặc WebP, dung lượng 2MB, giải mã trước khi đưa vào preview. Giới hạn này là lựa chọn bảo vệ của frontend/BFF, không khẳng định giới hạn lưu trữ của backend. Preview thể hiện ảnh bìa ngang, logo vuông chồng lên bìa, tên công ty, lĩnh vực, địa điểm và website. Không gửi base64/object URL tới API.

Khi xác nhận cuối cùng: lưu thông tin → upload logo nếu chọn → upload cover nếu chọn. Các request ghi không tự retry. BFF kiểm tra session recruiter, Origin/CSRF, dung lượng và chữ ký file, rồi chuyển multipart sang Java mà không tự đặt boundary/Content-Type.

| BFF | Backend |
| --- | --- |
| POST/PUT `/recruiter/company` | PUT `/api/v1/recruiter/company` |
| PUT `/recruiter/company/logo` | POST `/api/v1/recruiter/company/logo`, multipart `file` |
| PUT `/recruiter/company/cover` | POST `/api/v1/recruiter/company/cover`, multipart `file` |

API upsert hiện chỉ nhận thông tin, không nhận logoUrl/coverImageUrl; ảnh dùng endpoint upload riêng. Khi upload thất bại, company đã lưu vẫn được giữ. UI cho thử lại chỉ ảnh còn lỗi hoặc hoàn tất, thêm ảnh sau. Nếu logo thành công nhưng cover thất bại, không upload lại logo khi retry. Ảnh là tùy chọn nên công ty đã tạo vẫn được phép vào dashboard khi đăng nhập lại.

## Trạng thái tích hợp thật — 2026-11-05

GET company cho tài khoản mới trả 404; lưu website/companySize/foundedYear thành công và đã đối chiếu dữ liệu Java. Cả POST logo và POST cover gọi trực tiếp backend với file PNG hợp lệ hiện trả:

```json
{"error":{"code":"IMAGE_UPLOAD_FAILED","message":"Failed to upload company image"}}
```

HTTP status là 502, BFF chuẩn hóa thành 503. Cần kiểm tra cấu hình/kết nối dịch vụ ảnh và exception ở company-service để xác định nguyên nhân; frontend không có thông tin đủ để khẳng định do credentials. E2E thật ghi nhận giới hạn này, xác minh dữ liệu company còn giữ và đường hoàn tất không có ảnh. Không coi nhánh lỗi được xử lý đúng là upload thật đã thành công.

Mock E2E kiểm tra bỏ qua cả hai bước, validation, preview desktop/mobile, upload và tải lại, lỗi một ảnh/retry không ghi lại company. Unit test kiểm tra multipart POST, header và chặn file sai/quá dung lượng.
