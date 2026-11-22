# JSON đề xuất cho CV tạo từ mẫu

Backend hiện chưa có endpoint lưu CV mẫu. FE đã triển khai `POST /api/cv` (alias cho BFF `/api/bff/cv`) dạng **mock trong bộ nhớ tiến trình**, có kiểm tra session candidate, CSRF và schema. Bản nháp chưa được lưu bền vững; backend cần triển khai cùng payload. **Không dùng** `POST /cvs/manual` vì contract hiện tại của endpoint đó chỉ nhận nội dung CV nhập tay, không có mẫu, màu hoặc nền.

```json
{
  "templateId": "modern-1",
  "theme": { "primaryColor": "#EC8F00", "backgroundId": "bg-03" },
  "data": {
    "basics": { "fullName": "Nguyễn Văn A", "title": "Frontend Developer", "email": "a@example.com", "phone": "0901234567", "address": "Hà Nội", "avatarUrl": "", "summary": "Xây dựng giao diện web." },
    "education": [{ "school": "Đại học Bách khoa", "degree": "Kỹ sư CNTT", "startDate": "2019-09-01", "endDate": "2023-06-30", "description": "" }],
    "experience": [{ "company": "Công ty ABC", "position": "Frontend Developer", "startDate": "2023-07-01", "endDate": "", "current": true, "description": "Phát triển ứng dụng React." }],
    "skills": [{ "name": "React", "level": 80 }],
    "projects": [{ "name": "Trang tuyển dụng", "role": "Frontend", "link": "", "description": "" }],
    "certificates": [{ "name": "IELTS", "issuer": "British Council", "date": "2024-01-01" }],
    "languages": [{ "name": "Tiếng Anh", "level": "Khá" }]
  },
  "updatedAt": "2026-11-22T00:00:00.000Z"
}
```

`templateId` định danh mẫu trong registry. `theme.primaryColor` là hex 6 chữ số; `backgroundId` là `none` hoặc `bg-01` đến `bg-15`. Các danh sách có thể rỗng. Trường văn bản thiếu dùng chuỗi rỗng. Ngày trong dữ liệu CV là `YYYY-MM-DD` hoặc chuỗi rỗng; `updatedAt` là ISO-8601 UTC. `skills.level` trong khoảng 0–100. Backend cần ràng buộc bản ghi với người dùng từ session, không tin user ID do client gửi.

PDF dùng `html2pdf.js` để xuất chính DOM của bản xem trước thành ảnh trên trang A4; cách này giữ font Inter tiếng Việt, màu và nền CSS gradient như trên màn hình. Mỗi mục kinh nghiệm/học vấn/dự án được đánh dấu tránh cắt ngang trang. PDF là ảnh raster nên văn bản trong file không chọn hoặc tìm kiếm được.
