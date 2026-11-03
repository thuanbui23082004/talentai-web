"use client";

import Link from "next/link";
import { ArrowLeft, Mail } from "lucide-react";
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
            <h1 className="text-2xl font-bold tracking-tight">
                Quên mật khẩu?
            </h1>
            <p className="mt-3 text-[13px] leading-relaxed text-muted-foreground">
                Nhập email đã đăng ký để yêu cầu đặt lại mật khẩu của bạn.
            </p>
            {mutation.isSuccess ? (
                <div className="mt-6 space-y-5" role="status">
                    <Alert variant="success" title="Yêu cầu đã được tiếp nhận">
                        {mutation.data.resetToken
                            ? "Môi trường thử nghiệm chưa gửi email. Bạn có thể dùng liên kết bên dưới để đặt lại mật khẩu. Liên kết có hiệu lực 15 phút và chỉ dùng một lần."
                            : "Dịch vụ gửi email khôi phục hiện chưa được hỗ trợ. Bạn cần liên kết khôi phục hợp lệ để đặt lại mật khẩu."}
                    </Alert>
                    {mutation.data.resetToken && (
                        <Link
                            href={`/reset-password?token=${encodeURIComponent(mutation.data.resetToken)}`}
                            prefetch={false}
                            className="flex min-h-11 items-center justify-center rounded-xl bg-primary px-4 text-sm font-semibold text-primary-foreground hover:bg-primary-hover"
                        >
                            Tiếp tục đặt lại mật khẩu
                        </Link>
                    )}
                    <Button
                        variant="outline"
                        className="w-full"
                        onClick={() => mutation.reset()}
                    >
                        Sử dụng email khác
                    </Button>
                </div>
            ) : (
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
                            ? "Đang gửi yêu cầu…"
                            : "Yêu cầu đặt lại mật khẩu"}
                    </Button>
                </form>
            )}
            <Link
                href="/login"
                className="mt-6 flex min-h-11 items-center justify-center gap-2 text-sm font-semibold text-primary hover:underline"
            >
                <ArrowLeft aria-hidden="true" className="size-4" /> Quay lại
                đăng nhập
            </Link>
        </div>
    );
}
