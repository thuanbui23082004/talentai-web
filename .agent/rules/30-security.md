# Quy tắc Bảo mật

## Xác thực & Phân quyền
- Client không trực tiếp lưu trữ hoặc thao tác backend tokens nhạy cảm nếu không cần thiết.
- BFF chịu trách nhiệm quản lý session, cookies, và header chuyển tiếp.
- Kiểm tra quyền truy cập (Candidate, Recruiter, Admin) ở cả middleware và BFF layout/route.
