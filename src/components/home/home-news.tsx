"use client";

import Image from "next/image";
import { ArrowRight, ChartNoAxesCombined } from "lucide-react";
import { Modal, ModalContent, ModalTrigger } from "@/components/ui";
import type { HomeContent } from "@/lib/home-content";
import { formatDate } from "@/lib/utils";

export function HomeNews({ articles }: { articles: HomeContent["articles"] }) {
    return <section id="news" className="scroll-mt-8">
        <h2 className="text-2xl font-bold text-primary sm:text-3xl">Tin tức & cẩm nang</h2>
        <p className="mt-2 text-sm text-muted-foreground">Góc chia sẻ giúp bạn tự tin hơn trên hành trình sự nghiệp.</p>
        <div className="mt-7 grid gap-8 md:grid-cols-2">
            {articles.map((article, index) => <Modal key={article.id}>
                <article>
                    <ModalTrigger aria-label={`Đọc ${article.title}`} className="block w-full rounded-2xl text-left">
                        {article.image ? <div className="relative h-56 overflow-hidden rounded-2xl sm:h-64">
                            <Image src={article.image} alt={article.title} fill sizes="(min-width: 768px) 50vw, 100vw" className="object-cover" />
                        </div> : <div className={`relative isolate flex h-56 overflow-hidden rounded-2xl p-6 text-white sm:h-64 ${index === 0 ? "bg-footer" : "bg-info-foreground"}`}>
                            <div className="relative z-10 w-3/4">
                                <p className="text-[10px] font-semibold tracking-widest text-white/75">TALENTAI · {article.eyebrow}</p>
                                <p className="mt-5 text-2xl leading-tight font-extrabold whitespace-pre-line sm:text-3xl">{article.coverTitle}</p>
                                <span className="mt-5 inline-flex items-center gap-2 rounded-full bg-white/15 px-3 py-1.5 text-xs font-medium">Khám phá ngay<ArrowRight className="size-3" />
                                </span>
                            </div>
                            <div className="absolute -right-5 -bottom-8 size-56 rounded-full bg-brand-bright/50 blur-2xl" />
                            <Image src={index === 0 ? "/images/image 16.png" : "/images/image 15.png"} width={578} height={728} alt="" className="absolute -right-4 -bottom-10 w-40 opacity-90 sm:w-48" />
                            <ChartNoAxesCombined className="absolute right-5 bottom-4 size-12 text-white/30" />
                        </div>}
                    </ModalTrigger>
                    <p className="mt-4 text-xs text-muted-foreground">
                        <time dateTime={article.date}>{formatDate(article.date)}</time> · TalentAI</p>
                    <h3 className="mt-2 text-lg leading-snug font-semibold sm:text-xl">
                        <ModalTrigger className="line-clamp-2 text-left hover:text-primary">{article.title}</ModalTrigger>
                    </h3>
                    <ModalTrigger className="mt-3 inline-flex min-h-11 items-center gap-3 text-sm font-semibold text-primary">Đọc thêm<ArrowRight className="size-4" />
                    </ModalTrigger>
                </article>
                <ModalContent title={article.title} description={`Cẩm nang TalentAI · ${formatDate(article.date)}`} className="max-w-2xl">
                    <div className="space-y-4 text-sm leading-7 text-muted-foreground">{article.paragraphs.map((paragraph) => <p key={paragraph}>{paragraph}</p>)}</div>
                </ModalContent>
            </Modal>)}
        </div>
    </section>;
}
