# Loading animation

`LoadingState` là component dùng chung tại `src/components/shared/loading-state.tsx`.

- `variant="page"`: chờ chuyển trang, giữ layout/header tương tác được.
- `variant="section"` (mặc định): chỉ thay vùng dữ liệu đang tải. Không phủ toàn trang khi lọc/phân trang hoặc tải nền; dữ liệu cũ vẫn được giữ bởi các query hiện có.
- `title`, `description`: nội dung theo ngữ cảnh; `role="status"`, `aria-live="polite"` và `aria-busy` thông báo trạng thái.
- Tám khung hình chạy theo CSS steps, chu kỳ 880ms. Không có phần trăm giả, độ trễ request giả hoặc thời gian hiển thị bắt buộc. Fade-in nhẹ; `prefers-reduced-motion` dùng khung hình tĩnh và tắt các animation.

Đã tích hợp: fallback public/candidate, trang chủ SSR, danh sách/chi tiết việc làm và công ty, việc làm của công ty, hồ sơ ứng tuyển và việc làm đã lưu. Fallback candidate nằm bên trong layout kiểm tra quyền, không bọc ngoài bước xác thực. Các trạng thái lỗi/thử lại và empty hiện tại được giữ nguyên. Các placeholder rất nhỏ như badge thông báo, nút gửi form vẫn giữ loading riêng.

Xem thử tại `/ui/loading` (không tự kết thúc vì đây là showcase).

## Asset

Ảnh gốc `public/images/animationloading.png` có nền caro đã raster hóa, không có alpha. Giữ nguyên file này. Bản dùng cho web là `public/images/loading-mascot-sprite.webp` (1536×1024, 4 cột × 2 hàng, có alpha, khoảng 264 KiB). Static import tạo URL có hash để đổi asset không vướng cache cũ.

Bản sprite được xử lý bằng imagegen tích hợp (không dùng API/CLI fallback), rồi chuyển WebP để giảm dung lượng. Prompt cuối:

> Use case: background-extraction. Edit target: supplied mascot animation sheet. Create a clean transparent PNG sprite sheet for a website loading animation. Extract ONLY the eight complete running purple headset robot poses in the top row; omit all bottom-row separated body parts, text labels, shadows and effects. Remove the baked grey/white checkerboard entirely, output true alpha transparency. Arrange the eight full-body poses in order in a precise FOUR COLUMN by TWO ROW equal-cell grid on a 1536x1024 canvas (each cell 384x512); each robot centered in its cell, same scale and baseline, full antenna and limbs visible, generous transparent gutters, no overlap or clipping. Preserve exact character identity, purple glossy material, white face and limbs, yellow lightning emblem and headset, closed smiling eyes, original pose differences. No new elements, no text, no background, no checker pattern. This is a technical sprite asset not a composition illustration.
