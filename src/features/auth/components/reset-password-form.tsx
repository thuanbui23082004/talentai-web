"use client";

import Link from "next/link";
import { useEffect } from "react";
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
    const {
        register,
        handleSubmit,
        setError,
        formState: { errors },
    } = useForm<z.infer<typeof resetPasswordSchema>>({
        resolver: zodResolver(resetPasswordSchema),
        mode: "onTouched",
        defaultValues: {
            newPassword: "",
            confirmPassword: "",
        },
    });

    useEffect(() => {
        if (token) window.history.replaceState(null, "", "/reset-password");
    }, [token]);

    const invalidToken =
        mutation.error instanceof ApiError &&
        mutation.error.code === "INVALID_RESET_TOKEN";
    const inlineError = Object.values(errors).some(
        (error) => error?.type === "server",
    );

    return (
        <div>
            <h1 className="text-2xl font-bold tracking-tight">
                Tạo lại mật khẩu của bạn
            </h1>
            <p className="mt-3 text-[13px] leading-relaxed text-muted-foreground">
                Tạo mật khẩu mới để tiếp tục sử dụng tài khoản TalentAI của bạn.
            </p>
            {!token || invalidToken ? (
                <div className="mt-6 space-y-4">
                    <Alert variant="warning" title="Liên kết không hợp lệ hoặc đã hết hạn">
                        Vui lòng mở liên kết trong email khôi phục hoặc yêu cầu email mới.
                    </Alert>
                    <Link href="/forgot-password" className="flex min-h-11 items-center justify-center rounded-xl bg-primary px-4 text-sm font-semibold text-primary-foreground hover:bg-primary-hover">
                        Yêu cầu email mới
                    </Link>
                </div>
            ) : (
                <form
                    noValidate
                    className="mt-6 space-y-5"
                    onSubmit={handleSubmit((values) => {
                        mutation.mutate({ token, ...values }, {
                            onSuccess: () => window.location.replace("/login?reason=password-reset"),
                            onError: (error) => {
                                if (!(error instanceof ApiError)) return;
                                for (const field of error.fieldErrors ?? []) {
                                    if (
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
            )}
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
