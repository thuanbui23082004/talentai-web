import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { LoginForm } from "@/features/auth";
import { getSession } from "@/lib/auth/session";

export const metadata: Metadata = {
    title: "Đăng nhập | TalentAI",
    robots: { index: false },
};

export default async function LoginPage({
    searchParams,
}: {
    searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
    const session = await getSession();
    if (session) redirect(`/${session.role}/dashboard`);
    const query = await searchParams;
    const reason =
        query.reason === "expired" ||
        query.reason === "logged-out" ||
        query.reason === "registered"
            ? query.reason
            : undefined;
    return (
        <LoginForm
            initialRole={query.role === "recruiter" ? "recruiter" : "candidate"}
            reason={reason}
        />
    );
}
