"use client";

import Link from "next/link";
import { ArrowLeft, CheckCircle2, Mail } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import type { z } from "zod";
import { Alert, Button, FormField, Input } from "@/components/ui";
import { ApiError } from "@/lib/api/errors";
import { useForgotPassword } from "../hooks/use-password-recovery";
import { forgotPasswordSchema } from "../schemas/password-recovery";

export function ForgotPasswordForm() {
    const mutation = useForgotPassword();
    const {
        register,
        handleSubmit,
        formState: { errors },
    } = useForm<z.infer<typeof forgotPasswordSchema>>({
        resolver: zodResolver(forgotPasswordSchema),
        mode: "onTouched",
        defaultValues: { email: "" },
    });

    return (
        <div>
            <h1 className="text-left text-2xl font-bold tracking-tight text-black">
                Quên mật khẩu
            </h1>
            {mutation.isSuccess ? (
                <div
                    role="status"
                    className="mt-6 flex items-start gap-3 rounded-xl border border-primary/15 bg-primary/5 p-4 text-sm text-brand-deep"
                >
                    <CheckCircle2
                        aria-hidden="true"
                        className="mt-0.5 size-5 shrink-0 text-primary"
                    />
                    <p className="leading-relaxed">
                        Nếu email đã đăng ký, mã OTP đã được gửi đến hộp thư của bạn.
                        Mã có hiệu lực trong 15 phút.
                    </p>
                </div>
            ) : (
                <p
                    className="mt-3 text-left
                 text-[13px] leading-relaxed text-muted-foreground"
                >
                    Nhập email đã đăng ký để nhận hướng dẫn đặt lại mật khẩu.
                </p>
            )}
            <form
                noValidate
                className="mt-6 space-y-5"
                onSubmit={handleSubmit((values) => mutation.mutate(values))}
            >
                <FormField
                    label="Email đã đăng ký"
                    required
                    error={errors.email?.message}
                >
                    {(field) => (
                        <Input
                            {...field}
                            {...register("email")}
                            type="email"
                            autoComplete="email"
                            placeholder="Nhập email của bạn"
                            leadingIcon={<Mail aria-hidden="true" />}
                            disabled={mutation.isPending}
                        />
                    )}
                </FormField>
                {mutation.isError && (
                    <Alert variant="error" title="Chưa thể gửi yêu cầu">
                        {mutation.error instanceof ApiError
                            ? mutation.error.message
                            : "Không thể gửi yêu cầu. Vui lòng thử lại sau."}
                    </Alert>
                )}
                <Button
                    type="submit"
                    className="w-full"
                    loading={mutation.isPending}
                >
                    {mutation.isPending
                        ? "Đang gửi email…"
                        : mutation.isSuccess
                          ? "Gửi lại email khôi phục"
                          : "Yêu cầu đặt lại mật khẩu"}
                </Button>
            </form>
            {mutation.isSuccess && (
                <Link href="/reset-password" className="mt-4 flex min-h-11 items-center justify-center rounded-xl bg-primary px-4 text-sm font-semibold text-primary-foreground hover:bg-primary-hover">
                    Nhập mã OTP
                </Link>
            )}
            <div className="mt-5 flex flex-wrap items-center justify-between gap-x-4 gap-y-2 text-sm">
                <Link
                    href="/login"
                    className="inline-flex min-h-11 items-center gap-2 font-semibold text-primary hover:underline"
                >
                    <ArrowLeft aria-hidden="true" className="size-4" /> Quay lại
                    đăng nhập
                </Link>
                <Link
                    href="/register"
                    className="inline-flex min-h-11 items-center font-semibold text-primary hover:underline"
                >
                    Đăng ký tài khoản mới
                </Link>
            </div>
        </div>
    );
}
