import type { Metadata } from "next";
import { requireRole } from "@/lib/auth/require-role";
import { CompanyOnboarding } from "@/features/company";

export const metadata: Metadata = { title: "Hoàn thiện hồ sơ công ty | TalentAI" };

export default async function CompanyOnboardingPage() {
    await requireRole("recruiter");
    return <CompanyOnboarding />;
}
