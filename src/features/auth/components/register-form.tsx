"use client";
import { useState } from "react";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import type { z } from "zod";
import { CheckCircle2, LockKeyhole, Mail, Phone, UserRound } from "lucide-react";
import { Alert, Button, Checkbox, FormField, Input } from "@/components/ui";
import { ApiError } from "@/lib/api/errors";
import { useRegister } from "../hooks/use-auth";
import { registerSchema } from "../schemas/auth";
import { AuthScrollArea } from "./auth-content";
import { AuthRoleSwitch, type RegistrationRole } from "./auth-role-switch";
export function RegisterForm({ initialRole = "candidate", }: {
    initialRole?: RegistrationRole;
}) {
    const [role, setRole] = useState(initialRole);
    const mutation = useRegister();
    const { register, handleSubmit, setValue, setError, formState: { errors }, } = useForm<z.infer<typeof registerSchema>>({
        resolver: zodResolver(registerSchema),
        mode: "onTouched",
        defaultValues: {
            fullName: "",
            phone: "",
            email: "",
            password: "",
            confirmPassword: "",
            role: initialRole,
            acceptedPrivacyPolicy: false,
        },
    });
    async function onSubmit(values: z.infer<typeof registerSchema>) {
        try {
            await mutation.mutateAsync(values);
        }
        catch (error) {
            if (error instanceof ApiError)
                for (const field of error.fieldErrors ?? []) {
                    if ([
                        "email",
                        "fullName",
                        "phone",
                        "password",
                        "confirmPassword",
                        "acceptedPrivacyPolicy",
                    ].includes(field.field))
                        setError(field.field as keyof z.infer<typeof registerSchema>, {
                            type: "server",
                            message: field.message,
                        }, { shouldFocus: true });
                }
        }
    }
    if (mutation.isSuccess)
        return (<AuthScrollArea><div className="space-y-6">
                <span className="flex size-14 items-center justify-center rounded-2xl bg-success-soft text-success">
                    <CheckCircle2 className="size-7"/>
                </span>
                <div>
                    <h1 className="text-2xl font-bold tracking-tight">
                        Đăng ký thành công!
                    </h1>
                    <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
                        Tài khoản của bạn đã được tạo. Vui lòng đăng nhập để bắt
                        đầu hành trình cùng TalentAI.
                    </p>
                </div>
                {role === "recruiter" && (<Alert variant="info" title="Hoàn thiện hồ sơ doanh nghiệp">
                        Bạn cần bổ sung thông tin doanh nghiệp và được kiểm
                        duyệt trước khi đăng tin tuyển dụng.
                    </Alert>)}
                <Button className="w-full" role="link" nativeButton={false} render={<Link href={`/login?role=${role}&reason=registered`}/>}>
                    Đăng nhập ngay
                </Button>
            </div></AuthScrollArea>);
    return (<form noValidate className="flex h-full min-h-0 flex-col" onSubmit={handleSubmit(onSubmit)}>
        <div className="min-h-0 flex-1 overflow-hidden [&>div]:h-full"><AuthScrollArea>
        <div>
            <h1 className="text-2xl font-bold tracking-tight">
                Đăng ký tài khoản
            </h1>
            <p className="mt-3 text-[13px] leading-relaxed text-muted-foreground">
                {role === "candidate"
            ? "Tạo tài khoản miễn phí, mở lối đến những cơ hội mới."
            : "Kết nối với nhân tài, cùng doanh nghiệp phát triển."}
            </p>
            <div className="mt-6">
                <AuthRoleSwitch value={role} disabled={mutation.isPending} onValueChange={(next) => {
            setRole(next);
            setValue("role", next, { shouldValidate: true });
            mutation.reset();
        }}/>
            </div>
            <div className="mt-5 space-y-4">
                    <FormField label="Họ và tên" required error={errors.fullName?.message}>
                        {(field) => (<Input {...field} {...register("fullName")} leadingIcon={<UserRound />} placeholder="Họ và tên" autoComplete="name" disabled={mutation.isPending}/>)}
                    </FormField>
                <FormField label="Email đăng nhập" required error={errors.email?.message}>
                    {(field) => (<Input {...field} {...register("email")} type="email" leadingIcon={<Mail />} placeholder="Email" autoComplete="email" disabled={mutation.isPending}/>)}
                </FormField>
                <FormField label="Số điện thoại" required error={errors.phone?.message}>
 {(field) => <Input {...field} {...register("phone")} type="tel" inputMode="tel" autoComplete="tel" leadingIcon={<Phone />} placeholder="Nhập số điện thoại" disabled={mutation.isPending}/>}
 </FormField>
                <FormField label="Nhập mật khẩu" required description="8–64 ký tự, gồm chữ hoa, chữ thường và chữ số." error={errors.password?.message}>
                    {(field) => (<Input {...field} {...register("password")} type="password" leadingIcon={<LockKeyhole />} placeholder="Nhập mật khẩu" autoComplete="new-password" disabled={mutation.isPending}/>)}
                </FormField>
                <FormField label="Nhập lại mật khẩu" required error={errors.confirmPassword?.message}>
                    {(field) => (<Input {...field} {...register("confirmPassword")} type="password" leadingIcon={<LockKeyhole />} placeholder="Nhập lại mật khẩu" autoComplete="new-password" disabled={mutation.isPending}/>)}
                </FormField>
                <div className="space-y-2 pt-1">
                    <Checkbox {...register("acceptedPrivacyPolicy")} disabled={mutation.isPending} aria-invalid={!!errors.acceptedPrivacyPolicy} aria-describedby={errors.acceptedPrivacyPolicy
            ? "privacy-error"
            : undefined} label={<span className="text-xs leading-relaxed font-normal text-muted-foreground">
                                Tôi đồng ý với{" "}
                                <span className="font-medium text-primary">
                                    Điều khoản sử dụng
                                </span>{" "}
                                và{" "}
                                <span className="font-medium text-primary">
                                    Chính sách quyền riêng tư
                                </span>{" "}
                                của TalentAI.
                            </span>}/>
                    {errors.acceptedPrivacyPolicy && (<p id="privacy-error" role="alert" className="text-xs text-destructive">
                            {errors.acceptedPrivacyPolicy.message}
                        </p>)}
                </div>
                {mutation.isError && (<Alert variant="error" title="Chưa thể tạo tài khoản">
                        {mutation.error.message}
                    </Alert>)}
            </div>
        </div>
        </AuthScrollArea></div>
        <div className="shrink-0 border-t border-border bg-card px-6 py-4 sm:px-12 lg:px-14"><div className="mx-auto w-full max-w-[420px]">
                <Button type="submit" loading={mutation.isPending} className="w-full">
                    {mutation.isPending ? "Đang tạo tài khoản…" : "Hoàn tất"}
                </Button>

            <p className="mt-3 text-center text-xs text-muted-foreground">
                Đã có tài khoản?{" "}
                <Link href={`/login?role=${role}`} className="font-semibold text-primary hover:underline">
                    Đăng nhập ngay
                </Link>
            </p>
        </div></div>
        </form>);
}
