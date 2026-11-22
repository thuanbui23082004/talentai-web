import type { CSSProperties } from "react";
import type { CVData } from "../types/cv";

export const CV_BACKGROUNDS = ["none", ...Array.from({ length: 15 }, (_, index) => `bg-${String(index + 1).padStart(2, "0")}`)];

export function CvDocument({ data, theme, background, design }: { data: CVData; theme: string; background: string; design: string }) {
    const backgroundIndex = Number(background.slice(3)) || 0;
    const style = { "--cv-primary": theme, "--cv-bg-angle": `${backgroundIndex * 21}deg`, "--cv-bg-color": `hsl(${backgroundIndex * 23} 72% 95%)` } as CSSProperties;
    const skills = data.skills.filter(item => item.name.trim());
    const languages = data.languages.filter(item => item.name.trim());
    const certificates = data.certificates.filter(item => item.name.trim());
    const experience = data.experience.filter(item => item.company.trim() || item.position.trim());
    const education = data.education.filter(item => item.school.trim() || item.degree.trim());
    const projects = data.projects.filter(item => item.name.trim());
    return <article className={`cv-document cv-document-${design} ${background === "none" ? "" : "cv-document-tinted"}`} style={style}>
        <header className="cv-document-header">
            {data.basics.avatarUrl && <img src={data.basics.avatarUrl} alt="Ảnh đại diện" className="cv-document-avatar" />}
            <div><h1>{data.basics.fullName}</h1>{data.basics.title && <p className="cv-document-title">{data.basics.title}</p>}</div>
        </header>
        <div className="cv-document-body">
            <aside className="cv-document-aside">
                {(data.basics.email || data.basics.phone || data.basics.address) && <section><h2>Liên hệ</h2>{data.basics.email && <p>{data.basics.email}</p>}{data.basics.phone && <p>{data.basics.phone}</p>}{data.basics.address && <p>{data.basics.address}</p>}</section>}
                {!!skills.length && <section><h2>Kỹ năng</h2>{skills.map((item, index) => <div key={index}><p>{item.name}</p><div className="cv-document-skill"><i style={{ width: `${Math.max(0, Math.min(100, item.level || 0))}%` }} /></div></div>)}</section>}
                {!!languages.length && <section><h2>Ngoại ngữ</h2>{languages.map((item, index) => <p key={index}>{item.name}{item.level && ` · ${item.level}`}</p>)}</section>}
                {!!certificates.length && <section><h2>Chứng chỉ</h2>{certificates.map((item, index) => <div className="cv-document-entry" key={index}><strong>{item.name}</strong>{item.issuer && <p>{item.issuer}</p>}{item.date && <small>{item.date}</small>}</div>)}</section>}
            </aside>
            <main className="cv-document-main">
                {data.basics.summary && <section><h2>Giới thiệu</h2><p>{data.basics.summary}</p></section>}
                {!!experience.length && <section><h2>Kinh nghiệm làm việc</h2>{experience.map((item, index) => <div className="cv-document-entry" key={index}><strong>{item.position || item.company}</strong><p>{item.company}{item.company && item.position && " · "}{item.startDate} {item.endDate ? `– ${item.endDate}` : item.current ? "– Hiện tại" : ""}</p>{item.description && <p>{item.description}</p>}</div>)}</section>}
                {!!education.length && <section><h2>Học vấn</h2>{education.map((item, index) => <div className="cv-document-entry" key={index}><strong>{item.school || item.degree}</strong><p>{item.degree}</p><small>{[item.startDate, item.endDate].filter(Boolean).join(" – ")}</small>{item.description && <p>{item.description}</p>}</div>)}</section>}
                {!!projects.length && <section><h2>Dự án</h2>{projects.map((item, index) => <div className="cv-document-entry" key={index}><strong>{item.name}</strong>{item.role && <p>{item.role}</p>}{item.link && <p>{item.link}</p>}{item.description && <p>{item.description}</p>}</div>)}</section>}
            </main>
        </div>
    </article>;
}
