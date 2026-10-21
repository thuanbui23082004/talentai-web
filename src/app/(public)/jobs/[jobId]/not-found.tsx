import Link from "next/link";
import { EmptyState } from "@/components/shared/empty-state";

export default function JobNotFound() {
    return (
        <main className="ui-container py-16">
            <EmptyState
                title="Không tìm thấy việc làm"
                description="Tin tuyển dụng không tồn tại hoặc đã ngừng hiển thị."
                action={
                    <Link
                        href="/jobs"
                        className="font-semibold text-primary hover:underline"
                    >
                        Xem các việc làm khác →
                    </Link>
                }
            />
        </main>
    );
}
