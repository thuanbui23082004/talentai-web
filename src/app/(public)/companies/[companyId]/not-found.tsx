import Link from "next/link";
import { FeedbackState } from "@/components/shared/feedback-state";
import { Button } from "@/components/ui";
export default function CompanyNotFound() {
    return <main className="ui-container py-10"><FeedbackState kind="not-found" variant="page" headingAs="h1" code="404" title="Không tìm thấy công ty" description="Công ty không tồn tại hoặc đã ngừng hiển thị." action={<Button nativeButton={false} role="link" render={<Link href="/companies" />}>Xem danh sách công ty →</Button>} /></main>;
}
