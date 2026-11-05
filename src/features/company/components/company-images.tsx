"use client";

import Image from "next/image";
import { useRef, useState } from "react";
import { Building2, Camera, Globe, ImagePlus, MapPin, Upload, X } from "lucide-react";
import { Button } from "@/components/ui";
import { companyImageFileSchema } from "../schemas/onboarding";

export type CompanyImageSelection = { file: File; preview: string };
export type CompanyImagesValue = { logo: CompanyImageSelection | null; cover: CompanyImageSelection | null };

export function CompanyImagePreview({ name, city, industry, website, logo, cover }: { name: string; city?: string; industry?: string; website?: string; logo?: string; cover?: string }) {
    return <section className="co-brand-preview" aria-label="Xem trước hồ sơ công ty">
        <div className="co-brand-cover">{cover ? <Image src={cover} alt="Ảnh bìa công ty" width={1000} height={300} unoptimized /> : <div className="co-cover-placeholder"><span /><span /><Building2 aria-hidden="true" /><p>Không gian cho câu chuyện thương hiệu của bạn</p></div>}</div>
        <div className="co-brand-content"><div className="co-brand-logo">{logo ? <Image src={logo} alt="Ảnh đại diện công ty" width={96} height={96} unoptimized /> : <Building2 aria-hidden="true" />}</div>
            <div className="co-brand-name"><span className="co-preview-label">Hồ sơ doanh nghiệp</span><h3>{name || "Tên công ty của bạn"}</h3><p>{industry || "Kết nối nhân tài, xây dựng tương lai"}</p></div>
            <div className="co-brand-facts">{city && <span><MapPin aria-hidden="true" />{city}</span>}{website && <span><Globe aria-hidden="true" />{website.replace(/^https?:\/\//i, "").replace(/\/$/, "")}</span>}</div>
        </div>
    </section>;
}

function ImagePicker({ kind, selection, disabled, onChange, onReadingChange }: { kind: "logo" | "cover"; selection: CompanyImageSelection | null; disabled: boolean; onChange: (value: CompanyImageSelection | null) => void; onReadingChange: (busy: boolean) => void }) {
    const input = useRef<HTMLInputElement>(null);
    const [error, setError] = useState("");
    const [reading, setReading] = useState(false);
    const label = kind === "logo" ? "ảnh đại diện" : "ảnh bìa";
    async function choose(file: File) {
        setError("");
        const validated = companyImageFileSchema.safeParse(file);
        if (!validated.success) { setError(validated.error.issues[0].message); return; }
        setReading(true);
        onReadingChange(true);
        try {
            const bitmap = await createImageBitmap(file);
            bitmap.close();
            const preview = await new Promise<string>((resolve, reject) => {
                const reader = new FileReader();
                reader.onload = () => typeof reader.result === "string" ? resolve(reader.result) : reject(new Error("image"));
                reader.onerror = () => reject(new Error("image"));
                reader.readAsDataURL(file);
            });
            onChange({ file, preview });
        } catch { setError("Không đọc được ảnh. Vui lòng chọn ảnh khác."); }
        finally { setReading(false); onReadingChange(false); }
    }
    return <div className="co-image-picker">
        <span className="co-image-picker-icon">{kind === "logo" ? <Camera aria-hidden="true" /> : <ImagePlus aria-hidden="true" />}</span>
        <div><h3>{kind === "logo" ? "Ảnh đại diện công ty" : "Ảnh bìa công ty"}</h3><p>{kind === "logo" ? "Logo vuông, gợi ý 400 × 400 px." : "Ảnh ngang, gợi ý 1.600 × 500 px."}</p><small>PNG, JPG hoặc WebP · Tối đa 2MB</small></div>
        <input ref={input} type="file" accept=".png,.jpg,.jpeg,.webp,image/png,image/jpeg,image/webp" className="sr-only" aria-label={`Chọn ${label}`} disabled={disabled || reading} onChange={event => { const file = event.target.files?.[0]; event.target.value = ""; if (file) void choose(file); }} />
        <div className="co-image-buttons"><Button variant="outline" disabled={disabled || reading} loading={reading} onClick={() => input.current?.click()}><Upload />{selection ? "Đổi ảnh" : `Chọn ${label}`}</Button>{selection && <Button variant="ghost" disabled={disabled || reading} aria-label={`Bỏ ${label}`} onClick={() => { onChange(null); setError(""); }}><X />Bỏ ảnh</Button>}</div>
        {selection && <p className="co-image-filename">{selection.file.name}</p>}
        {error && <p role="alert" className="co-image-error">{error}</p>}
    </div>;
}

export function CompanyImages({ value, onChange, onReadingChange, disabled, name, city, industry, website, logoUrl, coverUrl }: { value: CompanyImagesValue; onChange: (value: CompanyImagesValue) => void; onReadingChange: (busy: boolean) => void; disabled: boolean; name: string; city?: string; industry?: string; website?: string; logoUrl?: string; coverUrl?: string }) {
    return <div className="co-images">
        <div className="co-preview-heading"><span><Camera aria-hidden="true" />Bản xem trước</span><small>Ảnh hiển thị trên hồ sơ công ty</small></div>
        <CompanyImagePreview name={name} city={city} industry={industry} website={website} logo={value.logo?.preview ?? logoUrl} cover={value.cover?.preview ?? coverUrl} />
        <div className="co-image-grid"><ImagePicker kind="logo" selection={value.logo} disabled={disabled} onReadingChange={onReadingChange} onChange={logo => onChange({ ...value, logo })} /><ImagePicker kind="cover" selection={value.cover} disabled={disabled} onReadingChange={onReadingChange} onChange={cover => onChange({ ...value, cover })} /></div>
    </div>;
}
