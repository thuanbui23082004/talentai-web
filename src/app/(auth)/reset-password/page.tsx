import type { Metadata } from "next";
import { ResetPasswordForm } from "@/features/auth";

export const metadata: Metadata = {
    title: "Đặt lại mật khẩu | TalentAI",
    robots: { index: false, follow: false },
    referrer: "no-referrer",
};

export default function ResetPasswordPage() {
    return <ResetPasswordForm />;
}
