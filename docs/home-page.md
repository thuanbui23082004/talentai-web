# Trang chủ TalentAI: cấu trúc và luồng hoạt động

## Phạm vi giao diện

Route `/` được dựng theo 6 ảnh tham chiếu: dải tải app, nav tím, hero tìm việc, hai bộ sưu tập việc làm, banner cơ hội, ngành nghề, công ty, tin tức, banner CV và footer. Không đưa đường viền chọn Figma hoặc thanh công cụ trong ảnh vào sản phẩm.

Đây là giai đoạn làm UI và mock. Số liệu, bộ sưu tập và công ty mẫu không phải thống kê đang hoạt động của TalentAI. Địa chỉ, thông tin pháp nhân, QR tải ứng dụng và logo doanh nghiệp bên thứ ba không được sao chép từ ảnh khi chưa có asset/thông tin chính thức.

## Các file chính

| File | Trách nhiệm |
|---|---|
| `src/app/(public)/page.tsx` | Server Component của `/`, metadata SEO và ghép các khu vực. |
| `src/app/(public)/layout.tsx` | Gắn header/footer cho các trang public. Auth giữ layout riêng. |
| `src/components/layout/site-header.tsx` | Dải app, logo, dropdown, tài khoản, nhà tuyển dụng, menu mobile. |
| `src/components/layout/site-footer.tsx` | Footer bốn cột, liên kết, icon mạng xã hội và nút kho ứng dụng. |
| `src/components/shared/navigation-details.tsx` | Menu tự đóng sau khi bấm link, kể cả điều hướng Next.js không reload. |
| `src/components/shared/availability-button.tsx` | Modal trạng thái cho chức năng chưa mở. |
| `src/components/home/home-hero.tsx` | Tiêu đề, tìm kiếm, số liệu và hai mascot. |
| `src/components/home/home-discovery.tsx` | Banner cơ hội, ngành nghề, công ty và banner CV, tách thành bốn component. |
| `src/components/home/home-news.tsx` | Thẻ tin tức và modal đọc nội dung. |
| `src/features/jobs/components/job-search.tsx` | Chuyển dữ liệu form thành query URL đúng contract; dùng ở home và `/jobs`. |
| `src/features/jobs/components/job-card.tsx` | Thẻ việc làm và modal tóm tắt; dùng chung cho hai bộ sưu tập. |
| `src/features/jobs/components/home-job-collections.tsx` | Cache jobs, bộ sưu tập theo ID, lọc địa điểm, loading/empty/error. |
| `src/server/bff/home.ts` | Lấy dữ liệu jobs khởi tạo trên server qua cùng adapter/proxy của BFF. |
| `src/mocks/fixtures/home.ts` | Nội dung trình bày minh họa, không phải endpoint home tự tạo. |
| `src/mocks/fixtures/jobs.ts` | Sáu tin mẫu đúng generated type `JobSummary`. |
| `src/lib/jobs/validation.ts` | Kiểm tra query ở trang kết quả và BFF mock. |
| `src/app/globals.css` | Token màu, nền hero, gradient và màu footer. |

## Khi mở home

1. Next.js chạy `page.tsx` trên server và gọi `loadHomePage()`.
2. Server gọi BFF nội bộ với GET `/jobs?pageSize=6`. Không vòng HTTP tới chính dev server và không gọi backend từ trình duyệt.
3. BFF đọc cấu hình server để chọn mock hoặc proxy. UI không đọc `DATA_MODE`.
4. Nội dung trình bày và `initialJobs` được truyền bằng props. Tiêu đề, các phần giới thiệu và sáu thẻ việc làm có sẵn trong HTML ban đầu khi tải dữ liệu thành công.
5. Trình duyệt hydrate giao diện. `useJobs({ pageSize: 6 }, initialJobs)` dùng dữ liệu ban đầu làm cache TanStack Query, theo `staleTime` của QueryProvider.
6. Nếu dữ liệu ban đầu chưa tải được, client thực hiện truy vấn. Khi lỗi có Thử lại; khi rỗng có EmptyState.

Luồng truy vấn phía client vẫn là:

```text
Component → useJobs → getJobs → apiClient
          → /api/bff/jobs → mock-adapter hoặc backend proxy
```

