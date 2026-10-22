import Link from "next/link";
import { FeedbackState } from "@/components/shared/feedback-state";
import { Button } from "@/components/ui";

export default function JobNotFound() {
    return (
        <main className="ui-container py-16">
            <FeedbackState kind="not-found" variant="page" headingAs="h1" code="404"
                title="Không tìm thấy việc làm"
                description="Tin tuyển dụng không tồn tại hoặc đã ngừng hiển thị."
                action={
                    <Button nativeButton={false} role="link" render={<Link href="/jobs" />}>
                        Xem các việc làm khác →
                    </Button>
                }
            />
        </main>
    );
}
