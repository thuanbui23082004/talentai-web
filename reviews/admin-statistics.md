# Admin — Thống kê và báo cáo

## Phạm vi theo task

Người dùng yêu cầu triển khai trang thống kê còn thiếu theo danh sách đã trao đổi:
người dùng/doanh nghiệp/tin tuyển dụng, hồ sơ ứng tuyển, tình hình tuyển dụng và chỉ số hoạt động.
Không thêm xuất file, doanh thu, xếp hạng AI hay hành động tự động đối với người dùng.

## Giao diện và luồng

- `/admin/statistics`, guard phiên admin; Hệ thống → Thống kê và báo cáo điều hướng thật.
- Tổng quan hiện tại: người dùng (ứng viên/nhà tuyển dụng), doanh nghiệp (xác minh/chờ duyệt), tin (đang tuyển). Phần này dùng snapshot chung với dashboard, không thay đổi theo ngày báo cáo.
- Form khoảng ngày qua react-hook-form/Zod; chỉ áp dụng khi bấm Áp dụng. Ngày sai có lỗi tại form và chặn gửi; toàn bộ thời gian khôi phục bộ lọc.
- Biểu đồ người dùng mới, doanh nghiệp mới, tin mới, hồ sơ, đăng nhập và tác vụ AI; nhóm ngày/tuần/tháng. Có bảng số liệu thay thế để đọc bằng bàn phím, không chỉ dựa vào màu.
- Hồ sơ theo trạng thái có số lượng/tỷ trọng; biểu đồ thanh theo ngành có nhãn/số trực tiếp. Tình hình tuyển dụng gồm tin/hồ sơ/đã tuyển theo ngành và doanh nghiệp, thời gian tuyển trung bình.
- Chỉ số hệ thống hiển thị mốc thu thập và sao lưu, mô tả rõ không áp dụng bộ lọc ngày.
- Từng phần có loading skeleton, lỗi/thử lại, rỗng; lỗi một API không che phần khác. Trường tùy chọn bị thiếu hiện chưa có dữ liệu; không thay bằng số 0 hoặc thông báo hệ thống khỏe.
- Giữ token/font/khung admin hiện có; CSS mới chỉ phạm vi thống kê. Không sửa UI recruiter/candidate.

## Dữ liệu

- Dùng 5 GET đã có trong contract: overview, timeseries, applications, recruitment, system-metrics. Service qua API client, Zod ở biên, TanStack Query với query key gồm bộ lọc.
- Mock dùng fixture tổng hợp giả và kiểm quyền admin chung. Không mutation, không CV/email/số điện thoại, không đưa nội dung cá nhân lên URL.
- Lọc ngày trước khi cộng tuần/tháng; tuần bắt đầu thứ Hai. Tổng hồ sơ khớp tổng trạng thái/ngành/tuyển dụng; hires khớp giữa hai báo cáo. Không cộng chồng dữ liệu đã nhóm.
- API applications hỗ trợ industryId đúng contract; UI hiện hiển thị toàn bộ ngành trong bảng/biểu đồ.
- Rate trong fixture hệ thống được biểu diễn theo điểm phần trăm (99,96 và 0,04), UI hiển thị trực tiếp kèm %. Cần xác minh quy ước đơn vị với backend khi tích hợp real.
- Điều chỉnh helper lỗi trong service overview/login đang được trang mới dùng để khớp chữ ký ApiError hiện hành. Không sửa API client dùng chung.
- Khi kiểm thử phát hiện bộ quản lý phiên candidate/recruiter chuyển admin về `/login` vì không có cookie phiên chung. Đã giới hạn hai nhánh chuyển hướng đó về đúng candidate/recruiter; admin tiếp tục dùng guard và đăng nhập riêng. Không thay đổi quyền hoặc bỏ guard.
- BFF mock admin dùng lại NextRequest hiện có thay vì tạo lại từ request đang chạy trong App Router; với Request thường, chuyển method/headers/body qua constructor URL.

## Xác minh

- 6 unit test mới đạt: đăng nhập mock admin riêng, nhóm ngày/tuần/tháng, bộ lọc/đối chiếu tổng, rỗng, schema, quyền và từ chối tham số sai.
- Lint các file mới đạt. Kiểm tra toàn repo hiện có lỗi nền: import sâu admin không qua public index, ApiError cũ, fixture/kiểm thử recruiter cũ và cấu hình Playwright pipeline; không coi các lỗi này là đã được sửa trong task thống kê.
- Lần thử trình duyệt ban đầu bị lỗi hết dung lượng ổ đĩa; đã dừng tiến trình kiểm thử và dọn đúng cache Turbopack development có thể sinh lại trong workspace. Không xóa nguồn hoặc dữ liệu nghiệp vụ.
- Kiểm thử toàn repo với 2 worker: 373/382 đạt; 7 lỗi hành vi ở các kiểm thử admin/recruiter cũ (helper tạo phiên không còn, catalog tham chiếu fixture cũ), 2 timeout ở CV và architecture. Trang thống kê mới đạt các unit test; không tuyên bố toàn repo pass.
- Production build biên dịch thành công, sau đó dừng ở các lỗi TypeScript cũ nêu trên. Next.js cũng hiển thị cảnh báo cần nâng cấp bảo mật; không nâng cấp dependency trong task này.
- Playwright cuối: 2/2 đạt (49 giây) trên dev server mock riêng. Bao phủ đăng nhập/điều hướng, lọc ngày, tổng theo tuần/chỉ số, bảng số liệu, khoảng ngày sai, xóa bộ lọc và giá trị ngày trên form, reload, 375px, loading, lỗi từng phần/thử lại, không lộ lỗi thô, rỗng và hết phiên.
- Đã xem ảnh desktop/mobile, phát hiện và sửa reset ngày bằng default string rỗng thay vì undefined; bổ sung assertion chống tái phát. Trang không tràn ngang; bảng rộng cuộn trong khung.
- Lint toàn bộ các file thay đổi trong task đạt. Typecheck cuối không báo lỗi tại các file thống kê mới; vẫn thất bại bởi các file cũ được liệt kê. Chưa đạt điều kiện xác nhận toàn dự án hoàn tất.