## Khi bấm Tìm kiếm

1. Từ khóa/địa điểm nằm trong state của `SearchBar`; các dropdown nằm trong state của `JobSearchBar`.
2. Enter hoặc nút Tìm kiếm gọi `onSearch` của `JobSearch`.
3. `JobSearch` ánh xạ sang `q`, `city`, `salaryMin`, `salaryMax`, `minExperience`, `maxExperience`, `level`, `workType` và gọi `router.push()`.
4. `/jobs` đọc URL, kiểm tra hợp lệ rồi gọi `useJobs` với các tiêu chí đó.
5. BFF lọc trước khi phân trang, trả số lượng kết quả đúng với tiêu chí. Mock hỗ trợ tìm không dấu.

Ví dụ:

```text
/jobs?q=JavaScript&level=senior
/jobs?city=TP.HCM&salaryMin=20000000&salaryMax=40000000
/jobs?minExperience=1&maxExperience=3&workType=full_time
```

Khoảng lương dùng điều kiện giao nhau: tin lương 15–25 triệu vẫn phù hợp bộ lọc 20–40 triệu. Kinh nghiệm lọc theo `minExperienceYears` của tin. Các khoảng dùng biên bao gồm. Xóa lọc đưa về `/jobs`; Back/Forward khôi phục form từ URL. Query sai định dạng không hiển thị kết quả như thể tìm thành công. Đây là tìm khi submit, chưa có debounce tự tìm.

## Các thao tác khác

- Hai khu vực việc làm tái sử dụng `Collection` và `JobCard`; nhãn tuyển gấp là bộ sưu tập biên tập mẫu theo ID, không phải trường urgency từ API.
- Chip và dropdown lọc ngay theo địa điểm trong từng bộ sưu tập. Mũi tên cuộn hàng chip. Xem thêm mang theo thành phố sang `/jobs`.
- Bấm tên việc hoặc Ứng tuyển mở tóm tắt tin. Modal nói rõ ứng tuyển/lưu việc chưa mở; không tạo hồ sơ hoặc saved state giả.
- Thẻ ngành/công ty dẫn tới tìm kiếm theo từ khóa. Seed chỉ có sáu tin nên một số mục có thể trả kết quả rỗng.
- Đọc thêm mở bài hướng dẫn có nội dung trong fixture, không dùng tin báo bên ngoài như nội dung đã xuất bản của TalentAI.
- App, kho tải, mạng xã hội và WowCV có modal trạng thái. Không tạo link tải hoặc QR giả.

## Sửa nội dung và thay ảnh

Sửa số liệu, ngành nghề, công ty, ID bộ sưu tập và bài viết tại `src/mocks/fixtures/home.ts`.

Đặt ảnh mới trong `public/images/home/`, rồi khai báo trong dữ liệu:

```ts
// Trong một phần tử companies
logo: "/images/home/company-logo.png"

// Trong một phần tử articles
image: "/images/home/news-cover.jpg"
```

Không khai báo ảnh thì component giữ wordmark hoặc cover HTML/CSS hiện tại. Mascot dùng `/images/image 15.png`, `/images/image 16.png`; logo dùng `/logo/`. Banner cơ hội và CV nằm tại `home-discovery.tsx` để thay bằng ảnh chính thức khi có.

## Responsive và giới hạn

- Header đổi sang menu trên mobile; menu tự đóng sau điều hướng.
- Việc làm: 1/2/3 cột. Ngành và công ty: 2/4 cột. Tin tức: 1/2 cột.
- Bộ lọc xuống dòng ở màn hình nhỏ, control chính cao tối thiểu 44px. Dùng Inter, chữ body 14px; không ép chữ quá nhỏ để khớp ảnh thu nhỏ.
- Kiểm tra Chromium ở 375, 768, 1024, 1280, 1920px; chưa nghiệm thu riêng Firefox/WebKit.
- Tuyển nhanh và giới tính disabled trong thanh tìm kiếm thật vì chưa có query tương ứng trong contract.
- Thống kê, công ty, số cơ hội, nội dung và bộ sưu tập vẫn là mẫu trình bày; chưa có CMS/API cho các phần này. Nối nguồn thật và mapping bộ sưu tập là bước tích hợp riêng.
