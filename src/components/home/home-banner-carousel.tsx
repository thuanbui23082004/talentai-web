"use client";

import Image from "next/image";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useEffect, useState } from "react";
import banner1 from "../../../public/images/banner/banner1.png";
import banner2 from "../../../public/images/banner/banner2.png";
import banner3 from "../../../public/images/banner/banner3.png";

const banners = [banner1, banner2, banner3];

export function HomeBannerCarousel() {
    const [active, setActive] = useState(0);

    useEffect(() => {
        const timer = setInterval(() => {
            setActive((current) => (current + 1) % banners.length);
        }, 5000);
        return () => clearInterval(timer);
    }, []);

    return (
        <div aria-label="Banner cơ hội việc làm" aria-roledescription="trình chiếu" className="relative min-h-64 overflow-hidden rounded-xl bg-secondary">
            {banners.map((src, index) => (
                <div key={src.src} aria-hidden={index !== active} className={`absolute inset-0 transition-opacity duration-500 motion-reduce:transition-none ${index === active ? "opacity-100" : "opacity-0"}`}>
                    <Image src={src} alt={`Banner việc làm ${index + 1}`} fill sizes="(min-width: 1024px) 70vw, 100vw" className="object-contain" />
                </div>
            ))}
            <button type="button" aria-label="Banner trước" onClick={() => setActive((current) => (current - 1 + banners.length) % banners.length)} className="absolute top-1/2 left-3 flex size-11 -translate-y-1/2 items-center justify-center rounded-full bg-card/90 text-primary shadow-sm hover:bg-card focus-visible:outline-2 focus-visible:outline-primary">
                <ChevronLeft className="size-6" />
            </button>
            <button type="button" aria-label="Banner tiếp theo" onClick={() => setActive((current) => (current + 1) % banners.length)} className="absolute top-1/2 right-3 flex size-11 -translate-y-1/2 items-center justify-center rounded-full bg-card/90 text-primary shadow-sm hover:bg-card focus-visible:outline-2 focus-visible:outline-primary">
                <ChevronRight className="size-6" />
            </button>
            <div className="absolute inset-x-0 bottom-1 flex justify-center gap-1">
                {banners.map((src, index) => (
                    <button key={src.src} type="button" aria-label={`Xem banner ${index + 1}`} aria-pressed={active === index} onClick={() => setActive(index)} className="flex size-8 items-center justify-center rounded-full focus-visible:outline-2 focus-visible:outline-primary">
                        <span className={`h-2 rounded-full shadow-sm transition-all ${active === index ? "w-6 bg-primary" : "w-2 bg-card"}`} />
                    </button>
                ))}
            </div>
        </div>
    );
}
