import type { ComponentProps, ReactNode } from "react";
import { CheckCircle2, CircleAlert, Info, TriangleAlert } from "lucide-react";
import { cn } from "@/lib/utils";

const variants = {
    info: {
        icon: Info,
        style: "border-info/20 bg-info-soft text-info-foreground",
    },
    success: {
        icon: CheckCircle2,
        style: "border-success/20 bg-success-soft text-success-foreground",
    },
    warning: {
        icon: TriangleAlert,
        style: "border-warning/20 bg-warning-soft text-warning-foreground",
    },
    error: {
        icon: CircleAlert,
        style: "border-destructive/20 bg-destructive-soft text-destructive",
    },
};
export function Alert({
    variant = "info",
    title,
    children,
    className,
    ...props
}: Omit<ComponentProps<"div">, "title"> & {
    variant?: keyof typeof variants;
    title: ReactNode;
}) {
    const { icon: Icon, style } = variants[variant];
    return (
        <div
            role={variant === "error" ? "alert" : "status"}
            {...props}
            className={cn(
                "flex items-start gap-3 rounded-xl border p-4 text-sm",
                style,
                className,
            )}
        >
            <Icon className="mt-0.5 size-4.5 shrink-0" aria-hidden="true" />
            <div className="min-w-0">
                <p className="font-semibold">{title}</p>
                {children && (
                    <div className="mt-1 text-xs leading-relaxed">
                        {children}
                    </div>
                )}
            </div>
        </div>
    );
}
