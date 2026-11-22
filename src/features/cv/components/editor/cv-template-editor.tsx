"use client";

import { useEffect, useRef, useState } from "react";
import { useFieldArray, useForm, useWatch } from "react-hook-form";
import { ArrowLeft, Download, GripVertical, Plus, Save, Trash2 } from "lucide-react";
import { Button, useToast } from "@/components/ui";
import type { CVData, CVPayload } from "../../types/cv";
import { CV_BACKGROUNDS } from "../../templates/cv-document";
import { getCvTemplate } from "../../templates/registry";
import { saveTemplateCv } from "../../services/cv-api";
import { CvPreview } from "./cv-preview";

const colors = ["#EC8F00", "#1BAEE6", "#6525C5", "#218574", "#B4535D"];
const fieldLabels: Record<string, string> = { company: "Công ty", position: "Vị trí", startDate: "Bắt đầu", endDate: "Kết thúc", description: "Mô tả", school: "Trường", degree: "Bằng cấp", name: "Tên", level: "Mức độ", role: "Vai trò", link: "Liên kết", issuer: "Đơn vị cấp", date: "Ngày cấp" };
const empty = {
    education: { school: "", degree: "", startDate: "", endDate: "", description: "" },
    experience: { company: "", position: "", startDate: "", endDate: "", current: false, description: "" },
    skills: { name: "", level: 80 },
    projects: { name: "", role: "", link: "", description: "" },
    certificates: { name: "", issuer: "", date: "" },
    languages: { name: "", level: "" },
};

