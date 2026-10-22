"use client";

import Link from "next/link";
import { Home, RotateCw } from "lucide-react";
import { Button } from "@/components/ui";
import { FeedbackPage } from "@/components/shared/feedback-page";

export default function Error({ retry }: { error: Error & { digest?: string }; retry: () => void }) {
  return <FeedbackPage kind="error" title="Có một chút gián đoạn" description="TalentAI chưa thể mở nội dung này. Bạn có thể thử lại hoặc quay về trang chủ để tiếp tục."
    action={<><Button onClick={retry}><RotateCw />Thử lại</Button><Button variant="outline" nativeButton={false} role="link" render={<Link href="/" />}><Home />Về trang chủ</Button></>} />;
}
