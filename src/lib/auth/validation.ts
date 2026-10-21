import { z } from "zod";

export const loginSchema = z.object({
    email: z
        .string()
        .trim()
        .toLowerCase()
        .pipe(
            z
                .email("Vui lòng nhập email hợp lệ.")
                .max(254, "Email không được quá 254 ký tự."),
        ),
    password: z.string().min(1, "Vui lòng nhập mật khẩu."),
});

export const registerSchema = z
    .object({
        fullName: z
            .string()
            .trim()
            .min(2, "Họ và tên cần ít nhất 2 ký tự.")
            .max(100, "Họ và tên không được quá 100 ký tự."),
        email: z
            .string()
            .trim()
            .toLowerCase()
            .pipe(
                z
                    .email("Vui lòng nhập email hợp lệ.")
                    .max(254, "Email không được quá 254 ký tự."),
            ),
        phone: z.string().trim().regex(/^\+?[0-9]{9,15}$/, "Số điện thoại cần 9–15 chữ số, có thể bắt đầu bằng +."),
        password: z
            .string()
            .min(8, "Mật khẩu cần ít nhất 8 ký tự.")
            .max(64, "Mật khẩu không được quá 64 ký tự.")
            .regex(/[A-Z]/, "Mật khẩu cần có chữ hoa.")
            .regex(/[a-z]/, "Mật khẩu cần có chữ thường.")
            .regex(/[0-9]/, "Mật khẩu cần có chữ số."),
        confirmPassword: z.string().min(1, "Vui lòng nhập lại mật khẩu."),
        role: z.enum(["candidate", "recruiter"]),
        acceptedPrivacyPolicy: z
            .boolean()
            .refine(
                (accepted) => accepted,
                "Bạn cần đồng ý với điều khoản và chính sách quyền riêng tư.",
            ),
    })
    .refine((value) => value.password === value.confirmPassword, {
        path: ["confirmPassword"],
        message: "Mật khẩu nhập lại chưa khớp.",
    });
