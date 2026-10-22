import { NotificationsPage } from "@/features/notifications";

export const metadata = { title: "Thông báo | TalentAI" };

export default async function CandidateNotificationsPage({ searchParams }: { searchParams: Promise<{ notification?: string | string[] }> }) {
    const { notification } = await searchParams;
    return <NotificationsPage selectedId={typeof notification === "string" ? notification : undefined} />;
}
