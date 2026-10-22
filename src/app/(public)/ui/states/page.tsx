import type { Metadata } from "next";
import { FeedbackShowcase } from "@/components/shared/feedback-showcase";

export const metadata: Metadata = { title: "Trạng thái giao diện | TalentAI", robots: { index: false, follow: false } };

export default function StatesPreviewPage() {
    return <FeedbackShowcase />;
}
