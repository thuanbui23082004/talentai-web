"use client";

import { useEffect, useRef, useState } from "react";
import type { CVData } from "../../types/cv";
import { getCvTemplate } from "../../templates/registry";

const A4_WIDTH_PX = (210 / 25.4) * 96;

export function CvPreview({ data, templateId, theme, background, hidden }: {
    data: CVData;
    templateId: string;
    theme: string;
    background: string;
    hidden: boolean;
}) {
    const container = useRef<HTMLDivElement>(null);
    const [scale, setScale] = useState(0.6);
    const Template = getCvTemplate(templateId).component;

    useEffect(() => {
        const element = container.current;
        if (!element) return;
        const observer = new ResizeObserver(entries => {
            const width = entries[0]?.contentRect.width ?? 0;
            if (width > 0) setScale(Math.min(1, (width - 24) / A4_WIDTH_PX));
        });
        observer.observe(element);
        return () => observer.disconnect();
    }, []);

    return <div ref={container} className={`${hidden ? "hidden lg:block" : ""} min-w-0 overflow-auto rounded-xl bg-muted p-3`}>
        <div className="mx-auto w-fit" style={{ zoom: scale }} aria-label="Xem trước CV">
            <Template data={data} theme={theme} background={background} />
        </div>
    </div>;
}