export function CvTemplateEditor({ templateId, initial, onClose }: { templateId: string; initial: CVData; onClose: () => void }) {
    const { register, control, handleSubmit, setValue, reset, formState: { errors, isDirty } } = useForm<CVData>({ defaultValues: initial, mode: "onChange" });
    const data = useWatch({ control }) as CVData;
    const education = useFieldArray({ control, name: "education" });
    const experience = useFieldArray({ control, name: "experience" });
    const skills = useFieldArray({ control, name: "skills" });
    const projects = useFieldArray({ control, name: "projects" });
    const certificates = useFieldArray({ control, name: "certificates" });
    const languages = useFieldArray({ control, name: "languages" });
    const [color, setColor] = useState("#EC8F00");
    const [background, setBackground] = useState("none");
    const [mobileTab, setMobileTab] = useState<"edit" | "preview">("edit");
    const [saving, setSaving] = useState(false);
    const [pdfing, setPdfing] = useState(false);
    const [savedTheme, setSavedTheme] = useState({ color: "#EC8F00", background: "none" });
    const printRef = useRef<HTMLDivElement>(null);
    const { toast } = useToast();
    const Template = getCvTemplate(templateId).component;
    const validColor = /^#[0-9a-fA-F]{6}$/.test(color);
    const dirty = isDirty || color !== savedTheme.color || background !== savedTheme.background;
    useEffect(() => {
        const warn = (event: BeforeUnloadEvent) => { if (dirty) event.preventDefault(); };
        window.addEventListener("beforeunload", warn);
        return () => window.removeEventListener("beforeunload", warn);
    }, [dirty]);
    const close = () => { if (!dirty || window.confirm("CV có thay đổi chưa lưu. Bạn muốn rời editor?")) onClose(); };
    const save = handleSubmit(async values => {
        if (!validColor) { toast({ title: "Mã màu không hợp lệ", description: "Nhập mã hex gồm 6 chữ số.", variant: "error" }); return; }
        setSaving(true);
        const payload: CVPayload = { templateId, theme: { primaryColor: color, backgroundId: background }, data: values, updatedAt: new Date().toISOString() };
        try { await saveTemplateCv(payload); reset(values); setSavedTheme({ color, background }); toast({ title: "Đã lưu bản nháp CV" }); }
        catch { toast({ title: "Lưu CV thất bại", description: "Vui lòng thử lại.", variant: "error" }); }
        finally { setSaving(false); }
    });
    const pdf = async () => {
        const documentElement = printRef.current?.querySelector<HTMLElement>(".cv-document");
        if (!documentElement || pdfing) return;
        const safeName = (data.basics.fullName || "UngVien").replace(/Đ/g, "D").replace(/đ/g, "d").normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-zA-Z0-9]+/g, "_").replace(/^_+|_+$/g, "");
        const filename = `CV_${safeName}_${new Date().toLocaleDateString("sv-SE")}.pdf`;
        try {
            setPdfing(true);
            await document.fonts.ready;
            // html2pdf làm tròn 297mm lên thêm một pixel và tạo trang trắng cuối.
            documentElement.style.minHeight = "296mm";
            documentElement.style.boxShadow = "none";
            const { default: html2pdf } = await import("html2pdf.js");
            const options = { filename, margin: 0, image: { type: "jpeg", quality: 0.98 }, html2canvas: { scale: 2, useCORS: true, backgroundColor: "#ffffff" }, pagebreak: { mode: ["css", "legacy"], avoid: ".cv-document-entry" }, jsPDF: { unit: "mm", format: "a4", orientation: "portrait" } } as const;
            await html2pdf().set(options).from(documentElement).save();
        } catch { toast({ title: "Không thể tải PDF", description: "Vui lòng thử lại.", variant: "error" }); }
        finally { documentElement.style.minHeight = ""; documentElement.style.boxShadow = ""; setPdfing(false); }
    };
    const input = "min-h-10 w-full rounded-lg border border-border bg-card px-3 text-sm focus-visible:outline-primary";
    const basic = (name: keyof CVData["basics"], label: string, required = false) => <label className="block space-y-1 text-xs font-medium" key={name}><span>{label}</span><input className={input} aria-invalid={!!errors.basics?.[name]} {...register(`basics.${name}`, { required: required ? `Vui lòng nhập ${label.toLowerCase()}.` : false, validate: name === "email" ? value => !value || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value) || "Email chưa đúng định dạng." : undefined })} />{errors.basics?.[name] && <span role="alert" className="text-destructive">{errors.basics[name]?.message}</span>}</label>;
    const section = (title: string, key: keyof typeof empty, fields: { id: string }[], append: (value: never) => void, remove: (index: number) => void, move: (from: number, to: number) => void, names: string[]) => <details open className="rounded-xl border border-border bg-card p-3"><summary className="cursor-pointer font-semibold">{title} ({fields.length})</summary><div className="mt-3 space-y-3">{fields.map((field, index) => <div key={field.id} draggable onDragStart={event => event.dataTransfer.setData("text/plain", String(index))} onDragOver={event => event.preventDefault()} onDrop={event => { event.preventDefault(); const from = Number(event.dataTransfer.getData("text/plain")); if (Number.isInteger(from) && from >= 0 && from < fields.length) move(from, index); }} className="rounded-lg border border-border/70 p-3"><div className="mb-2 flex items-center justify-between text-muted-foreground"><GripVertical className="size-4" aria-label="Kéo để sắp xếp" /><button type="button" onClick={() => remove(index)} aria-label={`Xóa ${title} ${index + 1}`}><Trash2 className="size-4" /></button></div><div className="grid gap-2">{names.map(name => <label key={name} className="text-xs"><span>{fieldLabels[name] ?? name}</span><input type={name === "level" ? "number" : "text"} min={name === "level" ? 0 : undefined} max={name === "level" ? 100 : undefined} className={input} {...register(`${key}.${index}.${name}` as never, name === "level" ? { valueAsNumber: true } : undefined)} /></label>)}{key === "experience" && <label className="flex items-center gap-2 text-xs"><input type="checkbox" {...register(`experience.${index}.current`)} /> Đang làm việc</label>}</div></div>)}<Button type="button" variant="outline" onClick={() => append(empty[key] as never)}><Plus className="size-4" /> Thêm mục</Button></div></details>;
    return <div className="fixed inset-0 z-[70] overflow-auto bg-background">
        <header className="sticky top-0 z-10 flex flex-wrap items-center gap-2 border-b border-border bg-card px-4 py-3"><Button variant="outline" onClick={close}><ArrowLeft className="size-4" /> Trở lại</Button><strong className="mr-auto">Chỉnh sửa CV</strong><Button variant="outline" loading={pdfing} onClick={pdf}><Download className="size-4" /> Tải PDF</Button><Button loading={saving} onClick={() => void save()}><Save className="size-4" /> Lưu</Button></header>
        <div className="flex gap-2 p-3 lg:hidden"><Button variant={mobileTab === "edit" ? "default" : "outline"} onClick={() => setMobileTab("edit")}>Chỉnh sửa</Button><Button variant={mobileTab === "preview" ? "default" : "outline"} onClick={() => setMobileTab("preview")}>Xem trước</Button></div>
        <div className="grid gap-6 p-4 lg:grid-cols-[minmax(300px,420px)_minmax(0,1fr)]">
            <form onSubmit={save} className={`${mobileTab === "preview" ? "hidden lg:block" : ""} max-h-[calc(100dvh-6rem)] space-y-3 overflow-y-auto pr-2`}><details open className="rounded-xl border border-border bg-card p-3"><summary className="cursor-pointer font-semibold">Thông tin cá nhân</summary><div className="mt-3 grid gap-3">{basic("fullName", "Họ tên", true)}{!data.basics.fullName && <p className="text-xs text-warning-foreground">Hãy thêm họ tên để CV đầy đủ hơn.</p>}{basic("title", "Chức danh")}{basic("email", "Email")}{basic("phone", "Số điện thoại")}{!data.basics.email && !data.basics.phone && <p className="text-xs text-warning-foreground">Nên thêm email hoặc số điện thoại.</p>}{basic("address", "Địa chỉ")}<label className="text-xs">Giới thiệu<textarea className={`${input} min-h-24 py-2`} {...register("basics.summary")} /></label><label className="text-xs">Ảnh đại diện<input type="file" accept="image/png,image/jpeg,image/webp" className="mt-1 block w-full text-xs" onChange={event => { const file = event.target.files?.[0]; if (!file) return; if (file.size > 1_000_000) { toast({ title: "Ảnh tối đa 1 MB", variant: "error" }); return; } const reader = new FileReader(); reader.onload = () => setValue("basics.avatarUrl", String(reader.result), { shouldDirty: true }); reader.readAsDataURL(file); }} /></label></div></details>
            {section("Kinh nghiệm", "experience", experience.fields, experience.append as never, experience.remove, experience.move, ["company", "position", "startDate", "endDate", "description"])}
            {section("Học vấn", "education", education.fields, education.append as never, education.remove, education.move, ["school", "degree", "startDate", "endDate", "description"])}
            {section("Kỹ năng", "skills", skills.fields, skills.append as never, skills.remove, skills.move, ["name", "level"])}
            {section("Dự án", "projects", projects.fields, projects.append as never, projects.remove, projects.move, ["name", "role", "link", "description"])}
            {section("Chứng chỉ", "certificates", certificates.fields, certificates.append as never, certificates.remove, certificates.move, ["name", "issuer", "date"])}
            {section("Ngoại ngữ", "languages", languages.fields, languages.append as never, languages.remove, languages.move, ["name", "level"])}
            <details open className="rounded-xl border border-border bg-card p-3"><summary className="cursor-pointer font-semibold">Màu và nền</summary><div className="mt-3 space-y-3"><input type="color" aria-label="Chọn màu chủ đề" value={color} onChange={event => setColor(event.target.value)} /><input className={input} aria-label="Mã màu hex" value={color} onChange={event => { if (/^#[0-9a-fA-F]{0,6}$/.test(event.target.value)) setColor(event.target.value); }} />{!/^#[0-9a-fA-F]{6}$/.test(color) && <p className="text-xs text-destructive">Mã màu cần có 6 chữ số hex.</p>}<div className="flex gap-2">{colors.map(item => <button type="button" key={item} title={item} aria-label={`Chọn màu ${item}`} onClick={() => setColor(item)} className="size-9 rounded-full border-2 border-card ring-1 ring-border" style={{ backgroundColor: item }} />)}</div><div className="grid grid-cols-4 gap-2">{CV_BACKGROUNDS.map(id => <button type="button" key={id} onClick={() => setBackground(id)} aria-pressed={background === id} className="min-h-12 rounded-lg border border-border text-[10px] aria-pressed:ring-2 aria-pressed:ring-primary" style={{ background: id === "none" ? "white" : `linear-gradient(${Number(id.slice(3)) * 21}deg,white,${color}22)` }}>{id === "none" ? "✓ Không nền" : id}</button>)}</div></div></details></form>
            <CvPreview data={data} templateId={templateId} theme={validColor ? color : "#EC8F00"} background={background} hidden={mobileTab === "edit"} />
        </div>
        <div ref={printRef} className="cv-print-root fixed -left-[10000px] top-0"><Template data={data} theme={validColor ? color : "#EC8F00"} background={background} /></div>
    </div>;
}
