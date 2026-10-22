// Design samples for the requested UI, separate from account CVs and API payloads.
export const CV_CATEGORIES = ["Tất cả mẫu", "Đơn giản", "Hiện đại", "Sáng tạo", "Chuyên nghiệp", "Chuẩn ATS"] as const;
export type CvCategory = typeof CV_CATEGORIES[number];
export type CvDesign = "navy" | "executive" | "creative" | "green" | "classic" | "aqua";
export const CV_TEMPLATES: { id: CvDesign; name: string; category: CvCategory; description: string; person: string; badge: string; popular: number }[] = [
    { id: "navy", name: "Mẫu Minimalist TechPro", category: "Chuẩn ATS", description: "Chuẩn ATS, bố cục rõ ràng. Làm nổi bật kỹ năng và kinh nghiệm của bạn.", person: "Nguyễn Trúc Quỳnh My", badge: "Bố cục ATS", popular: 6 },
    { id: "executive", name: "Mẫu Modern Executive", category: "Hiện đại", description: "Bố cục 2 cột chuyên nghiệp, có ảnh đại diện, tối ưu cho cấp quản lý.", person: "Trịnh Tú Nghiên", badge: "Phổ biến nhất", popular: 5 },
    { id: "creative", name: "Mẫu Creative Marketer", category: "Sáng tạo", description: "Điểm nhấn cá tính, tinh tế. Dành cho những ứng viên ngành Marketing.", person: "Nguyễn Thi An", badge: "Agency / Creative", popular: 4 },
    { id: "green", name: "Mẫu Minimalist Fresh", category: "Đơn giản", description: "Thiết kế thanh lịch, dễ đọc. Tập trung vào giá trị và năng lực của bạn.", person: "Lê Minh Hưng", badge: "Bố cục ATS", popular: 3 },
    { id: "classic", name: "Mẫu Professional Classic", category: "Chuyên nghiệp", description: "Bố cục truyền thống, chỉn chu. Phù hợp nhiều ngành nghề và vị trí.", person: "Nguyễn Minh Trang", badge: "Được yêu thích", popular: 2 },
    { id: "aqua", name: "Mẫu Modern Light", category: "Hiện đại", description: "Sắc xanh nhẹ nhàng, không gian thoáng. Thể hiện dấu ấn riêng của bạn.", person: "Trần Minh Anh", badge: "Tinh tế / Hiện đại", popular: 1 },
];

export type CvPreviewDraft = { id: string; title: string; person: string; position: string; introduction: string; design: CvDesign; searchable: boolean; updatedAt: string };
export const INITIAL_CV_PREVIEWS: CvPreviewDraft[] = [
    { id: "design-preview-1", title: "CV Nhân viên kinh doanh", person: "Nguyễn Trúc Quỳnh My", position: "Nhân viên kinh doanh", introduction: "Tôi mong muốn phát triển sự nghiệp trong lĩnh vực kinh doanh, mang đến giải pháp phù hợp và xây dựng mối quan hệ bền vững với khách hàng.", design: "navy", searchable: true, updatedAt: "2026-09-07T00:00:00Z" },
    { id: "design-preview-2", title: "CV Nhân viên kinh doanh", person: "Nguyễn Minh Trang", position: "Nhân viên kinh doanh", introduction: "Ứng viên chủ động, có tinh thần trách nhiệm và kỹ năng giao tiếp tốt. Luôn hướng đến trải nghiệm khách hàng và kết quả công việc hiệu quả.", design: "classic", searchable: false, updatedAt: "2026-09-07T00:00:00Z" },
];
