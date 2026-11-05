"use client";

import { useState } from "react";
import { Controller, FormProvider, useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Sparkles } from "lucide-react";
import { Alert, Button, Checkbox, DatePicker, FormField, Input } from "@/components/ui";
import { ApiError } from "@/lib/api/errors";
import { profileEditorSchema, type ProfileDraftValues } from "../schemas/profile-editor";
import { SkillsPicker } from "./profile-editor-widgets";
import { isRemoteSection } from "../personal-mapping";
import { PersonalProfileFields } from "./personal-profile-fields";

export function ProfileEditorForm({ initial, onSave, onCancel }: { initial: ProfileDraftValues; onSave: (values: ProfileDraftValues) => Promise<void>; onCancel: () => void }) {
    const [writingTips, setWritingTips] = useState(false);
    const [saveError, setSaveError] = useState("");
    const form = useForm<ProfileDraftValues>({ resolver: zodResolver(profileEditorSchema), mode: "onTouched", defaultValues: initial });
    const { register, control, handleSubmit, setValue, setError, formState: { errors, isSubmitting } } = form;
    const values = useWatch({ control });
    const section = initial.section;
    const text = (name: "name" | "company" | "position" | "startDate" | "endDate" | "major" | "degree" | "address", label: string, options: { required?: boolean; type?: string; placeholder?: string; disabled?: boolean } = {}) => <FormField label={label} required={options.required} error={errors[name]?.message}>{(field) => ["date", "month", "number"].includes(options.type ?? "") ? <Controller name={name} control={control} render={({ field: controlled }) => <DatePicker {...field} ref={controlled.ref} value={controlled.value} onValueChange={controlled.onChange} onBlur={controlled.onBlur} precision={options.type === "number" ? "year" : options.type === "month" ? "month" : "date"} disabled={options.disabled || isSubmitting} />} /> : <Input {...field} {...register(name)} type={options.type ?? "text"} placeholder={options.placeholder} disabled={options.disabled || isSubmitting} maxLength={["major", "degree"].includes(name) ? 150 : 200} />}</FormField>;
    const description = (label: string, placeholder: string, limit = 3000, required = false) => <FormField label={label} required={required} error={errors.description?.message}>{(field) => <div><textarea {...field} {...register("description")} maxLength={limit} placeholder={placeholder} rows={section === "introduction" ? 6 : 4} className="ui-input h-auto min-h-32 resize-y py-3 leading-6" /><p className="mt-1 text-right text-xs text-muted-foreground">{values.description?.length ?? 0}/{limit}</p></div>}</FormField>;
    const submit = handleSubmit(async values => {
        setSaveError("");
        try { await onSave(values); }
        catch (error) {
            setSaveError(error instanceof ApiError ? error.message : "Không thể lưu thông tin. Vui lòng thử lại; nội dung đã nhập vẫn được giữ.");
            const names: Record<string, string> = { fullName: "name", dob: "birthDate", summary: "description", address: section === "personal" ? "location" : "address", title: "position", location: section === "personal" ? "location" : "address", school: "name", fieldOfStudy: "major", isStudying: "current", issuedAt: "startDate", expiresAt: "endDate" };
            if (error instanceof ApiError) for (const issue of error.fieldErrors ?? []) {
                const field = names[issue.field] ?? issue.field.split(/[.\[]/)[0];
                if (Object.hasOwn(initial, field)) setError(field as keyof ProfileDraftValues, { type: "server", message: issue.message });
            }
        }
    });
    return <FormProvider {...form}><form noValidate onSubmit={submit} className="flex min-h-0 flex-1 flex-col" aria-busy={isSubmitting}>
        <fieldset disabled={isSubmitting} className="min-h-0 min-w-0 flex-1 space-y-5 overflow-y-auto overscroll-contain px-5 pt-6 pb-8 sm:px-8">
            {!isRemoteSection(section) && <p className="text-xs text-muted-foreground">Mục này là bản xem trước, chưa được lưu lên tài khoản.</p>}
            {section === "personal" && <PersonalProfileFields />}
            {section === "introduction" && <>
                {description("Giới thiệu bản thân", "Hãy chia sẻ kinh nghiệm, kỹ năng và điểm mạnh của bạn.\nVí dụ: 3 năm kinh nghiệm chăm sóc khách hàng, giao tiếp tốt và luôn hướng tới trải nghiệm khách hàng tích cực.", 5000, true)}
                <Button variant="secondary" className="rounded-full" aria-expanded={writingTips} onClick={() => setWritingTips(!writingTips)}><Sparkles />Gợi ý cách viết</Button>
                {writingTips && <div className="space-y-2 rounded-xl border border-primary/15 bg-secondary/40 p-4 text-sm leading-6"><p className="font-medium text-primary">Một đoạn giới thiệu hiệu quả gồm:</p><p>Vị trí và kinh nghiệm → 2–3 kỹ năng nổi bật → thành tựu cụ thể → mục tiêu nghề nghiệp.</p><p className="text-xs text-muted-foreground">Ví dụ tham khảo: “Tôi là [vị trí] với [số năm] kinh nghiệm về [lĩnh vực]. Tôi có thế mạnh về [kỹ năng] và từng đạt [thành tựu]. Tôi mong muốn phát triển tại [môi trường/mục tiêu].”</p></div>}
            </>}
            {section === "experience" && <>
                {text("company", "Tên công ty", { required: true, placeholder: "Nhập tên công ty" })}
                {text("position", "Vị trí công việc", { required: true, placeholder: "Nhập vị trí công việc" })}
                {text("address", "Địa điểm làm việc", { placeholder: "Ví dụ: Đà Nẵng (Hybrid)" })}
                <Checkbox label="Tôi đang làm việc ở đây" {...register("current")} />
                <div className="grid gap-5 sm:grid-cols-2">{text("startDate", "Thời gian bắt đầu", { type: "date" })}{text("endDate", "Thời gian kết thúc", { type: "date", disabled: values.current })}</div>
                {description("Mô tả công việc", "Mô tả trách nhiệm, kết quả và thành tựu nổi bật (không bắt buộc)", 4000)}
            </>}
            {section === "education" && <>
                {text("name", "Tên trường", { required: true, placeholder: "Nhập tên trường của bạn" })}
                <Checkbox label="Tôi đang học ở đây" {...register("current")} disabled={isSubmitting} />
                <div className="grid gap-5 sm:grid-cols-2">{text("startDate", "Thời gian bắt đầu", { type: "date" })}{text("endDate", "Thời gian kết thúc", { type: "date", disabled: values.current })}</div>
                <div className="grid gap-5 sm:grid-cols-2">{text("major", "Chuyên ngành đào tạo", { placeholder: "Nhập chuyên ngành đào tạo" })}{text("degree", "Bằng cấp", { placeholder: "Ví dụ: Kỹ sư Công nghệ thông tin" })}</div>
                {description("Mô tả chi tiết", "Mô tả chi tiết quá trình học tập", 2000)}
            </>}
            {section === "skills" && <SkillsPicker selected={values.skills ?? []} onChange={(skills) => setValue("skills", skills, { shouldValidate: true, shouldDirty: true })} error={errors.skills?.message} />}
            {section === "projects" && <>
                {text("name", "Tên dự án/thành tựu", { required: true, placeholder: "Nhập tên dự án/thành tựu" })}
                <div className="grid gap-5 sm:grid-cols-2">{text("startDate", "Thời gian bắt đầu", { required: true, type: "month" })}{text("endDate", "Thời gian kết thúc", { required: true, type: "month" })}</div>
                {description("Mô tả chi tiết", "Mô tả vai trò, kết quả và thành tựu của bạn")}
            </>}
            {saveError && <Alert variant="error" title="Chưa thể lưu hồ sơ">{saveError}</Alert>}
        </fieldset>
        <div className="flex shrink-0 items-center justify-end gap-3 border-t border-border/70 bg-card px-5 py-4 sm:px-8"><Button variant="ghost" className="text-primary" disabled={isSubmitting} onClick={onCancel}>Hủy</Button><Button type="submit" loading={isSubmitting}>Lưu thông tin</Button></div>
    </form></FormProvider>;
}
