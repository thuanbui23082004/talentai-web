import { Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";
import sprite from "../../../public/images/loading-mascot-sprite.webp";

type LoadingStateProps = {
    title?: string;
    description?: string;
    variant?: "page" | "section";
    className?: string;
};

/** Real pending state only: no artificial progress or minimum waiting time. */
export function LoadingState({
    title = "Đang chuẩn bị nội dung cho bạn",
    description = "",
    variant = "section",
    className,
}: LoadingStateProps) {
    return (
        <div
            role="status"
            aria-live="polite"
            aria-label={title}
            aria-busy="true"
            data-loading-state={variant}
            className={cn(
                "talent-loading-root",
                variant === "page"
                    ? "talent-loading-page"
                    : "talent-loading-section",
                className,
            )}
        >
            <div className="talent-loading-content">
                <p className="talent-loading-eyebrow"></p>
                <div aria-hidden="true" className="talent-loading-scene">
                    <span className="talent-loading-halo" />
                    <span className="talent-loading-float-card talent-loading-spark">
                        <Sparkles />
                    </span>
                    <span className="talent-loading-smoke">
                        <i />
                        <i />
                        <i />
                    </span>
                    <div
                        className="talent-loading-mascot"
                        style={{ backgroundImage: `url("${sprite.src}")` }}
                    />
                    <span className="talent-loading-ground" />
                </div>
                <div className="talent-loading-copy">
                    <p className="talent-loading-title">{title}</p>
                    <p className="talent-loading-description">{description}</p>
                </div>
                <div aria-hidden="true" className="talent-loading-track">
                    <span />
                </div>
                <p aria-hidden="true" className="talent-loading-wait">
                    Một chút thôi
                    <span className="talent-loading-dots">
                        <i />
                        <i />
                        <i />
                    </span>
                </p>
            </div>
        </div>
    );
}
