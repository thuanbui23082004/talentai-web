"use client";

import { Button } from "@/components/ui";
import { FeedbackState } from "@/components/shared/feedback-state";

export default function JobDetailError({ retry }: { retry: () => void }) {
    return (
        <main className="ui-container py-12">
            <FeedbackState kind="error" variant="page" headingAs="h1"
                title="Không thể tải thông tin công việc. Vui lòng thử lại."
                description="Kết nối có thể đang bị gián đoạn. Hãy thử tải lại để tiếp tục khám phá vị trí này."
                action={<Button onClick={retry}>
                    Thử lại
                </Button>}
            />
        </main>
    );
}
