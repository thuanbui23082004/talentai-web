"use client";

import { ChevronLeft, ChevronRight, Ellipsis } from "lucide-react";
import { Button } from "./button";
import { cn } from "@/lib/utils";

export function Pagination({
    page,
    totalPages,
    onPageChange,
    disabled,
    className,
}: {
    page: number;
    totalPages: number;
    onPageChange: (page: number) => void;
    disabled?: boolean;
    className?: string;
}) {
    const total = Math.max(0, Math.floor(totalPages));
    if (total < 1) return null;
    const current = Math.max(1, Math.min(total, Math.floor(page)));
    const pages = [
        ...new Set([
            1,
            Math.max(1, current - 1),
            current,
            Math.min(total, current + 1),
            total,
        ]),
    ].sort((a, b) => a - b);
    return (
        <nav
            aria-label="Phân trang"
            className={cn(
                "flex flex-wrap items-center justify-center gap-1.5",
                className,
            )}
        >
            <Button
                variant="outline"
                size="icon-sm"
                aria-label="Trang trước"
                disabled={disabled || current === 1}
                onClick={() => onPageChange(current - 1)}
            >
                <ChevronLeft />
            </Button>
            {pages.map((number, index) => (
                <span key={number} className="inline-flex items-center gap-1.5">
                    {index > 0 && number - pages[index - 1] > 1 && (
                        <span
                            aria-hidden="true"
                            className="flex size-6 items-center justify-center text-muted-foreground"
                        >
                            <Ellipsis className="size-4" />
                        </span>
                    )}
                    <Button
                        variant={number === current ? "primary" : "outline"}
                        size="icon-sm"
                        disabled={disabled}
                        aria-label={`Trang ${number}`}
                        aria-current={number === current ? "page" : undefined}
                        onClick={() => onPageChange(number)}
                    >
                        {number}
                    </Button>
                </span>
            ))}
            <Button
                variant="outline"
                size="icon-sm"
                aria-label="Trang sau"
                disabled={disabled || current === total}
                onClick={() => onPageChange(current + 1)}
            >
                <ChevronRight />
            </Button>
        </nav>
    );
}
