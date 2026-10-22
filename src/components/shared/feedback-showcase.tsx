"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowRight, RotateCw } from "lucide-react";
import { Button } from "@/components/ui";
import { FeedbackState } from "./feedback-state";

export function FeedbackShowcase() {
    const [simulateError, setSimulateError] = useState(false);
    const [retried, setRetried] = useState(false);
    if (simulateError) throw new Error("FEEDBACK_PREVIEW_ERROR");
    return <main className="ui-container space-y-7 py-10">
        <div className="max-w-2xl space-y-2"><h1 className="text-2xl font-bold">Nhân vật & trạng thái giao diện</h1><p className="text-sm leading-6 text-muted-foreground">Bộ hình dùng chung cho trang không tồn tại, danh sách trống và lỗi tải. Đây là trang minh họa, không thay đổi dữ liệu tài khoản.</p></div>
        <div className="grid gap-5 lg:grid-cols-3">
            <FeedbackState kind="not-found" code="404" title="Một chút lạc đường" description="Trang bạn tìm có thể đã chuyển đến nơi khác." action={<Button nativeButton={false} role="link" render={<Link href="/ui/page-not-found-preview" />}>Xem trang 404<ArrowRight /></Button>} />
            <FeedbackState kind="empty" title="Chưa có kết quả phù hợp" description="Thử đổi từ khóa hoặc mở rộng bộ lọc để khám phá thêm cơ hội." action={<Button variant="outline" nativeButton={false} role="link" render={<Link href="/jobs" />}>Khám phá việc làm</Button>} />
            <FeedbackState kind="error" title="Kết nối đang gián đoạn" description={retried ? "Bạn vừa nhấn thử lại trong bản xem trước." : "Một trục trặc nhỏ. Bạn có thể kết nối lại để tiếp tục."} action={<Button variant="outline" onClick={() => setRetried(true)}><RotateCw />Thử lại bản xem trước</Button>} />
        </div>
        <section className="max-w-sm"><h2 className="mb-3 text-base font-semibold">Phiên bản gọn cho popup</h2><FeedbackState variant="compact" title="Chưa có thông báo" description="Các cập nhật mới sẽ xuất hiện tại đây." /></section>
        <div className="flex flex-wrap items-center gap-3 border-t border-border pt-5"><Button variant="outline" onClick={() => setSimulateError(true)}>Xem thử lỗi trang</Button><p className="text-xs text-muted-foreground">Mở error boundary thật; nhấn “Thử lại” để quay về bản xem trước.</p></div>
    </main>;
}
