import type { Metadata } from "next";
import { ForgotPasswordForm } from "@/features/auth";

export const metadata: Metadata = {
    title: "Quên mật khẩu | TalentAI",
    robots: { index: false, follow: false },
};

export default function ForgotPasswordPage() {
    return <ForgotPasswordForm />;
}
