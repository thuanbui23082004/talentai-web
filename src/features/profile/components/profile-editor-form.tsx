"use client";

import { useState } from "react";
import { Controller, useFieldArray, useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { PlusCircle, Sparkles, Trash2 } from "lucide-react";
import { Button, Checkbox, DatePicker, FormField, Input } from "@/components/ui";
import { todayCalendarValue } from "@/lib/calendar";
import { EDUCATION_OPTIONS, LANGUAGE_LEVELS, LANGUAGE_OPTIONS, profileEditorSchema, type ProfileDraftValues } from "../schemas/profile-editor";
import { CertificateUpload, SkillsPicker } from "./profile-editor-widgets";

export function ProfileEditorForm({ initial, onSave, onCancel }: { initial: ProfileDraftValues; onSave: (values: ProfileDraftValues) => void; onCancel: () => void }) {
    const [writingTips, setWritingTips] = useState(false);
    const { register, control, handleSubmit, setValue, formState: { errors } } = useForm<ProfileDraftValues>({ resolver: zodResolver(profileEditorSchema), mode: "onTouched", defaultValues: initial });
    const values = useWatch({ control });
    const { fields, append, remove } = useFieldArray({ control, name: "languages" });
    const section = initial.section;
    const text = (name: "name" | "company" | "position" | "startDate" | "endDate" | "major" | "email" | "phone" | "address" | "birthDate", label: string, options: { required?: boolean; type?: string; placeholder?: string; disabled?: boolean } = {}) => <FormField label={label} required={options.required} error={errors[name]?.message}>{(field) => ["date", "month", "number"].includes(options.type ?? "") ? <Controller name={name} control={control} render={({ field: controlled }) => <DatePicker {...field} ref={controlled.ref} value={controlled.value} onValueChange={controlled.onChange} onBlur={controlled.onBlur} precision={options.type === "number" ? "year" : options.type === "month" ? "month" : "date"} max={name === "birthDate" ? todayCalendarValue() : undefined} disabled={options.disabled} />} /> : <Input {...field} {...register(name)} type={options.type ?? "text"} placeholder={options.placeholder} disabled={options.disabled} maxLength={name === "address" ? 300 : 200} />}</FormField>;
    const description = (label: string, placeholder: string, limit = 3000, required = false) => <FormField label={label} required={required} error={errors.description?.message}>{(field) => <div><textarea {...field} {...register("description")} maxLength={limit} placeholder={placeholder} rows={section === "introduction" ? 6 : 4} className="ui-input h-auto min-h-32 resize-y py-3 leading-6" /><p className="mt-1 text-right text-xs text-muted-foreground">{values.description?.length ?? 0}/{limit}</p></div>}</FormField>;
    return <form noValidate onSubmit={handleSubmit(onSave)} className="flex min-h-0 flex-1 flex-col">
        <div className="min-h-0 flex-1 space-y-5 overflow-y-auto overscroll-contain px-5 pt-6 pb-8 sm:px-8">
            {section === "personal" && <>
                {text("name", "Họ và tên", { required: true, placeholder: "Nhập họ và tên" })}
                <div className="grid gap-5 sm:grid-cols-2">{text("email", "Email", { required: true, type: "email" })}{text("phone", "Số điện thoại", { type: "tel", placeholder: "Nhập số điện thoại" })}</div>
                {text("address", "Địa chỉ hiện tại", { placeholder: "Nhập địa chỉ hiện tại" })}{text("birthDate", "Ngày sinh", { type: "date" })}
            </>}
            {section === "introduction" && <>
                {description("Giới thiệu bản thân", "Hãy chia sẻ kinh nghiệm, kỹ năng và điểm mạnh của bạn.\nVí dụ: 3 năm kinh nghiệm chăm sóc khách hàng, giao tiếp tốt và luôn hướng tới trải nghiệm khách hàng tích cực.", 1000, true)}
                <Button variant="secondary" className="rounded-full" aria-expanded={writingTips} onClick={() => setWritingTips(!writingTips)}><Sparkles />Gợi ý cách viết</Button>
                {writingTips && <div className="space-y-2 rounded-xl border border-primary/15 bg-secondary/40 p-4 text-sm leading-6"><p className="font-medium text-primary">Một đoạn giới thiệu hiệu quả gồm:</p><p>Vị trí và kinh nghiệm → 2–3 kỹ năng nổi bật → thành tựu cụ thể → mục tiêu nghề nghiệp.</p><p className="text-xs text-muted-foreground">Ví dụ tham khảo: “Tôi là [vị trí] với [số năm] kinh nghiệm về [lĩnh vực]. Tôi có thế mạnh về [kỹ năng] và từng đạt [thành tựu]. Tôi mong muốn phát triển tại [môi trường/mục tiêu].”</p></div>}
            </>}
            {section === "experience" && <>
                {text("company", "Tên công ty", { required: true, placeholder: "Nhập tên công ty" })}
                {text("position", "Vị trí công việc", { required: true, placeholder: "Nhập vị trí công việc" })}
                <Checkbox label="Tôi đang làm việc ở đây" {...register("current")} />
                <div className="grid gap-5 sm:grid-cols-2">{text("startDate", "Thời gian bắt đầu", { required: true, type: "month" })}{text("endDate", "Thời gian kết thúc", { required: !values.current, type: "month", disabled: values.current })}</div>
                {description("Mô tả công việc", "Mô tả trách nhiệm, kết quả và thành tựu nổi bật (không bắt buộc)")}
            </>}
            {section === "education" && <>
                {text("name", "Tên trường", { required: true, placeholder: "Nhập tên trường của bạn" })}
                <div className="grid gap-5 sm:grid-cols-2">{text("startDate", "Năm bắt đầu", { required: true, type: "number", placeholder: "YYYY" })}{text("endDate", "Năm kết thúc", { required: true, type: "number", placeholder: "YYYY" })}</div>
                <div className="grid gap-5 sm:grid-cols-2">{text("major", "Chuyên ngành đào tạo", { placeholder: "Nhập chuyên ngành đào tạo" })}<FormField label="Bằng cấp">{(field) => <select {...field} {...register("degree")} className="ui-input"><option value="">Chọn loại bằng cấp</option>{EDUCATION_OPTIONS.map((option) => <option key={option}>{option}</option>)}</select>}</FormField></div>
                {description("Mô tả chi tiết", "Mô tả chi tiết quá trình học tập")}
            </>}
            {section === "skills" && <SkillsPicker selected={values.skills ?? []} onChange={(skills) => setValue("skills", skills, { shouldValidate: true, shouldDirty: true })} error={errors.skills?.message} />}
            {section === "projects" && <>
                {text("name", "Tên dự án/thành tựu", { required: true, placeholder: "Nhập tên dự án/thành tựu" })}
                <div className="grid gap-5 sm:grid-cols-2">{text("startDate", "Thời gian bắt đầu", { required: true, type: "month" })}{text("endDate", "Thời gian kết thúc", { required: true, type: "month" })}</div>
                {description("Mô tả chi tiết", "Mô tả vai trò, kết quả và thành tựu của bạn")}
            </>}
            {section === "certificates" && <>
                {text("name", "Tên chứng chỉ", { required: true, placeholder: "Nhập tên chứng chỉ" })}
                <CertificateUpload file={values.image ?? null} onChange={(image) => setValue("image", image, { shouldValidate: true, shouldDirty: true })} error={errors.image?.message} />
            </>}
            {section === "languages" && <>
                <div className="space-y-5">{fields.map((row, index) => <div key={row.id} className="space-y-3 rounded-xl border border-border/60 p-4 sm:border-0 sm:p-0"><div className="grid gap-4 sm:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_auto]">
                    <FormField label="Tên ngoại ngữ" required error={errors.languages?.[index]?.name?.message}>{(field) => <select {...field} {...register(`languages.${index}.name`)} className="ui-input"><option value="">Chọn ngoại ngữ</option>{LANGUAGE_OPTIONS.map((option) => <option key={option}>{option}</option>)}</select>}</FormField>
                    <fieldset><legend className="ui-label mb-2">Mức độ <span className="text-destructive">*</span></legend><div className="flex min-h-11 flex-wrap items-center gap-1.5">{LANGUAGE_LEVELS.map((level) => <label key={level.value} className={`relative cursor-pointer rounded-full border px-2.5 py-2.5 text-xs transition-colors has-focus-visible:outline-2 has-focus-visible:outline-primary ${values.languages?.[index]?.level === level.value ? "border-primary bg-secondary/50 text-primary" : "border-transparent bg-muted/70 text-muted-foreground"}`}><input type="radio" value={level.value} {...register(`languages.${index}.level`)} className="absolute inset-0 size-full cursor-pointer opacity-0" />{level.label}</label>)}</div></fieldset>
                    {fields.length > 1 && <Button variant="ghost" size="icon" className="sm:mt-7" aria-label={`Xóa ngoại ngữ ${index + 1}`} onClick={() => remove(index)}><Trash2 /></Button>}
                </div></div>)}</div>
                <Button variant="link" disabled={fields.length >= 10} className="px-0" onClick={() => append({ name: "", level: "beginner" })}><PlusCircle />Thêm ngoại ngữ</Button>
                {errors.languages?.root?.message && <p role="alert" className="text-xs text-destructive">{errors.languages.root.message}</p>}
            </>}
        </div>
        <div className="flex shrink-0 items-center justify-end gap-3 border-t border-border/70 bg-card px-5 py-4 sm:px-8"><Button variant="ghost" className="text-primary" onClick={onCancel}>Hủy</Button><Button type="submit">Lưu thông tin</Button></div>
    </form>;
}
