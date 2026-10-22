import type { Metadata } from "next";
import { CvManagementPage } from "@/features/cv";
import { requireRole } from "@/lib/auth/require-role";

export const metadata: Metadata = { title: "Quản lý CV & Mẫu CV | TalentAI" };

export default async function CandidateCvPage() {
    await requireRole("candidate");
    return <CvManagementPage />;
}
