"use client";

import { useState } from "react";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import type { z } from "zod";
import { Alert, Button, FormField, Input } from "@/components/ui";
import { useLogin } from "../hooks/use-auth";
import { loginSchema } from "../schemas/auth";
import { AuthRoleSwitch, type RegistrationRole } from "./auth-role-switch";
import { SocialLogin } from "./social-login";

export function LoginForm({
    initialRole = "candidate",
    reason,
}: {
    initialRole?: RegistrationRole;
    reason?: "expired" | "logged-out" | "registered";
}) {
    const [role, setRole] = useState(initialRole);
    const mutation = useLogin();
    const {
        register,
        handleSubmit,
        formState: { errors },
    } = useForm<z.infer<typeof loginSchema>>({
        resolver: zodResolver(loginSchema),
        mode: "onTouched",
        defaultValues: { email: "", password: "" },
    });
    return (
        <div>
            <h1 className="text-2xl font-bold tracking-tight">
                Đăng nhập tài khoản
            </h1>
            <p className="mt-3 text-[13px] leading-relaxed text-muted-foreground">
                {role === "candidate"
                    ? "Vui lòng điền thông tin của bạn để đăng nhập."
                    : "Lợi thế cho doanh nghiệp bằng trải nghiệm tuyển dụng thông minh."}
            </p>
            <div className="mt-6">
                <AuthRoleSwitch
                    value={role}
                    disabled={mutation.isPending}
                    onValueChange={(next) => {
                        setRole(next);
                        mutation.reset();
                    }}
                />
            </div>
            {reason && (
                <div className="mt-5">
                    <Alert
                        title={
                            reason === "expired"
                                ? "Phiên đăng nhập đã hết hạn"
                                : reason === "registered"
                                  ? "Đăng ký thành công"
                                  : "Bạn đã đăng xuất"
                        }
                        variant={reason === "expired" ? "warning" : "success"}
                    >
                        {reason === "registered"
                            ? "Vui lòng đăng nhập bằng tài khoản vừa tạo."
                            : "Đăng nhập để tiếp tục sử dụng TalentAI."}
                    </Alert>
                </div>
            )}
            <form
                noValidate
                className="mt-6 space-y-5"
                onSubmit={handleSubmit(async (values) => {
                    await mutation.mutateAsync(values).catch(() => undefined);
                })}
            >
                <FormField label="Email" error={errors.email?.message}>
                    {(field) => (
                        <Input
                            {...field}
                            {...register("email")}
                            type="email"
                            placeholder="nguyenvana@email.com"
                            autoComplete="username"
                            disabled={mutation.isPending}
                        />
                    )}
                </FormField>
                <FormField label="Mật khẩu" error={errors.password?.message}>
                    {(field) => (
                        <Input
                            {...field}
                            {...register("password")}
                            type="password"
                            placeholder="Nhập mật khẩu"
                            autoComplete="current-password"
                            disabled={mutation.isPending}
                        />
                    )}
                </FormField>
                {mutation.isError && (
                    <Alert variant="error" title="Không thể đăng nhập">
                        {mutation.error.message}
                    </Alert>
                )}
                <Button
                    type="submit"
                    className="w-full"
                    loading={mutation.isPending}
                >
                    {mutation.isPending ? "Đang đăng nhập…" : "Đăng nhập"}
                </Button>
            </form>
            <p className="mt-5 text-center text-xs text-muted-foreground">
                Chưa có tài khoản?{" "}
                <Link
                    href={`/register?role=${role}`}
                    className="font-semibold text-primary hover:underline"
                >
                    Đăng ký
                </Link>
            </p>
            <SocialLogin />
            <div className="mt-6 text-center">
                <Link
                    href="/jobs"
                    className="text-xs text-muted-foreground hover:text-primary"
                >
                    Tiếp tục khám phá việc làm
                </Link>
            </div>
        </div>
    );
}
