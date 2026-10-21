import type { ReactNode } from "react";
import { SearchX } from "lucide-react";
import { cn } from "@/lib/utils";

export function EmptyState({
    title = "Chưa có kết quả phù hợp",
    description = "Thử thay đổi từ khóa hoặc mở rộng bộ lọc của bạn.",
    icon,
    action,
    className,
}: {
    title?: string;
    description?: string;
    icon?: ReactNode;
    action?: ReactNode;
    className?: string;
}) {
    return (
        <div
            className={cn(
                "flex flex-col items-center rounded-2xl border border-dashed border-border bg-card px-6 py-10 text-center",
                className,
            )}
        >
            <div className="mb-4 flex size-14 items-center justify-center rounded-2xl bg-secondary text-primary [&_svg]:size-6">
                {icon ?? <SearchX aria-hidden="true" />}
            </div>
            <h3 className="font-semibold">{title}</h3>
            <p className="mt-2 max-w-sm text-sm leading-relaxed text-muted-foreground">
                {description}
            </p>
            {action && <div className="mt-5">{action}</div>}
        </div>
    );
}
