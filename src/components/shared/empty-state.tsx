import type { ReactNode } from "react";
import { FeedbackState, type FeedbackStateProps } from "./feedback-state";

export function EmptyState({
    title = "Chưa có kết quả phù hợp",
    description = "Thử thay đổi từ khóa hoặc mở rộng bộ lọc của bạn.",
    icon,
    action,
    className,
    compact = false,
    illustration = "empty",
    headingAs = "h3",
}: {
    title?: string;
    description?: string;
    icon?: ReactNode;
    action?: ReactNode;
    className?: string;
    compact?: boolean;
    illustration?: FeedbackStateProps["kind"];
    headingAs?: FeedbackStateProps["headingAs"];
}) {
    return (
        <FeedbackState kind={illustration} title={title} description={description} icon={icon} action={action} className={className} variant={compact ? "compact" : "section"} headingAs={headingAs} />
    );
}
