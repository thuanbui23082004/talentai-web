import type { Metadata } from "next";
import { UiShowcase } from "@/components/shared/ui-showcase";

export const metadata: Metadata = { title: "Bộ giao diện | TalentAI", description: "Các thành phần giao diện dùng chung của TalentAI: hiện đại, rõ ràng và nhất quán.", robots: { index: false, follow: false } };

export default function UiPage() { return <UiShowcase />; }
