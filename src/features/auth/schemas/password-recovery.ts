import { z } from "zod";
import { loginSchema } from "./auth";

export const forgotPasswordSchema = loginSchema.pick({ email: true });

export const resetPasswordSchema = z
    .object({
        newPassword: z.string()
            .min(8, "Mật khẩu cần ít nhất 8 ký tự.")
            .max(100, "Mật khẩu không được quá 100 ký tự."),
        confirmPassword: z.string().min(1, "Vui lòng nhập lại mật khẩu."),
    })
    .refine((value) => value.newPassword === value.confirmPassword, {
        path: ["confirmPassword"],
        message: "Mật khẩu nhập lại chưa khớp.",
    });
