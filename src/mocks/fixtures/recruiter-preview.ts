// Dữ liệu doanh nghiệp giả, chỉ phục vụ bản xem trước giao diện Recruiter.
type RecruiterPreviewJobSummary = {
  id: string; title: string; company: string; initials: string; location: string;
  salary: string; experience: number; hours: number; applicants: number;
  type: 'fullTime' | 'partTime'; status: 'open' | 'draft';
};

export type RecruiterPreviewJob = RecruiterPreviewJobSummary & {
  description: string[];
  requirements: string[];
  benefits: string[];
  createdDateLabel: string;
  recruitmentPeriodLabel: string;
  headcount: number;
  viewCount: number;
};

const previewJobSummaries: RecruiterPreviewJobSummary[] = [
  { id: 'preview-1', title: 'Senior Fullstack Developer (Node.js)', company: 'Công ty Công nghệ Sao Mai', initials: 'SM', location: 'TP. Hồ Chí Minh', salary: '25 – 40 triệu', experience: 4, hours: 2, applicants: 120, type: 'fullTime', status: 'open' },
  { id: 'preview-2', title: 'Nhân viên Triển khai Phần mềm', company: 'Công ty Giải pháp Mây Xanh', initials: 'MX', location: 'Hà Nội', salary: '8 – 15 triệu', experience: 0, hours: 2, applicants: 75, type: 'fullTime', status: 'open' },
  { id: 'preview-3', title: 'Web Developer (React.js)', company: 'Công ty Công nghệ Sao Mai', initials: 'SM', location: 'TP. Hồ Chí Minh', salary: 'negotiable', experience: 1, hours: 5, applicants: 68, type: 'partTime', status: 'open' },
  { id: 'preview-4', title: 'Full Stack JavaScript Developer', company: 'Công ty Sáng tạo Cánh Diều', initials: 'CD', location: 'Đà Nẵng', salary: '10 – 20 triệu', experience: 2, hours: 8, applicants: 42, type: 'fullTime', status: 'open' },
  { id: 'preview-5', title: 'Nhân viên Thiết kế Đồ họa', company: 'Công ty Sáng tạo Cánh Diều', initials: 'CD', location: 'Hà Nội', salary: '12 – 18 triệu', experience: 1, hours: 10, applicants: 75, type: 'partTime', status: 'open' },
  { id: 'preview-6', title: 'Trưởng phòng Kinh doanh', company: 'Công ty Giải pháp Mây Xanh', initials: 'MX', location: 'TP. Hồ Chí Minh', salary: '25 – 40 triệu', experience: 4, hours: 12, applicants: 36, type: 'fullTime', status: 'open' },
  { id: 'preview-7', title: 'Senior Frontend Engineer (React/Vue)', company: 'Công ty Công nghệ Bình Minh', initials: 'BM', location: 'TP. Hồ Chí Minh', salary: '25 – 40 triệu', experience: 4, hours: 14, applicants: 54, type: 'fullTime', status: 'open' },
  { id: 'preview-8', title: 'Product Designer', company: 'Công ty Công nghệ Bình Minh', initials: 'BM', location: 'Đà Nẵng', salary: '18 – 25 triệu', experience: 2, hours: 16, applicants: 28, type: 'fullTime', status: 'open' },
  { id: 'preview-9', title: 'Chuyên viên Nhân sự', company: 'Công ty Công nghệ Sao Mai', initials: 'SM', location: 'Hà Nội', salary: '12 – 18 triệu', experience: 2, hours: 20, applicants: 32, type: 'fullTime', status: 'open' },
];

export const recruiterPreviewJobs: RecruiterPreviewJob[] = previewJobSummaries.map((job, index) => ({
  ...job,
  description: [
    `Đảm nhận vị trí ${job.title} tại ${job.company}, tham gia triển khai kế hoạch và mục tiêu của đội ngũ.`,
    'Phối hợp với các bộ phận liên quan để hoàn thành công việc, đảm bảo chất lượng và tiến độ đã thống nhất.',
    'Chủ động đề xuất giải pháp cải tiến quy trình, báo cáo kết quả và trao đổi các vấn đề phát sinh với quản lý trực tiếp.',
  ],
  requirements: [
    `Có kiến thức chuyên môn phù hợp với vị trí ${job.title}.`,
    ...(job.experience > 0 ? [`Có ít nhất ${job.experience} năm kinh nghiệm ở vị trí tương đương.`] : ['Chào đón ứng viên mới, có tinh thần học hỏi và chủ động trong công việc.']),
    'Có khả năng làm việc nhóm, giao tiếp rõ ràng và giải quyết vấn đề.',
    'Có trách nhiệm với công việc, sẵn sàng học hỏi và phát triển kỹ năng chuyên môn.',
  ],
  benefits: [
    'Môi trường làm việc cởi mở, hỗ trợ học tập và phát triển chuyên môn.',
    'Được cung cấp thiết bị làm việc và tham gia hoạt động nội bộ của doanh nghiệp.',
    'Được trao đổi về lộ trình phát triển và đánh giá kết quả công việc định kỳ.',
  ],
  createdDateLabel: '01 Tháng 10, 2026',
  recruitmentPeriodLabel: '01 Tháng 10, 2026 – 31 Tháng 12, 2026',
  headcount: index % 3 + 1,
  viewCount: 150 + index * 37,
}));
