import type { Metadata } from "next";
import { ApplicationDialogShowcase } from "@/features/applications";

export const metadata: Metadata = { title: "Xem thử popup ứng tuyển | TalentAI", robots: { index: false, follow: false } };

export default function ApplicationPreviewPage() {
    return <ApplicationDialogShowcase />;
}
