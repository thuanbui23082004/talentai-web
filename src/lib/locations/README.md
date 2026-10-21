# Địa giới Việt Nam hiện hành

Nguồn: [Province Open API v2](https://provinces.open-api.vn/), dữ liệu sau sắp xếp tháng 07/2025.

Tải từ `https://provinces.open-api.vn/api/v2/?depth=2` ngày 21/10/2026.
Snapshot gồm 34 tỉnh/thành và 3.321 phường/xã/đặc khu. Chỉ giữ tên và mã hành chính;
mã tỉnh có 2 chữ số, mã xã có 5 chữ số (giữ số 0 đầu).
Không sử dụng cấp quận/huyện cũ. Snapshot phục vụ bộ chọn và kiểm tra quan hệ tỉnh–xã;
không gọi dịch vụ bên ngoài khi người dùng tìm việc.

Khi cập nhật snapshot, kiểm tra tổng số đơn vị, mã trùng và các mã đang dùng trong fixture.
Địa điểm của các tin mock là dữ liệu minh họa; không đại diện địa chỉ doanh nghiệp thật.
