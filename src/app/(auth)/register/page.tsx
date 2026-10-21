import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { RegisterForm } from "@/features/auth";
import { getSession } from "@/lib/auth/session";

export const metadata: Metadata = {
    title: "Đăng ký | TalentAI",
    robots: { index: false },
};

export default async function RegisterPage({
    searchParams,
}: {
    searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
    const session = await getSession();
    if (session) redirect(`/${session.role}/dashboard`);
    const query = await searchParams;
    return (
        <RegisterForm
            initialRole={query.role === "recruiter" ? "recruiter" : "candidate"}
        />
    );
}
