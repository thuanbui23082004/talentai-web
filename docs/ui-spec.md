# TalentAI — Đặc tả UI dùng chung

## Nguồn và phạm vi

Theo yêu cầu thiết kế và ảnh demo người dùng cung cấp: Modern, Professional, Clean, Recruitment Platform.
Đây là đặc tả UI hiện hành, không thay thế contract API hoặc tự bổ sung nghiệp vụ vào SRS.
Trang `/ui` là nơi xem thử; thẻ việc làm và số liệu tại đó là minh họa, không phải thống kê hệ thống.

## Hệ thống thiết kế

| Token / yếu tố | Quy định |
|---|---|
| Header, thương hiệu đậm | `brand-deep` — #46009B |
| Primary tương tác | `primary` — #6525C5, hover #531BA8 |
| Tím sáng trang trí | `brand-bright` — #7C3AED |
| Tím nhạt | `secondary` — #F0EAFA |
| Nền trang / card | #F7F8FC / #FFFFFF |
| Chữ chính / phụ | #252134 / #6C687D |
| Xanh nhạt / cam nhấn | `info-soft` #EDF5FF / `warning` #F07818 |
| Font | Inter variable, self-host; system-ui/sans-serif fallback |
| Body | 14px; nội dung dài có thể 16px, line-height thoáng |
| Metadata | 12–13px; ví dụ đặc biệt có thể nhỏ hơn, không dùng cho nội dung thiết yếu |
| Heading | 16–24px; hero 28px mobile, 40–44px desktop |
| Radius | Input/button 12px, card/modal 16–20px; badge 6–8px, pill/avatar tròn |
| Shadow | `shadow-card` nhẹ; `shadow-float` cho dropdown, modal, thanh tìm kiếm |
| Layout | Căn giữa, max-width 1280px; gutter 20px mobile, 32px desktop; khoảng cách theo bước 4/8px |
| Icon | Lucide React, line icon, thường 16–20px |

Token nằm trong `src/app/globals.css`; không chép mã màu vào mỗi component.
Không dùng cam sáng cho chữ nhỏ trên trắng; dùng `warning-foreground` tối hơn để dễ đọc.
Đơn vị UI là px/rem; 14pt không bằng 14px. Nền trang có thể xám nhạt, không bắt buộc toàn bộ trắng.
Không tự bật dark mode hoặc tự thêm bộ lọc giới tính chỉ vì có trong ảnh tham chiếu.

## Component và API

`JobSearchBar` tại `components/shared/job-search-bar.tsx` là component trình bày dùng chung theo mẫu thanh tím/hàng lọc trắng. Xem và tương tác tại `/ui/job-search`.
Props: `locations`, `filters` (key/label/options/disabled), `initialValues`, `onSearch`, `onReset`, `showQuickRecruitment`, `queryLabel`. `onSearch` trả `{ query, location, quickRecruitment, filters }`; trang sử dụng chịu trách nhiệm ánh xạ sang contract và URL. Khi URL đổi bằng Back/Forward, truyền key theo URL để khởi tạo lại giá trị.
Nút Bộ lọc đóng/mở hàng lọc và giữ lựa chọn; Xóa lọc xóa từ khóa, địa điểm và toàn bộ bộ lọc, rồi gọi `onReset`. Enter gửi tìm kiếm. Mobile xếp dọc, các control cao tối thiểu 44px.
Trang minh họa không gọi API. Tuyển nhanh và giới tính chỉ là cấu hình minh họa theo ảnh, chưa có trong contract `/jobs`; không gửi các key này sang API. Mock hỗ trợ từ khóa, thành phố, khoảng lương, kinh nghiệm, cấp bậc, loại hình, sắp xếp và phân trang.

Trang home `/` dùng layout theo sáu ảnh tham chiếu: nav, hero, bộ sưu tập việc làm, banner, ngành nghề, công ty, tin tức, CV và footer. Đặc tả cấu trúc, luồng dữ liệu, dữ liệu minh họa và cách thay asset tại `docs/home-page.md`.

Import trực tiếp từ `@/components/ui/<name>` hoặc public barrel `@/components/ui`.

