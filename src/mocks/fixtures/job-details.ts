import type { components } from "@/lib/api/generated/schema";

export const createMockJobDetails = (jobs: components["schemas"]["JobSummary"][]): components["schemas"]["JobDetail"][] => jobs.map((job) => ({
    ...job,
    description: (job.skills?.includes("Node.js") ? [
        "Tham gia phát triển các ứng dụng web phục vụ doanh nghiệp, xây dựng trải nghiệm người dùng hiệu quả và hệ thống backend có khả năng mở rộng.",
        "Thiết kế và phát triển ứng dụng fullstack với Node.js ở backend và JavaScript ở frontend.",
        "Xây dựng, tối ưu REST API và tích hợp các dịch vụ, đảm bảo hiệu suất và bảo mật hệ thống.",
        "Phân tích yêu cầu, thiết kế cơ sở dữ liệu và tối ưu truy vấn cho các tính năng sản phẩm.",
        "Phối hợp cùng đội ngũ thiết kế, Product và QA để đưa tính năng vào sử dụng.",
        "Tham gia code review, viết kiểm thử và chia sẻ kiến thức kỹ thuật trong nhóm.",
        "Theo dõi hệ thống, xử lý sự cố và cải tiến quy trình triển khai sản phẩm.",
    ] : [
        `Đảm nhận vị trí ${job.title} tại ${job.company.name}, phối hợp cùng đội ngũ để phát triển sản phẩm và nâng cao chất lượng dịch vụ.`,
        "Tiếp nhận yêu cầu, lập kế hoạch và triển khai công việc theo mục tiêu của bộ phận.",
        "Chủ động đề xuất cải tiến quy trình, đảm bảo tiến độ và chất lượng công việc.",
        "Phối hợp với các bộ phận liên quan, báo cáo kết quả và chia sẻ kiến thức trong nhóm.",
    ]).join("\n"),
    requirements: [
        job.minExperienceYears ? `Có từ ${job.minExperienceYears} năm kinh nghiệm ở vị trí tương đương.` : "Chào đón ứng viên mới tốt nghiệp, có tinh thần học hỏi.",
        `Có kiến thức và kinh nghiệm với ${(job.skills ?? []).join(", ")}.`,
        "Có khả năng giải quyết vấn đề, làm việc độc lập và phối hợp hiệu quả với đồng nghiệp.",
        "Chủ động, có trách nhiệm và sẵn sàng tiếp thu phản hồi để phát triển chuyên môn.",
    ].join("\n"),
    benefits: "Mức lương cạnh tranh, được trao đổi theo năng lực trong buổi phỏng vấn.\nTham gia bảo hiểm và nghỉ phép theo quy định.\nĐược hỗ trợ đào tạo, phát triển kỹ năng và định hướng nghề nghiệp.\nMôi trường làm việc cởi mở, khuyến khích sáng kiến và hợp tác.",
    educationLevel: "bachelor",
    headcount: 2,
    hiringRounds: ["Xét duyệt hồ sơ", "Phỏng vấn chuyên môn", "Trao đổi với nhà tuyển dụng"],
}));
