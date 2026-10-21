import type { components } from "@/lib/api/generated/schema";

export function createMockCompanies(jobs: components["schemas"]["JobSummary"][]): components["schemas"]["CompanyPublic"][] {
    return jobs.map((job, index) => ({
        id: job.company.id,
        name: job.company.name.replace("Công ty mẫu ", ""),
        city: job.location.city,
        address: [job.location.ward, job.location.city].filter(Boolean).join(", "),
        isVerified: index % 3 !== 1,
        size: (["11-50", "51-200", "201-500", "501-1000", "1000+"] as const)[index % 5],
        industries: [{ id: `30000000-0000-4000-8000-00000000000${index % 3 + 1}`, name: ["Công nghệ thông tin", "Tài chính - Ngân hàng", "Dịch vụ - Thương mại"][index % 3] }],
        description: `${job.company.name.replace("Công ty mẫu ", "")} xây dựng môi trường làm việc cởi mở, tạo điều kiện phát triển chuyên môn và kết nối những người có cùng đam mê.`,
        openJobsCount: jobs.filter((item) => item.company.id === job.company.id && item.status === "open").length,
    }));
}
