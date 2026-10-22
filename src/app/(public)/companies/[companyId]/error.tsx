"use client";
import { Button } from "@/components/ui";
import { FeedbackState } from "@/components/shared/feedback-state";
export default function CompanyError({ retry }: { retry: () => void }) {
    return <main className="ui-container py-10"><FeedbackState kind="error" variant="page" headingAs="h1" title="Không thể tải thông tin công ty. Vui lòng thử lại." description="TalentAI đang gặp một chút gián đoạn. Bạn có thể thử kết nối lại để xem thông tin doanh nghiệp." action={<Button onClick={retry}>Thử lại</Button>} /></main>;
}
