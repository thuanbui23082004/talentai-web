# Theo dõi hồ sơ ứng tuyển candidate

Nguồn API: Swagger application-service tại `http://localhost:3005/swagger-ui/index.html#/`.
Ba endpoint đã đối chiếu: GET `/api/v1/applications`, GET `/api/v1/applications/{id}` và
GET `/api/v1/applications/{id}/history`.

Frontend gọi service qua BFF `/candidate/application-tracking`. BFF đọc danh tính từ cookie
HttpOnly, kiểm tra role candidate rồi chuyển access token tới application-service. Không
chuyển `applicantSnapshot`, `changedBy` hoặc metadata nội bộ về trình duyệt.

Danh sách dùng `status`, `page`, `pageSize`. BFF đổi trang 1-based của UI thành `page`
0-based và `size` của Java. Swagger hỗ trợ lọc một trạng thái, không hỗ trợ từ khóa hay
sắp xếp, nên UI chỉ cung cấp bộ lọc trạng thái và phân trang. Các trạng thái:
`submitted`, `reviewing`, `shortlisted`, `interview_scheduled`, `offered`, `rejected`,
`withdrawn`, `hired`.

Chi tiết mở ở `/candidate/applications/{applicationId}`; lịch sử lấy từ endpoint riêng.
Trang hiển thị sáu bước tuyển dụng theo trạng thái thật, chỉ đánh dấu bước đã có trong
lịch sử hoặc là trạng thái hiện tại. `rejected` và `withdrawn` nằm ở nhánh kết thúc riêng.
Lỗi tải lịch sử không che mất phần chi tiết hồ sơ. Nhân vật CV lấy từ asset có sẵn của dự án.
Tên tin lấy từ `jobSnapshot.title`, tên công ty chỉ hiện nếu `jobSnapshot.companyName` có mặt.
Nếu snapshot thiếu, UI không tự lấy tin hiện tại để thay thế dữ liệu lúc nộp.

Application-service hiện không công bố endpoint lịch phỏng vấn candidate. Vì vậy phần lịch,
xác nhận lời mời và tải `.ics` minh họa không còn nằm trên trang tracking real. Mock cũ
của các luồng này vẫn ở BFF cho các tác vụ chưa tích hợp.

Kiểm tra: unit `tests/unit/candidate-application-tracking.test.ts`; E2E mock
`tests/e2e/applications.spec.ts`; E2E real nằm trong
`tests/e2e/application-submit.spec.ts` khi bật `APPLICATION_REAL_E2E=1` và backend nộp hồ sơ
hoạt động. E2E real tạo hồ sơ thử rồi kiểm tra list/detail/history trước khi dọn dữ liệu.

Kiểm tra trực tiếp ngày 2026-11-17: đăng ký candidate mới rồi GET tracking qua BFF ở
`APPLICATION_DATA_MODE=real` trả 200 với `items=[]` và `totalItems=0`. E2E tạo hồ sơ
thật dừng ở upload CV vì profile-service trả `403 FORBIDDEN` cho tài khoản test mới.
Vì vậy list/detail/history có dữ liệu thật chưa được nghiệm thu end-to-end; unit test đã
kiểm tra phản hồi không rỗng theo schema Swagger.
