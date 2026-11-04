"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import type { z } from "zod";
import { ArrowLeft, ArrowRight, Building2, Check, CheckCircle2, ClipboardCheck, MapPin, PencilLine, ShieldCheck, Sparkles } from "lucide-react";
import { Alert, Button, FormField, Input } from "@/components/ui";
import { Textarea } from "@/components/ui/textarea";
import { SettingsError } from "@/features/account";
import { buttonVariants } from "@/components/ui/button";
import { Select } from "@/components/ui/select";
import { BrandLogo } from "@/components/shared/brand-logo";
import { useAccount } from "@/features/account";
import { provinceCity } from "@/lib/locations/vietnam";
import { cn } from "@/lib/utils";
import { useCompany, useCompanyActions, useCompanyCatalogs } from "../hooks/use-company";
import { companyToInput, type Company } from "../schemas/company";
import { companyOnboardingSchema } from "../schemas/onboarding";
import "./company-onboarding.css";

const steps = [
    { title: "Thông tin doanh nghiệp", detail: "Tên và lĩnh vực hoạt động", Icon: Building2 },
    { title: "Địa chỉ và liên hệ", detail: "Nơi làm việc và điện thoại", Icon: MapPin },
    { title: "Kiểm tra và hoàn tất", detail: "Xác nhận hồ sơ công ty", Icon: ClipboardCheck },
];
const stepFields = [["name", "taxCode", "industryId", "description"], ["city", "address", "contactPhone"]] as const;

function StepFooter({ back, busy, children }: { back?: () => void; busy?: boolean; children: React.ReactNode }) {
    return <div className="co-actions">{back ? <Button variant="ghost" disabled={busy} onClick={back}><ArrowLeft />Quay lại</Button> : <span className="co-secure"><ShieldCheck size={16} />Thông tin được bảo vệ</span>}<div className="co-action-buttons">{children}</div></div>;
}

function StartHiring({ company, onEdit }: { company: Company; onEdit: () => void }) {
    return <div><section className="co-card co-finish"><span className="co-large-icon"><CheckCircle2 /></span><h2>Hồ sơ công ty đã được tạo!</h2><p><strong>{company.name}</strong> đã có không gian tuyển dụng riêng trên TalentAI.</p>
        <div className="co-summary"><span><CheckCircle2 />Thông tin doanh nghiệp đã lưu</span><span><MapPin />Địa chỉ và số điện thoại đã lưu</span></div>
        <div className="co-hiring-options"><div className="co-hiring-card"><span className="co-icon"><PencilLine /></span><h3>Tạo tin tuyển dụng đầu tiên</h3><p>Giới thiệu vị trí, yêu cầu và quyền lợi để tiếp cận ứng viên phù hợp.</p><Link href="/recruiter/jobs/new" className={cn(buttonVariants(), "w-full")}>Tạo tin tuyển dụng<ArrowRight /></Link></div><div className="co-hiring-card"><span className="co-icon"><Sparkles /></span><h3>Hoàn thiện dấu ấn công ty</h3><p>Thêm logo, giới thiệu và website để ứng viên hiểu thêm về doanh nghiệp.</p><Link href="/recruiter/company" className={cn(buttonVariants({ variant: "secondary" }), "w-full")}>Chỉnh sửa hồ sơ công ty<ArrowRight /></Link></div></div>
    </section><StepFooter back={onEdit}><Link href="/recruiter/dashboard" className={buttonVariants({ variant: "outline" })}>Vào trang quản lý<ArrowRight /></Link></StepFooter></div>;
}

