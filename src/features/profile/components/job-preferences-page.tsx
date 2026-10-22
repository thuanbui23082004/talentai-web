"use client";

import { useState, type ReactNode } from "react";
import { Controller, useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { CheckCircle2, ChevronUp, SlidersHorizontal } from "lucide-react";
import { Button, Checkbox, FormField, Input, MultiSelect, Select } from "@/components/ui";
import { INITIAL_JOB_PREFERENCES, jobPreferencesDraftSchema, type JobPreferencesDraft } from "../schemas/job-preferences";
import { PREFERENCE_EXPERIENCE, PREFERENCE_INDUSTRIES, PREFERENCE_LEVELS, PREFERENCE_LOCATIONS, PREFERENCE_WORK_TYPES } from "../job-preference-options";

function FieldLabel({ children, hint, required }: { children: ReactNode; hint?: string; required?: boolean }) {
    return <span className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1"><span>{children}{required && <span className="ml-1 text-destructive" aria-label="bắt buộc">*</span>}</span>{hint && <span className="text-xs font-normal text-muted-foreground">{hint}</span>}</span>;
}

export function JobPreferencesPage() {
    const [advanced, setAdvanced] = useState(true);
    const [saved, setSaved] = useState<JobPreferencesDraft>(INITIAL_JOB_PREFERENCES);
    const [notice, setNotice] = useState("");
    const { control, register, handleSubmit, reset, clearErrors, formState: { errors, isDirty } } = useForm<JobPreferencesDraft>({ resolver: zodResolver(jobPreferencesDraftSchema), mode: "onTouched", defaultValues: INITIAL_JOB_PREFERENCES });
    const negotiable = useWatch({ control, name: "negotiable" });
    const multi = (name: "industries" | "locations" | "levels" | "workTypes", label: string, options: { value: string; label: string }[], max: number, placeholder: string, required = false) => <FormField label={<FieldLabel hint={`Tối đa ${max} ${name === "industries" ? "ngành nghề" : name === "locations" ? "địa điểm" : name === "levels" ? "cấp bậc" : "hình thức"}`} required={required}>{label}</FieldLabel>} error={errors[name]?.message}>{(field) => <Controller name={name} control={control} render={({ field: selected }) => <MultiSelect id={field.id} label={label} value={selected.value} onValueChange={(value) => { selected.onChange(value); setNotice(""); }} options={options} maxSelections={max} placeholder={placeholder} aria-describedby={field["aria-describedby"]} aria-invalid={field["aria-invalid"]} />} />}</FormField>;
    const salaryInput = (name: "salaryMin" | "salaryMax", label: string) => <FormField label={label} error={errors[name]?.message} className="[&>label]:sr-only">{(field) => <Controller name={name} control={control} render={({ field: amount }) => <Input {...field} {...amount} type="text" inputMode="decimal" autoComplete="off" disabled={negotiable} placeholder={name === "salaryMin" ? "Từ" : "Đến"} trailingIcon={<span className="flex h-9 items-center rounded-lg bg-muted px-3 text-xs text-muted-foreground">Triệu</span>} className="[&_input]:pr-19" />} />}</FormField>;
    return <div className="candidate-page">
        <header className="mb-5"><h1 className="text-2xl font-bold tracking-tight sm:text-3xl">Tiêu chí tìm việc</h1><p className="mt-2 text-sm text-muted-foreground">Tối ưu hồ sơ năng lực, thu hút nhà tuyển dụng hàng đầu với AI</p></header>
        <form noValidate onSubmit={handleSubmit((values) => { setSaved(values); reset(values); setNotice("Đã lưu tiêu chí vào bản xem trước."); })} className="space-y-7 rounded-2xl border border-border/30 bg-card p-5 sm:p-8 lg:p-10">
            <div className="grid items-start gap-x-10 gap-y-7 md:grid-cols-[minmax(0,1.45fr)_minmax(0,1fr)]">
                {multi("industries", "Ngành nghề làm việc", PREFERENCE_INDUSTRIES, 3, "Chọn ngành nghề", true)}
                <FormField label="Số năm kinh nghiệm" required error={errors.experience?.message}>{(field) => <Controller name="experience" control={control} render={({ field: selected }) => <Select {...field} value={selected.value} onValueChange={selected.onChange} onOpenChange={(open) => { if (!open) selected.onBlur(); }} options={PREFERENCE_EXPERIENCE} aria-label="Số năm kinh nghiệm" placeholder="Chọn số năm kinh nghiệm" />} />}</FormField>
                <FormField label="Vị trí mong muốn" required error={errors.position?.message}>{(field) => <Controller name="position" control={control} render={({ field: position }) => <Input {...field} {...position} maxLength={150} placeholder="Nhập vị trí mong muốn" />} />}</FormField>
                <fieldset className="min-w-0"><legend className="sr-only">Mức lương mong muốn</legend><div className="mb-2 flex flex-wrap items-center justify-between gap-2"><span className="ui-label">Mức lương mong muốn <span className="text-destructive">*</span></span><Checkbox label="Lương thỏa thuận" {...register("negotiable", { onChange: (event) => { if (event.target.checked) clearErrors(["salaryMin", "salaryMax"]); } })} className="text-xs [&_span.font-medium]:font-normal" /></div><div className="grid grid-cols-2 gap-3">{salaryInput("salaryMin", "Lương tối thiểu")}{salaryInput("salaryMax", "Lương tối đa")}</div></fieldset>
            </div>
            {multi("locations", "Địa điểm làm việc mong muốn", PREFERENCE_LOCATIONS, 5, "Chọn địa điểm", true)}
            <button type="button" aria-expanded={advanced} aria-controls="job-preferences-advanced" onClick={() => setAdvanced(!advanced)} className="flex min-h-12 w-full items-center gap-2 rounded-xl border border-border bg-info-soft/30 px-4 text-left text-sm text-primary transition-colors hover:bg-secondary/40"><SlidersHorizontal className="size-4 shrink-0" /><span className="font-medium">Tùy chọn nâng cao</span><span className="hidden text-xs text-muted-foreground sm:inline">(Cấp bậc, Hình thức làm việc, Chế độ...)</span><ChevronUp className={`ml-auto size-4 shrink-0 text-muted-foreground transition-transform ${advanced ? "" : "rotate-180"}`} aria-hidden="true" /></button>
            <div id="job-preferences-advanced" hidden={!advanced} className="space-y-6">
                {multi("levels", "Cấp bậc hiện tại", PREFERENCE_LEVELS, 5, "Chọn cấp bậc hiện tại")}
                {multi("workTypes", "Hình thức làm việc", PREFERENCE_WORK_TYPES, 5, "Chọn hình thức làm việc")}
                <fieldset><legend className="ui-label mb-3">Chế độ làm việc / Phúc lợi mong muốn</legend><div className="grid gap-3 sm:grid-cols-3">{[{ name: "hybrid" as const, label: "Làm việc Hybrid" }, { name: "thirteenthMonth" as const, label: "Thưởng tháng 13+" }, { name: "healthInsurance" as const, label: "Bảo hiểm sức khỏe" }].map((benefit) => <Checkbox key={benefit.name} label={benefit.label} {...register(benefit.name)} className="min-h-11 items-center rounded-lg border border-border px-3 py-2 text-xs transition-colors has-checked:border-primary/30 has-checked:bg-secondary/20 [&_.ui-choice]:mt-0" />)}</div></fieldset>
            </div>
            <div className="pt-1"><div className="flex flex-wrap justify-end gap-3"><Button variant="outline" className="min-w-32 text-primary" onClick={() => { reset(saved); setNotice("Đã khôi phục tiêu chí trước khi chỉnh sửa."); }}>Hủy</Button><Button type="submit" className="min-w-40">Lưu thông tin</Button></div>{notice && !isDirty && <p role="status" className="mt-4 flex items-center justify-end gap-2 text-sm text-success-foreground"><CheckCircle2 className="size-4 shrink-0" />{notice}</p>}<p className="mt-4 text-right text-xs leading-5 text-muted-foreground">Bản xem trước theo thiết kế; dữ liệu chưa được đồng bộ lên tài khoản và sẽ mất khi tải lại trang.</p></div>
        </form>
    </div>;
}
