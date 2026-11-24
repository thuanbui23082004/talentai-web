"use client";

import Link from "next/link";
import { ArrowLeft, KeyRound, LockKeyhole, ShieldCheck } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import type { z } from "zod";
import { Alert, Button, FormField, Input } from "@/components/ui";
import { ApiError } from "@/lib/api/errors";
import { useResetPassword } from "../hooks/use-password-recovery";
import { resetPasswordSchema } from "../schemas/password-recovery";

export function ResetPasswordForm() {
    const mutation = useResetPassword();
    const {
        register,
        handleSubmit,
        setError,
        formState: { errors },
    } = useForm<z.infer<typeof resetPasswordSchema>>({
        resolver: zodResolver(resetPasswordSchema),
        mode: "onTouched",
        defaultValues: {
            token: "",
            newPassword: "",
            confirmPassword: "",
        },
    });

    const invalidToken =
        mutation.error instanceof ApiError &&
        mutation.error.code === "INVALID_RESET_TOKEN";
    const inlineError = Object.values(errors).some(
        (error) => error?.type === "server",
    );

    return (
        <div>
            <div className="mb-5 flex size-12 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                <ShieldCheck aria-hidden="true" className="size-6" />
            </div>
            <h1 className="text-2xl font-bold tracking-tight">Xác nhận mã OTP</h1>
            <p className="mt-3 text-[13px] leading-relaxed text-muted-foreground">
                Nhập mã 6 chữ số từ email và tạo mật khẩu mới cho tài khoản TalentAI.
            </p>
            {invalidToken && (
                <Alert variant="error" title="Mã OTP không hợp lệ hoặc đã hết hạn">
                    Kiểm tra lại mã hoặc yêu cầu gửi mã mới.
                </Alert>
            )}
                <form
                    noValidate
                    className="mt-6 space-y-5"
                    onSubmit={handleSubmit((values) => {
                        mutation.mutate(values, {
                            onSuccess: () => window.location.replace("/login?reason=password-reset"),
                            onError: (error) => {
                                if (!(error instanceof ApiError)) return;
                                for (const field of error.fieldErrors ?? []) {
                                    if (
                                        field.field === "token" ||
                                        field.field === "newPassword" ||
                                        field.field === "confirmPassword"
                                    )
                                        setError(field.field, {
                                            type: "server",
                                            message: field.message,
                                        });
                                }
                            },
                        });
                    })}
                >
                    <FormField
                        label="Mã OTP"
                        required
                        error={errors.token?.message}
                        description="Mã gồm 6 chữ số, có hiệu lực trong 15 phút."
                    >
                        {(field) => (
                            <Input
                                {...field}
                                {...register("token")}
                                type="text"
                                inputMode="numeric"
                                autoComplete="one-time-code"
                                maxLength={6}
                                placeholder="Nhập mã OTP"
                                leadingIcon={<KeyRound aria-hidden="true" />}
                                className="text-center text-lg font-semibold tracking-[0.25em]"
                                disabled={mutation.isPending}
                            />
                        )}
                    </FormField>
                    <FormField
                        label="Mật khẩu mới"
                        required
                        error={errors.newPassword?.message}
                        description="Mật khẩu mới dài từ 8 đến 100 ký tự."
                    >
                        {(field) => (
                            <Input
                                {...field}
                                {...register("newPassword")}
                                type="password"
                                autoComplete="new-password"
                                placeholder="Nhập mật khẩu mới"
                                leadingIcon={<LockKeyhole aria-hidden="true" />}
                                disabled={mutation.isPending}
                            />
                        )}
                    </FormField>
                    <FormField
                        label="Nhập lại mật khẩu mới"
                        required
                        error={errors.confirmPassword?.message}
                    >
                        {(field) => (
                            <Input
                                {...field}
                                {...register("confirmPassword")}
                                type="password"
                                autoComplete="new-password"
                                placeholder="Nhập lại mật khẩu mới"
                                leadingIcon={<LockKeyhole aria-hidden="true" />}
                                disabled={mutation.isPending}
                            />
                        )}
                    </FormField>
                    {mutation.isError && !inlineError && !invalidToken && (
                        <Alert
                            variant="error"
                            title="Chưa thể đặt lại mật khẩu"
                        >
                            Không thể cập nhật mật khẩu. Vui lòng thử lại sau.
                        </Alert>
                    )}
                    <Button
                        type="submit"
                        className="w-full"
                        loading={mutation.isPending}
                    >
                        {mutation.isPending
                            ? "Đang cập nhật…"
                            : "Đặt lại mật khẩu"}
                    </Button>
                </form>
            <Link href="/forgot-password" className="mt-3 inline-flex min-h-11 items-center text-sm font-semibold text-primary hover:underline">
                Chưa nhận được mã? Gửi lại OTP
            </Link>
            <div className="mt-6 flex items-center justify-between gap-2 text-xs sm:text-sm">
                <Link href="/login" className="inline-flex min-h-11 items-center gap-1 font-semibold whitespace-nowrap text-primary hover:underline">
                    <ArrowLeft aria-hidden="true" className="size-4 shrink-0" /> Quay lại đăng nhập
                </Link>
                <Link href="/register" className="inline-flex min-h-11 items-center font-semibold whitespace-nowrap text-primary hover:underline">
                    Đăng ký tài khoản mới
                </Link>
            </div>
        </div>
    );
}
