import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { LogoutPanel } from "@/features/auth";
import { getSession } from "@/lib/auth/session";

export const metadata: Metadata = {
    title: "Đăng xuất | TalentAI",
    robots: { index: false },
};

// Legacy URL immediately revokes the session on the client with CSRF.
export default async function LogoutPage() {
    const session = await getSession();
    if (!session) redirect("/login?reason=logged-out");
    return <LogoutPanel />;
}
