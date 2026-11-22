"use client";

import Link from "next/link";
import { useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import type { z } from "zod";
import { CheckCircle2, KeyRound, LockKeyhole, Mail, ShieldCheck } from "lucide-react";
import { Button, Input } from "@/components/ui";
import { changePassword } from "../services/account";
import { useAccount } from "../hooks/use-account";
import { passwordInputSchema } from "../schemas/account";
import { SettingsError } from "../errors";

type PasswordValues = z.infer<typeof passwordInputSchema>;

const fields = [
    { name: "currentPassword", label: "Mật khẩu hiện tại", autoComplete: "current-password" },
    { name: "newPassword", label: "Mật khẩu mới", autoComplete: "new-password" },
    { name: "confirmPassword", label: "Xác nhận mật khẩu mới", autoComplete: "new-password" },
] as const;

const passwordMessages: Record<string, string> = {
    required: "Vui lòng nhập mật khẩu.",
    passwordRules: "Mật khẩu cần 8–100 ký tự, gồm chữ thường, chữ hoa và số.",
    passwordMismatch: "Mật khẩu xác nhận chưa khớp.",
};

function PasswordSection() {
    const [requestError, setRequestError] = useState("");
    const [saved, setSaved] = useState(false);
    const form = useForm<PasswordValues>({
        resolver: zodResolver(passwordInputSchema),
        mode: "onChange",
        defaultValues: { currentPassword: "", newPassword: "", confirmPassword: "" },
    });

    async function submit(values: PasswordValues) {
        setRequestError("");
        try {
            await changePassword(values);
            form.reset();
            setSaved(true);
        } catch (error) {
            setRequestError(error instanceof SettingsError && error.key === "passwordIncorrect"
                ? "Mật khẩu hiện tại không đúng. Vui lòng thử lại."
                : "Chưa thể đổi mật khẩu. Vui lòng thử lại sau.");
        }
    }

    return <section aria-labelledby="password-heading" className="rounded-2xl border border-border bg-card p-5 shadow-card sm:p-6">
        <div className="mb-5 flex items-start gap-3">
            <span className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-secondary text-primary"><LockKeyhole className="size-5" aria-hidden="true" /></span>
            <div><h2 id="password-heading" className="text-base font-semibold">Mật khẩu</h2><p className="mt-1 text-sm text-muted-foreground">Đổi mật khẩu để bảo vệ tài khoản của bạn.</p></div>
        </div>
        {saved ? <div role="status" className="rounded-xl border border-primary/20 bg-secondary/50 p-4 text-sm">
            <p className="flex items-center gap-2 font-semibold text-primary"><CheckCircle2 className="size-4" /> Đã đổi mật khẩu</p>
            <p className="mt-2 text-muted-foreground">Phiên đăng nhập hiện tại đã kết thúc. Hãy đăng nhập lại bằng mật khẩu mới.</p>
            <Link href="/login" className="mt-4 inline-flex min-h-11 items-center justify-center rounded-xl bg-primary px-5 text-sm font-semibold text-primary-foreground hover:bg-primary-hover">Đăng nhập lại</Link>
        </div> : <form noValidate onSubmit={form.handleSubmit(submit)} className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
                {fields.map(({ name, label, autoComplete }) => <div key={name} className={name === "currentPassword" ? "sm:col-span-2" : ""}>
                    <label htmlFor={`candidate-${name}`} className="mb-1.5 block text-sm font-medium">{label}</label>
                    <Input id={`candidate-${name}`} type="password" autoComplete={autoComplete} disabled={form.formState.isSubmitting} aria-invalid={!!form.formState.errors[name]} aria-describedby={form.formState.errors[name] ? `${name}-error` : undefined} {...form.register(name)} />
                    {form.formState.errors[name] && <p id={`${name}-error`} role="alert" className="mt-1 text-xs text-destructive">{passwordMessages[form.formState.errors[name]?.message ?? ""] ?? "Vui lòng kiểm tra lại trường này."}</p>}
                </div>)}
            </div>
            <p className="text-xs text-muted-foreground">Mật khẩu mới cần 8–100 ký tự, gồm chữ thường, chữ hoa và số.</p>
            {requestError && <p role="alert" className="rounded-lg bg-destructive-soft p-3 text-sm text-destructive">{requestError}</p>}
            <div className="flex flex-wrap items-center gap-3 border-t border-border pt-4">
                <Button type="submit" loading={form.formState.isSubmitting}><KeyRound className="size-4" /> Đổi mật khẩu</Button>
                <Link href="/forgot-password" className="text-sm font-medium text-primary hover:underline">Quên mật khẩu hiện tại?</Link>
            </div>
        </form>}
    </section>;
}

export function CandidateAccountSettings() {
    const account = useAccount();

    return <div className="candidate-page max-w-4xl space-y-5 py-2">
        <div><h1 className="text-xl font-bold sm:text-2xl">Cài đặt tài khoản</h1><p className="mt-1 text-sm text-muted-foreground">Quản lý thông tin đăng nhập và bảo mật tài khoản.</p></div>
        {account.isPending ? <div role="status" className="space-y-4" aria-label="Đang tải tài khoản"><div className="h-32 animate-pulse rounded-2xl bg-muted" /><div className="h-64 animate-pulse rounded-2xl bg-muted" /></div>
            : account.isError ? <div role="alert" className="rounded-2xl border border-border bg-card p-6"><p>Không tải được thông tin tài khoản.</p><Button variant="outline" className="mt-3" onClick={() => void account.refetch()}>Thử lại</Button></div>
                : <>
                    <section aria-labelledby="login-heading" className="rounded-2xl border border-border bg-card p-5 shadow-card sm:p-6">
                        <div className="mb-5 flex items-start gap-3"><span className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-secondary text-primary"><ShieldCheck className="size-5" aria-hidden="true" /></span><div><h2 id="login-heading" className="text-base font-semibold">Thông tin đăng nhập</h2><p className="mt-1 text-sm text-muted-foreground">Thông tin dùng để truy cập tài khoản TalentAI.</p></div></div>
                        <div className="flex flex-col gap-3 border-t border-border pt-4 sm:flex-row sm:items-center sm:justify-between"><div className="flex min-w-0 items-center gap-3"><Mail className="size-4 shrink-0 text-primary" aria-hidden="true" /><div className="min-w-0"><p className="text-xs text-muted-foreground">Email đăng nhập</p><p className="truncate text-sm font-medium">{account.data.email}</p></div></div><span className="w-fit rounded-full bg-secondary px-3 py-1 text-xs font-medium text-primary">{account.data.status === "active" ? "Đang hoạt động" : "Tạm khóa"}</span></div>
                    </section>
                    <PasswordSection />
                </>}
    </div>;
}
