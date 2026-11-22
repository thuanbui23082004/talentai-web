"use client";

import Link from "next/link";
import { BellRing, ChevronDown, MessagesSquare } from "lucide-react";
import { useSession } from "@/features/auth";
import { NotificationPopover } from "@/features/notifications";
import { NavigationDetails } from "@/components/shared/navigation-details";
import { AvailabilityButton } from "@/components/shared/availability-button";

const actionClass =
    "group relative flex size-9 items-center justify-center rounded-full text-white/85 transition-colors hover:bg-white hover:text-primary focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white";

export function SiteHeaderActions() {
    const { user, isPending } = useSession();
    if (isPending)
        return (
            <span
                className="h-11 w-24 animate-pulse rounded-full bg-white/10"
                aria-label="Đang tải tiện ích tài khoản"
            />
        );
    if (!user) return <></>;
    return (
        <div
            className="flex shrink-0 items-center gap-1 rounded-full border border-white/15 bg-white/10 p-1"
            aria-label="Tin nhắn và thông báo"
        >
            <AvailabilityButton
                title="Tin nhắn"
                description="Khu vực tin nhắn đang được hoàn thiện."
                className={actionClass}
            >
                <MessagesSquare
                    className="size-[18px] stroke-[1.8]"
                    aria-hidden="true"
                />
                <span className="sr-only">Tin nhắn</span>
            </AvailabilityButton>
            <span className="h-5 w-px bg-white/15" aria-hidden="true" />
            {user.role === "candidate" ? (
                <NotificationPopover />
            ) : (
                <AvailabilityButton
                    title="Thông báo"
                    description="Thông báo cho tài khoản này đang được hoàn thiện."
                    className={actionClass}
                >
                    <BellRing
                        className="size-[18px] stroke-[1.8]"
                        aria-hidden="true"
                    />
                    <span className="sr-only">Thông báo</span>
                </AvailabilityButton>
            )}
        </div>
    );
}
