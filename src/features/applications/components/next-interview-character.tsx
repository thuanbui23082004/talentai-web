"use client";

import Image from "next/image";
import characterArt from "../../../../public/images/character.png";
import { ArrowRight, CalendarDays } from "lucide-react";
import { formatDate } from "@/lib/utils";
import { formatInterviewTime } from "../presentation";
import type { Interview } from "../types";

export function NextInterviewCharacter({ interview, onOpen }: { interview: Interview; onOpen: () => void }) {
    return <div className="@container relative mx-auto aspect-[2/1] w-full max-w-[640px] xl:absolute xl:right-0 xl:bottom-3 xl:w-[540px] 2xl:w-[600px]" data-interview-character>
        <Image src={characterArt} alt="" fill preload sizes="(min-width: 1536px) 600px, (min-width: 1280px) 540px, (min-width: 640px) 640px, 100vw" className="pointer-events-none object-contain" />
        {/* Safe area measured on the original 1774 × 887 artwork. Both image and text
            share this 2:1 coordinate system; never position against the viewport. */}
        <button type="button" aria-label="Xem lịch phỏng vấn" onClick={onOpen}
            className="absolute top-[40%] right-[6%] bottom-[12%] left-[39%] flex min-w-0 flex-col justify-between gap-[clamp(2px,0.5cqw,3px)] rounded-lg text-left text-foreground outline-offset-2 focus-visible:outline-2 focus-visible:outline-primary"
            data-interview-character-content>
            <span className="flex w-full items-center justify-between gap-2 text-[clamp(9px,2.2cqw,12px)] leading-tight font-semibold text-primary uppercase">
                <span className="flex min-w-0 items-center gap-1.5"><span aria-hidden="true" className="size-[clamp(4px,1.2cqw,6px)] shrink-0 rounded-full bg-primary" /><span className="truncate">Lịch hẹn gần nhất</span></span>
                <CalendarDays aria-hidden="true" className="size-[clamp(10px,2.6cqw,14px)] shrink-0" />
            </span>
            <span className="block w-full min-w-0">
                <span className="block truncate text-[clamp(11px,2.8cqw,15px)] leading-tight font-semibold" title={interview.jobTitle}>{interview.jobTitle ?? "Phỏng vấn tuyển dụng"}</span>
                <span className="mt-0.5 hidden truncate text-xs leading-tight text-muted-foreground @[520px]:block" title={interview.company?.name}>{interview.company?.name}</span>
            </span>
            <span className="flex items-center gap-1 text-[clamp(10px,2.5cqw,13px)] leading-tight font-semibold whitespace-nowrap">
                {formatDate(interview.startTime)}<span aria-hidden="true" className="px-1 text-border">/</span>{formatInterviewTime(interview.startTime)}
                <span className="hidden text-[11px] font-normal text-muted-foreground @[440px]:inline">GMT+7</span>
            </span>
            <span className="flex h-[clamp(20px,5.8cqw,36px)] w-full shrink-0 items-center justify-center gap-1.5 rounded-lg bg-secondary text-[clamp(10px,2.5cqw,13px)] leading-tight font-semibold text-primary">
                Xem lịch phỏng vấn<ArrowRight aria-hidden="true" className="size-[clamp(11px,2.7cqw,15px)] shrink-0" />
            </span>
        </button>
    </div>;
}