| Component | API / hành vi chính |
|---|---|
| Button | `variant`: primary, secondary, outline, ghost, destructive, link; default alias primary. `size`, `loading`, `disabled`; mặc định type=button |
| Input | HTML input props; text/email/password/search; `leadingIcon`, `trailingIcon`; password có nút hiện/ẩn |
| FormField | `label`, `description`, `error`, `required`; render prop nối id/required/aria-describedby/aria-invalid tới control |
| Select | `options`, `value`/`defaultValue`, `onValueChange`; Base UI quản lý bàn phím, focus, đóng/mở |
| MultiSelect | Controlled `value: string[]`, `onValueChange`; chọn nhiều và bỏ từng chip; name tham gia form |
| Checkbox | Native checkbox props, `label`, `description`; disabled và checked/uncontrolled |
| RadioGroup | `options`, `label`, `name`, `value`/`defaultValue`, `onValueChange`; fieldset/legend và radio native |
| Badge | default/hot/new/remote/outline/neutral; chỉ biểu thị nhãn, không giả làm button |
| Card | CardHeader/Title/Description/Content/Footer; khung trình bày, không chứa logic nghiệp vụ |
| Avatar | `name`, `src`, `size`; fallback chữ viết tắt khi không có ảnh hoặc ảnh lỗi |
| Tooltip | `content`, `side`, một phần tử tương tác làm children; hiện khi hover/focus |
| Modal | Modal/ModalTrigger/ModalContent/ModalClose; title bắt buộc, description/footer tùy chọn; focus trap, Escape, trả focus |
| Tabs | Tabs/TabsList/TabsTrigger/TabsContent; chọn bằng bàn phím và liên kết panel |
| Pagination | Controlled `page`, `totalPages`, `onPageChange`; biên trước/sau disabled, có ellipsis |
| Skeleton | Placeholder trang trí; vùng chứa phải có role=status/tên thông báo loading |
| EmptyState | Trong `components/shared`; title, description, icon, action |
| Toast | `useToast().toast({title, description, variant})`; success/error/info; đóng thủ công hoặc sau 5 giây |
| Alert | info/success/warning/error; title và nội dung; lỗi dùng role=alert |

`ToastProvider` và `TooltipProvider` được gắn tại root. Không tạo thêm provider cho mỗi feature.
`SearchBar`, `SiteHeader`, `SiteFooter` là mẫu ghép dùng chung, không tự gọi API hoặc biết DATA_MODE.
Nội dung form nghiệp vụ vẫn cần Zod trong feature; component UI không tự quyết định quy tắc mật khẩu hay API.

```tsx
<FormField label="Email" error={errors.email} required>
  {(field) => <Input {...field} type="email" name="email" autoComplete="email" />}
</FormField>
```

## UX và nghiệm thu

- Label luôn hiện, placeholder không thay thế label. Lỗi có chữ/icon và nối đúng input.
- Loading phải ngăn gửi trùng; trạng thái disabled không chỉ dựa vào màu.
- Tên truy cập cho icon-only button, trạng thái chọn dùng aria-pressed/aria-current khi phù hợp.
- Modal có title, focus trap, Escape, nút đóng và trả focus về trigger.
- Dropdown không vượt viewport; nội dung dài cuộn được; không cuộn ngang cả trang ở 375px.
- Tôn trọng prefers-reduced-motion, focus ring luôn nhìn thấy.
- E2E kiểm tra hành vi và responsive trên Chromium; không coi đó là chứng nhận mọi trình duyệt hay toàn bộ WCAG.
- Header/sidebar riêng cho từng role, form nghiệp vụ và chức năng tuyển dụng triển khai sau nền UI này.

## Asset

Mascot và logo dùng các file có sẵn trong `public/images/`, `public/logo/`.
Inter tải từ kho Google Fonts (`google/fonts`, thư mục `ofl/inter`), dùng SIL Open Font License;
giữ `src/assets/fonts/OFL-Inter.txt` khi phân phối font. Build dùng font local, không gọi Google Fonts.

## Bố cục xác thực

- Desktop: frame rộng tối đa 1120px, căn giữa; cột ảnh và form chia đều 50/50. Mobile ẩn ảnh để ưu tiên form. Dưới form đăng nhập có hai nút Google/Facebook với logo thương hiệu, disabled và nhãn “Sắp ra mắt” cho đến khi tích hợp OAuth.

- Ảnh dùng `object-cover`, giữ tỷ lệ và cắt bớt viền để phủ kín cột trái. Ảnh cố định khi nội dung cuộn.
- Đăng nhập căn giữa theo chiều dọc khi đủ chỗ; khung ngoài không cuộn.
- Đăng ký: họ tên → email → số điện thoại → mật khẩu → nhập lại mật khẩu; giữ lựa chọn vai trò và đồng ý chính sách.
- Chỉ nội dung form cuộn. Nút Hoàn tất và liên kết đăng nhập nằm ở thanh riêng phía dưới, không đè lên các trường. Focus lỗi tự cuộn đến trường tương ứng.
- Số điện thoại bắt buộc: 9–15 chữ số, có thể bắt đầu bằng dấu +. Client, contract và BFF mock kiểm tra cùng định dạng, lưu vào `User.phone`.
