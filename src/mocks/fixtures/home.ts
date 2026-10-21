import type { HomeContent } from "@/lib/home-content";

/** Design preview content. Counts, companies and articles are illustrative, not live platform metrics. */
export const homeContent: HomeContent = {
    statistics: { jobs: "25,850", candidates: "10,250", companies: "18,400" },
    featuredIds: [4, 5, 1, 2, 6, 3].map((id) => `10000000-0000-4000-8000-${String(id).padStart(12, "0")}`),
    urgentIds: [5, 4, 2, 6, 1, 3].map((id) => `10000000-0000-4000-8000-${String(id).padStart(12, "0")}`),
    categories: [
        { name: "Thiết kế", query: "Thiết kế", count: 235, icon: "design" },
        { name: "Kinh doanh", query: "Kinh doanh", count: 756, icon: "sales" },
        { name: "Marketing", query: "Marketing", count: 140, icon: "marketing" },
        { name: "Tài chính", query: "Tài chính", count: 325, icon: "finance" },
        { name: "Công nghệ", query: "JavaScript", count: 436, icon: "technology" },
        { name: "Kỹ thuật", query: "Kỹ thuật", count: 542, icon: "engineering" },
        { name: "Vận hành", query: "Vận hành", count: 211, icon: "business" },
        { name: "Nhân sự", query: "Tuyển dụng", count: 346, icon: "people" },
    ],
    companies: [
        { name: "Sao Việt Group", wordmark: "SAO VIỆT", query: "Sao Việt", count: 436 },
        { name: "An Bình Holdings", wordmark: "AN BÌNH", query: "An Bình", count: 542 },
        { name: "TechNova", wordmark: "technova", query: "TechNova", count: 211 },
        { name: "Mây Việt", wordmark: "MÂY VIỆT", query: "Mây Việt", count: 346 },
        { name: "Bình Minh Media", wordmark: "BÌNH MINH", query: "Bình Minh", count: 436 },
        { name: "GreenSoft", wordmark: "greensoft", query: "GreenSoft", count: 542 },
        { name: "Horizon Studio", wordmark: "HORIZON", query: "Horizon", count: 211 },
        { name: "FutureWorks", wordmark: "FutureWorks", query: "FutureWorks", count: 346 },
    ],
    articles: [
        { id: "cv-ro-rang", title: "Một chiếc CV rõ ràng giúp bạn kể câu chuyện nghề nghiệp như thế nào?", eyebrow: "CẨM NANG ỨNG VIÊN", coverTitle: "CV ẤN TƯỢNG\nCƠ HỘI RỘNG MỞ", date: "2026-10-20", paragraphs: [
            "Một bản CV tốt giúp nhà tuyển dụng nhanh chóng hiểu bạn đã làm gì, có kỹ năng nào và đang tìm kiếm cơ hội gì. Hãy bắt đầu bằng thông tin liên hệ rõ ràng và một đoạn giới thiệu ngắn phù hợp với vị trí ứng tuyển.",
            "Với mỗi kinh nghiệm, mô tả công việc bạn trực tiếp thực hiện và kết quả có thể kiểm chứng. Chỉ đưa những số liệu đúng với trải nghiệm của bạn; đừng thêm thành tích chỉ để làm CV nổi bật.",
            "Trước khi gửi, kiểm tra lỗi chính tả, cách đặt tên file và thông tin liên hệ. Điều chỉnh nội dung theo từng vị trí và giữ bố cục dễ đọc để người xem tìm thấy thông tin quan trọng nhanh hơn.",
        ] },
        { id: "chuan-bi-phong-van", title: "Chuẩn bị cho buổi phỏng vấn: tự tin bắt đầu từ những điều nhỏ", eyebrow: "PHÁT TRIỂN SỰ NGHIỆP", coverTitle: "SẴN SÀNG PHỎNG VẤN\nTỰ TIN BỨT PHÁ", date: "2026-10-18", paragraphs: [
            "Đọc lại mô tả công việc và ghi chú những điểm bạn muốn tìm hiểu thêm. Chuẩn bị các ví dụ cụ thể từ trải nghiệm học tập hoặc làm việc của mình để trình bày rõ cách bạn giải quyết vấn đề.",
            "Tập giới thiệu bản thân ngắn gọn, chọn những kinh nghiệm liên quan nhất và nói rõ vai trò của bạn trong từng tình huống. Nếu chưa biết câu trả lời, hãy chia sẻ cách bạn sẽ tìm hiểu thay vì đoán chắc.",
            "Kiểm tra địa điểm hoặc đường dẫn họp trước buổi phỏng vấn. Chuẩn bị câu hỏi về nhóm, công việc và kỳ vọng của vị trí để đánh giá mức độ phù hợp từ cả hai phía.",
        ] },
    ],
};
