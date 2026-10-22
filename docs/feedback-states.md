# Mascot cho các trạng thái giao diện

Ảnh được tạo bằng imagegen tích hợp từ tham chiếu nhân vật gốc `public/images/animationloading.png`, không thay đổi ảnh gốc, không dùng CLI/API fallback. Các PNG gốc được giữ tại thư mục generated_images của Codex; ba bản dùng trong dự án được chuyển WebP 640×640, giữ alpha, quality 85.

| Trạng thái | Asset | Hình ảnh |
|---|---|---|
| Không tìm thấy trang/nội dung | `public/images/states/mascot-not-found.webp` | Mascot cầm bản đồ và hơi bối rối |
| Chưa có dữ liệu/không có kết quả | `public/images/states/mascot-empty.webp` | Mascot soi một thư mục trống |
| Lỗi tải/kết nối | `public/images/states/mascot-error.webp` | Mascot nối lại dây kết nối |

## Component và tích hợp

- `FeedbackState`: `kind` (`not-found`, `empty`, `error`), `variant` (`page`, `section`, `compact`), `title`, `description`, `action`, `headingAs`, `code` và `icon` phụ tùy chọn.
- `EmptyState`: giữ API cũ, mặc định dùng hình trạng thái trống. Hình có alt rỗng vì tiêu đề/nội dung đã mô tả trạng thái; lỗi cả vùng có `role=alert`.
- `FeedbackPage`: shell nhẹ với logo và đường quay về cho root 404/error.
- Ảnh có chuyển động nổi nhẹ 4px; tắt hoàn toàn bằng `prefers-reduced-motion`. Không animate nội dung/nút phục hồi.
- Giữ các hành vi notFound/SEO, reset bộ lọc, phân trang và refetch; không biến lỗi mạng thành danh sách trống. Không hiển thị error.message/stack thô từ error boundary. Dùng `retry()` của Next 16.4 thay cho chỉ reset state.
- Không thêm hình lớn vào lỗi validation form hoặc mutation nhỏ; giữ Alert/inline ở các vị trí đó.
- `/ui/states` là showcase, gồm nút minh họa error boundary thật; “Thử lại” quay về showcase, không thay đổi dữ liệu.

## Prompt cuối (mỗi asset một lần gọi imagegen)

### not-found

Use case: stylized-concept. Asset type: production website state illustration, single transparent cutout. Image 1 is CHARACTER IDENTITY AND MATERIAL REFERENCE ONLY, not a sprite layout to reproduce. Create a new single full-body pose of exactly this cute TalentAI purple drop-headed robot: glossy violet pear/drop head, small purple forelock, white face screen with tiny purple expressive eyes and mouth, purple headset with gold ear rings and microphone and one antenna, short purple torso with small yellow lightning bolt, white mitten hands and white boot feet. Preserve proportions, palette and high-quality soft 3D toy rendering. One character only, three-quarter front view, centered composition on a square 1024x1024 canvas, full head antenna and feet visible with 12% transparent margin. Warm, friendly, understated professional recruiting website tone. True transparent alpha background; no checkerboard, scenery, floor, panel, border, UI, text, letters, digits, watermark or glow cloud. No huge props; props secondary to the character. Pose for PAGE NOT FOUND / lost: the mascot stands with its head tilted a little, holding a small unfolded lilac paper map with a simple route line (NO lettering), its other white hand open in a gentle puzzled shrug. Curious rounded eyes and a tiny unsure smile, not distressed. Minimal crisp silhouette, no other objects.

### empty

Use case: stylized-concept. Asset type: production website state illustration, single transparent cutout. Image 1 is CHARACTER IDENTITY AND MATERIAL REFERENCE ONLY, not a sprite layout to reproduce. Create a new single full-body pose of exactly this cute TalentAI purple drop-headed robot: glossy violet pear/drop head, small purple forelock, white face screen with tiny purple expressive eyes and mouth, purple headset with gold ear rings and microphone and one antenna, short purple torso with small yellow lightning bolt, white mitten hands and white boot feet. Preserve proportions, palette and high-quality soft 3D toy rendering. One character only, three-quarter front view, centered composition on a square 1024x1024 canvas, full head antenna and feet visible with 12% transparent margin. Warm, friendly, understated professional recruiting website tone. True transparent alpha background; no checkerboard, scenery, floor, panel, border, UI, text, letters, digits, watermark or glow cloud. No huge props; props secondary to the character. Pose for NO SEARCH RESULTS / empty data: the mascot crouches slightly to inspect a small OPEN EMPTY lavender document folder with a simple round magnifying glass. Friendly curious eyes, reassuring small smile. Folder visibly empty, no paper content or writing. Keep the white face, purple headset and yellow lightning bolt clearly recognizable. No other objects.

### error

Use case: stylized-concept. Asset type: production website state illustration, single transparent cutout. Image 1 is CHARACTER IDENTITY AND MATERIAL REFERENCE ONLY, not a sprite layout to reproduce. Create a new single full-body pose of exactly this cute TalentAI purple drop-headed robot: glossy violet pear/drop head, small purple forelock, white face screen with tiny purple expressive eyes and mouth, purple headset with gold ear rings and microphone and one antenna, short purple torso with small yellow lightning bolt, white mitten hands and white boot feet. Preserve proportions, palette and high-quality soft 3D toy rendering. One character only, three-quarter front view, centered composition on a square 1024x1024 canvas, full head antenna and feet visible with 12% transparent margin. Warm, friendly, understated professional recruiting website tone. True transparent alpha background; no checkerboard, scenery, floor, panel, border, UI, text, letters, digits, watermark or glow cloud. No huge props; props secondary to the character. Pose for TEMPORARY CONNECTION ERROR / try again: the mascot stands holding the two disconnected ends of one short purple data cable in its white hands, looking at the disconnected plugs with gently concerned but hopeful eyes and tiny smile. A small connection spark between the plugs is acceptable, no hazard, damage, smoke, sadness or angry expression. Headset stays intact and on the head, preserve lightning chest emblem. No other objects.

