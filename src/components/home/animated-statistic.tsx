"use client";

import { useEffect, useRef } from "react";

const NUMBER_FORMAT = new Intl.NumberFormat("en-US");

export function AnimatedStatistic({ value }: { value: string }) {
    const numberRef = useRef<HTMLSpanElement>(null);

    useEffect(() => {
        const element = numberRef.current;
        const target = Number(value.replaceAll(",", ""));
        if (!element || !Number.isFinite(target) || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

        let frameId: number;
        let startedAt: number | undefined;
        const animate = (timestamp: number) => {
            startedAt ??= timestamp;
            const progress = Math.min((timestamp - startedAt) / 1400, 1);
            element.textContent = progress === 1 ? value : NUMBER_FORMAT.format(Math.round(target * (1 - (1 - progress) ** 3)));
            if (progress < 1) frameId = requestAnimationFrame(animate);
        };

        frameId = requestAnimationFrame(animate);
        return () => cancelAnimationFrame(frameId);
    }, [value]);

    return <span className="inline-grid tabular-nums">
        <span className="invisible col-start-1 row-start-1" aria-hidden="true">{value}</span>
        <span ref={numberRef} className="col-start-1 row-start-1" aria-hidden="true">{value}</span>
        <span className="sr-only">{value}</span>
    </span>;
}
