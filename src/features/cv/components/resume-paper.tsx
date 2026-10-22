import { Mail, MapPin, Phone, UserRound } from "lucide-react";
import type { CvDesign } from "../presentation";

function PaperSection({ title, children }: { title: string; children: React.ReactNode }) {
    return <section className="cv-paper-section"><h3>{title}</h3>{children}</section>;
}

export function ResumePaper({ design, person, position = "Nhân viên kinh doanh", introduction = "Tôi mong muốn làm việc trong môi trường chuyên nghiệp, phát huy kỹ năng và đóng góp vào sự phát triển của doanh nghiệp." }: { design: CvDesign; person: string; position?: string; introduction?: string }) {
    return <div className={`cv-paper cv-paper-${design}`}>
        <header className="cv-paper-header"><div className="cv-paper-avatar"><UserRound aria-hidden="true" /></div><div><h2>{person}</h2><p>{position}</p><span>CHỦ ĐỘNG · TẬN TÂM · PHÁT TRIỂN</span></div></header>
        <aside className="cv-paper-sidebar">
            <div className="cv-paper-sidebar-avatar"><UserRound aria-hidden="true" /></div>
            <PaperSection title="Liên hệ"><p><Phone />090 000 0000</p><p><Mail />ungvien@example.com</p><p><MapPin />Đà Nẵng, Việt Nam</p></PaperSection>
            <PaperSection title="Học vấn"><strong>ĐẠI HỌC KINH TẾ</strong><p>Quản trị kinh doanh</p><p>2020 – 2024</p><p>Tốt nghiệp loại Giỏi</p></PaperSection>
            <PaperSection title="Kỹ năng"><p>Giao tiếp & đàm phán</p><div className="cv-skill-track"><i /></div><p>Chăm sóc khách hàng</p><div className="cv-skill-track"><i /></div><p>Làm việc nhóm</p><div className="cv-skill-track"><i /></div></PaperSection>
            <PaperSection title="Ngoại ngữ"><p>Tiếng Anh — Khá</p><p>Tin học văn phòng</p></PaperSection>
            <PaperSection title="Sở thích"><p>Đọc sách, du lịch</p><p>Kết nối cộng đồng</p></PaperSection>
        </aside>
        <div className="cv-paper-main">
            <PaperSection title="Mục tiêu nghề nghiệp"><p>{introduction}</p></PaperSection>
            <PaperSection title="Kinh nghiệm làm việc"><strong>CÔNG TY GIẢI PHÁP THƯƠNG MẠI</strong><p className="cv-paper-date">Nhân viên kinh doanh · 2024 – Hiện tại</p><ul><li>Tìm hiểu nhu cầu và tư vấn giải pháp phù hợp cho khách hàng.</li><li>Phát triển, duy trì quan hệ và chăm sóc khách hàng hiện tại.</li><li>Phối hợp với các bộ phận để triển khai kế hoạch kinh doanh.</li><li>Theo dõi kết quả, báo cáo và đề xuất cải thiện quy trình.</li></ul><strong>CÔNG TY DỊCH VỤ SÁNG TẠO</strong><p className="cv-paper-date">Thực tập sinh kinh doanh · 2023 – 2024</p><ul><li>Hỗ trợ nghiên cứu thị trường và tổng hợp thông tin.</li><li>Chuẩn bị tài liệu và tham gia tư vấn khách hàng.</li><li>Hoàn thành công việc theo kế hoạch của nhóm.</li></ul></PaperSection>
            <PaperSection title="Dự án nổi bật"><strong>KẾT NỐI KHÁCH HÀNG</strong><p>Xây dựng kế hoạch truyền thông, kết nối khách hàng và phối hợp tổ chức các hoạt động giới thiệu sản phẩm.</p></PaperSection>
            <PaperSection title="Chứng chỉ & thành tích"><p>Chứng chỉ kỹ năng giao tiếp chuyên nghiệp</p><p>Thành viên tích cực trong hoạt động cộng đồng</p></PaperSection>
        </div>
    </div>;
}
