import type { Metadata } from "next";
import { LoadingState } from "@/components/shared/loading-state";

export const metadata: Metadata = { title: "Xem thử loading | TalentAI" };

export default function LoadingPreviewPage() {
    return (
        <main>
            <LoadingState variant="page" title="Cơ hội mới đang đến gần" />
            <section className="ui-container space-y-5 py-10">
                <h1 className="text-xl font-bold">
                    Loading trong vùng dữ liệu
                </h1>
                <p className="text-muted-foreground">
                    Bản xem thử. Trong ứng dụng, hiệu ứng tự kết thúc khi dữ
                    liệu tải xong.
                </p>
                <LoadingState title="Đang tải việc làm" description="" />
            </section>
        </main>
    );
}
