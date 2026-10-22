import Link from "next/link";
import { ArrowRight, Home } from "lucide-react";
import { Button } from "@/components/ui";
import { FeedbackPage } from "@/components/shared/feedback-page";

export default function NotFound() {
  return <FeedbackPage kind="not-found" code="404" title="Có vẻ bạn đã đi lạc" description="Trang bạn đang tìm không tồn tại hoặc đã được chuyển đến địa chỉ khác. Cùng quay lại để tìm cơ hội phù hợp nhé."
    action={<><Button nativeButton={false} role="link" render={<Link href="/" />}><Home />Về trang chủ</Button><Button variant="outline" nativeButton={false} role="link" render={<Link href="/jobs" />}>Tìm việc làm<ArrowRight /></Button></>} />;
}