function CompanyInfo({ company, phone }: { company: Company | null; phone?: string }) {
    const actions = useCompanyActions();
    const catalogs = useCompanyCatalogs();
    const [step, setStep] = useState(0);
    const [finished, setFinished] = useState(!!company);
    const title = useRef<HTMLSpanElement>(null);
    const form = useForm<z.infer<typeof companyOnboardingSchema>>({
        resolver: zodResolver(companyOnboardingSchema), mode: "onTouched",
        defaultValues: { name: company?.name ?? "", description: company?.description ?? "", taxCode: company?.taxCode ?? "", city: company?.city ?? "", contactPhone: company?.contactPhone ?? phone ?? "", address: company?.address ?? "", industryId: company?.industries?.[0]?.id ?? "" },
    });
    const busy = actions.save.isPending;
    const errors = form.formState.errors;
    const values = form.getValues();
    useEffect(() => { title.current?.focus(); }, [step, finished]);

    async function next() {
        if (step < 2 && await form.trigger([...stepFields[step]], { shouldFocus: true })) setStep(step + 1);
    }
    const save = form.handleSubmit(async ({ industryId, ...fields }) => {
        try {
            await actions.save.mutateAsync({ creating: !company, input: { ...(company ? companyToInput(company) : {}), ...fields, industryIds: [industryId, ...(company?.industries?.slice(1).map(item => item.id) ?? [])] } });
            setFinished(true);
        } catch (error) {
            if (error instanceof SettingsError) {
                const fields = [...stepFields[0], ...stepFields[1]];
                for (const issue of error.fieldErrors) {
                    const field = fields.find(name => name === issue.field);
                    if (field) form.setError(field, { type: "server", message: issue.message });
                }
                if (error.fieldErrors.some(issue => stepFields[0].some(field => field === issue.field))) setStep(0);
                else if (error.fieldErrors.some(issue => stepFields[1].some(field => field === issue.field))) setStep(1);
            }
        }
    }, invalid => {
        setStep(stepFields[0].some(field => invalid[field]) ? 0 : 1);
    });

    return <>
        <nav className="co-progress" aria-label="Tiến trình tạo hồ sơ công ty"><div className="co-progress-label"><strong>{finished ? "Đã hoàn tất" : `Bước ${step + 1} / 3`}</strong><span>{finished ? "Hồ sơ công ty" : steps[step].title}</span></div><ol>{steps.map(({ title: label, detail, Icon }, index) => <li key={label} data-state={finished || index < step ? "visited" : index === step ? "active" : "upcoming"}><button type="button" disabled={busy || index > step || finished} aria-current={!finished && index === step ? "step" : undefined} onClick={() => setStep(index)}><span className="co-step-icon">{finished || index < step ? <Check /> : <Icon />}</span><span><strong>{label}</strong><small>{detail}</small></span></button></li>)}</ol></nav>
        <span ref={title} tabIndex={-1} className="sr-only">{finished ? "Hoàn tất hồ sơ công ty" : steps[step].title}</span>
        {finished && company ? <StartHiring company={company} onEdit={() => { setStep(0); setFinished(false); actions.save.reset(); }} /> : <form noValidate onSubmit={event => { if (step < 2) { event.preventDefault(); void next(); } else void save(event); }}>
            <section className="co-card">
                <div className="co-card-heading"><span className="co-icon">{step === 0 ? <Building2 /> : step === 1 ? <MapPin /> : <ClipboardCheck />}</span><div><h2>{step === 0 ? "Giới thiệu doanh nghiệp của bạn" : step === 1 ? "Công ty của bạn ở đâu?" : "Kiểm tra thông tin công ty"}</h2><p>{step === 0 ? "Bắt đầu với tên công ty và lĩnh vực hoạt động." : step === 1 ? "Thêm địa chỉ trụ sở và số điện thoại liên hệ." : "Kiểm tra lần cuối trước khi tạo hồ sơ. Bạn có thể quay lại để chỉnh sửa."}</p></div><span className="co-required-note">* Thông tin bắt buộc</span></div>
                <div className="co-fields">
                    {step === 0 && <>
                        <FormField className="co-full" label="Tên công ty" required description="Sử dụng tên đầy đủ trên giấy chứng nhận đăng ký doanh nghiệp." error={errors.name?.message}>{field => <Input {...field} {...form.register("name")} disabled={busy} autoComplete="organization" placeholder="Ví dụ: Công ty Cổ phần Công nghệ…" />}</FormField>
                        <FormField label="Mã số thuế công ty" required description="Không công khai trên hồ sơ doanh nghiệp." error={errors.taxCode?.message}>{field => <Input {...field} {...form.register("taxCode")} disabled={busy} placeholder="Nhập mã số thuế" inputMode="numeric" />}</FormField>
                        <Controller name="industryId" control={form.control} render={({ field }) => <FormField label="Lĩnh vực hoạt động chính" required error={errors.industryId?.message}>{control => <Select options={(catalogs.data?.industries ?? []).map(item => ({ value: item.id, label: item.name }))} value={field.value} onValueChange={value => field.onChange(value ?? "")} onOpenChange={open => { if (!open) field.onBlur(); }} aria-label="Lĩnh vực hoạt động chính" aria-describedby={control["aria-describedby"]} aria-invalid={control["aria-invalid"]} disabled={busy || catalogs.isPending || catalogs.isError} placeholder={catalogs.isPending ? "Đang tải lĩnh vực…" : "Chọn lĩnh vực hoạt động"} />}</FormField>} />
                        <FormField className="co-full" label="Giới thiệu ngắn về công ty" required error={errors.description?.message}>{field => <Textarea {...field} {...form.register("description")} disabled={busy} rows={2} maxLength={5000} placeholder="Công ty hoạt động trong lĩnh vực nào, cung cấp sản phẩm hoặc dịch vụ gì?" />}</FormField>
                    </>}
                    {step === 1 && <>
                        <Controller name="city" control={form.control} render={({ field }) => <FormField label="Tỉnh / Thành phố" required error={errors.city?.message}>{control => <Select options={(catalogs.data?.locations ?? []).map(item => ({ value: provinceCity(item.name), label: provinceCity(item.name) }))} value={field.value} onValueChange={value => field.onChange(value ?? "")} onOpenChange={open => { if (!open) field.onBlur(); }} aria-label="Tỉnh / Thành phố" aria-describedby={control["aria-describedby"]} aria-invalid={control["aria-invalid"]} disabled={busy} placeholder="Chọn tỉnh/thành phố" />}</FormField>} />
                        <FormField className="co-full co-address" label="Địa chỉ trụ sở" required error={errors.address?.message}>{field => <Input {...field} {...form.register("address")} disabled={busy} autoComplete="street-address" placeholder="Số nhà, tên đường, phường/xã" />}</FormField>
                        <FormField label="Số điện thoại liên hệ" required error={errors.contactPhone?.message}>{field => <Input {...field} {...form.register("contactPhone")} disabled={busy} type="tel" autoComplete="tel" placeholder="Ví dụ: 0912345678" />}</FormField>
                    </>}
                </div>
                {step === 2 && <div className="co-review">{[
                    { title: "Thông tin doanh nghiệp", target: 0, items: [["Tên công ty", values.name], ["Mã số thuế", values.taxCode], ["Giới thiệu", values.description], ["Lĩnh vực", catalogs.data?.industries.find(item => item.id === values.industryId)?.name ?? company?.industries?.find(item => item.id === values.industryId)?.name ?? "Lĩnh vực đã chọn"]] },
                    { title: "Địa chỉ và liên hệ", target: 1, items: [["Tỉnh / Thành phố", values.city], ["Địa chỉ trụ sở", values.address], ["Số điện thoại", values.contactPhone]] },
                ].map(group => <section key={group.title}><div className="co-review-heading"><h3>{group.title}</h3><Button variant="ghost" disabled={busy} onClick={() => setStep(group.target)}><PencilLine />Chỉnh sửa</Button></div><dl>{group.items.map(([label, value]) => <div key={label}><dt>{label}</dt><dd>{value}</dd></div>)}</dl></section>)}</div>}
                {step === 0 && catalogs.isError && <Alert variant="error" title="Không tải được danh mục"><Button variant="outline" onClick={() => void catalogs.refetch()}>Thử lại</Button></Alert>}
                {step === 0 && catalogs.isSuccess && !catalogs.data.industries.length && <Alert title="Chưa có lĩnh vực hoạt động">Danh mục hiện chưa có dữ liệu. <Button variant="outline" onClick={() => void catalogs.refetch()}>Tải lại</Button></Alert>}
                {actions.save.isError && <Alert variant="error" title="Chưa thể lưu thay đổi">{actions.save.error instanceof SettingsError && actions.save.error.key === "session" ? "Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại." : actions.save.error instanceof SettingsError && actions.save.error.key === "invalid" ? "Vui lòng kiểm tra các trường được đánh dấu rồi gửi lại." : "Không lưu được hồ sơ. Vui lòng thử lại; thông tin đã nhập vẫn được giữ."}</Alert>}
            <StepFooter back={step > 0 ? () => setStep(step - 1) : undefined} busy={busy}><Button type="submit" loading={busy} disabled={step === 0 && (catalogs.isPending || catalogs.isError || !catalogs.data?.industries.length)}>{step === 2 ? company ? "Lưu hồ sơ công ty" : "Tạo hồ sơ công ty" : "Tiếp tục"}<ArrowRight /></Button></StepFooter>
            </section>
        </form>}
        <p className="co-bottom-note">{finished ? "Bạn có thể chỉnh sửa thông tin trong mục Hồ sơ công ty." : "Thông tin được giữ khi chuyển bước. Hồ sơ chỉ được lưu sau khi bạn xác nhận hoàn tất."}</p>
    </>;
}

