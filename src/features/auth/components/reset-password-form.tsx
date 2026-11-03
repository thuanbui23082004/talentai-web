"use client";

import Link from "next/link";
import { ArrowLeft, LockKeyhole } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import type { z } from "zod";
import { Alert, Button, FormField, Input } from "@/components/ui";
import { ApiError } from "@/lib/api/errors";
import { useResetPassword } from "../hooks/use-password-recovery";
import { resetPasswordSchema } from "../schemas/password-recovery";

export function ResetPasswordForm({ token }: { token?: string }) {
    const mutation = useResetPassword();
    const { register, handleSubmit, setError, formState: { errors } } = useForm<z.infer<typeof resetPasswordSchema>>({
        resolver: zodResolver(resetPasswordSchema),
        mode: "onTouched",
        defaultValues: { newPassword: "", confirmPassword: "" },
    });
    const invalidToken = !token || (mutation.error instanceof ApiError && mutation.error.code === "INVALID_RESET_TOKEN");
    const inlineError = Object.values(errors).some((error) => error?.type === "server");

    return (
        <div>
            <div className="mb-5 flex size-12 items-center justify-center rounded-2xl bg-secondary text-primary">
                <LockKeyhole aria-hidden="true" className="size-6" />
            </div>
            <h1 className="text-2xl font-bold tracking-tight">Đặt lại mật khẩu</h1>
            <p className="mt-3 text-[13px] leading-relaxed text-muted-foreground">
                Tạo mật khẩu mới để tiếp tục sử dụng tài khoản TalentAI của bạn.
            </p>
            {mutation.isSuccess ? (
                <div className="mt-6" role="status">
                    <Alert variant="success" title="Đặt lại mật khẩu thành công">
                        Bạn có thể đăng nhập bằng mật khẩu mới.
                    </Alert>
                </div>
            ) : invalidToken ? (
                <div className="mt-6 space-y-4">
                    <Alert variant="warning" title="Liên kết không hợp lệ hoặc đã hết hạn">
                        Vui lòng yêu cầu liên kết mới để đặt lại mật khẩu.
                    </Alert>
                    <Link href="/forgot-password" className="flex min-h-11 items-center justify-center rounded-xl bg-primary px-4 text-sm font-semibold text-primary-foreground hover:bg-primary-hover">
                        Yêu cầu liên kết mới
                    </Link>
                </div>
            ) : (
                <form noValidate className="mt-6 space-y-5" onSubmit={handleSubmit((values) => {
                    if (!token) return;
                    mutation.mutate({ token, ...values }, {
                        onError: (error) => {
                            if (!(error instanceof ApiError)) return;
                            for (const field of error.fieldErrors ?? []) {
                                if (field.field === "newPassword" || field.field === "confirmPassword")
                                    setError(field.field, { type: "server", message: field.message });
                            }
                        },
                    });
                })}>
                    <FormField label="Mật khẩu mới" required error={errors.newPassword?.message} description="Mật khẩu mới dài từ 8 đến 100 ký tự.">
                        {(field) => <Input {...field} {...register("newPassword")} type="password" autoComplete="new-password" placeholder="Nhập mật khẩu mới" leadingIcon={<LockKeyhole aria-hidden="true" />} disabled={mutation.isPending} />}
                    </FormField>
                    <FormField label="Nhập lại mật khẩu mới" required error={errors.confirmPassword?.message}>
                        {(field) => <Input {...field} {...register("confirmPassword")} type="password" autoComplete="new-password" placeholder="Nhập lại mật khẩu mới" leadingIcon={<LockKeyhole aria-hidden="true" />} disabled={mutation.isPending} />}
                    </FormField>
                    {mutation.isError && !inlineError && (
                        <Alert variant="error" title="Chưa thể đặt lại mật khẩu">Không thể cập nhật mật khẩu. Vui lòng thử lại sau.</Alert>
                    )}
                    <Button type="submit" className="w-full" loading={mutation.isPending}>
                        {mutation.isPending ? "Đang cập nhật…" : "Đặt lại mật khẩu"}
                    </Button>
                </form>
            )}
            <Link href="/login" className="mt-6 flex min-h-11 items-center justify-center gap-2 text-sm font-semibold text-primary hover:underline">
                <ArrowLeft aria-hidden="true" className="size-4" /> Quay lại đăng nhập
            </Link>
        </div>
    );
}
