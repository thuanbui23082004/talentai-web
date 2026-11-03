import type { Metadata } from "next";
import { ResetPasswordForm } from "@/features/auth";

export const metadata: Metadata = {
    title: "Đặt lại mật khẩu | TalentAI",
    robots: { index: false, follow: false },
    referrer: "no-referrer",
};

export default async function ResetPasswordPage({ searchParams }: {
    searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
    const { token } = await searchParams;
    return <ResetPasswordForm token={typeof token === "string" && token.trim() ? token : undefined} />;
}