export function CompanyOnboarding() {
    const query = useCompany();
    const account = useAccount();
    return <div className="company-onboarding">
        <header className="co-header"><Link href="/" aria-label="TalentAI · Trang chủ"><BrandLogo /><span className="co-header-label">Tài khoản nhà tuyển dụng</span></Link><Link href="/recruiter/help" className="co-help">Cần hỗ trợ?</Link></header>
        <main className="co-main"><div className="co-welcome"><h1>Hoàn thiện hồ sơ doanh nghiệp</h1><p>Thêm thông tin công ty để sẵn sàng kết nối nhân tài.</p></div>
            {query.isPending || account.isPending ? <section className="co-card co-loading" aria-busy="true" role="status"><span />Đang tải hồ sơ công ty…<span /><span /></section> : query.isError || account.isError ? <section className="co-card"><Alert variant="error" title="Không tải được hồ sơ">Vui lòng thử lại để tiếp tục. Nếu phiên đăng nhập hết hạn, hãy đăng nhập lại.</Alert><Button className="mt-5" onClick={() => { void query.refetch(); void account.refetch(); }}>Thử lại</Button><Link href="/login?role=recruiter" className={buttonVariants({ variant: "ghost" })}>Đăng nhập lại</Link></section> : <CompanyInfo company={query.data ?? null} phone={account.data?.phone} />}
        </main>
        <footer className="co-footer">TalentAI · Kết nối đúng người, cùng nhau phát triển.</footer>
    </div>;
}
