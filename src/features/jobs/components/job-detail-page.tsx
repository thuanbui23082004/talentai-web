import { JobDetailHeader } from "./job-detail-header";
import { JobCompanyCard } from "./job-company-card";
import Image from "next/image";
import Link from "next/link";
import type { ReactNode } from "react";
import {
    ArrowRight,
    BriefcaseBusiness,
    CircleHelp,
    Clock3,
    GraduationCap,
    MapPin,
    Sparkles,
    UsersRound,
    Wallet,
} from "lucide-react";
import { Badge, Input } from "@/components/ui";
import { formatDate, formatSalaryRange } from "@/lib/utils";
import { JobSearch } from "./job-search";
import { JobCard } from "./job-card";
import { TextList } from "./job-text-list";
import { JobShare } from "./job-share";
import { JOB_LEVEL_LABELS, WORK_TYPE_LABELS, experienceLabel } from "../labels";
import type { Job, JobDetail } from "../types";
import banner from "../../../../public/images/banner/banner3.png";

const educationLabels: Record<
    NonNullable<JobDetail["educationLevel"]>,
    string
> = {
    high_school: "Trung học phổ thông",
    vocational: "Trung cấp",
    college: "Cao đẳng",
    bachelor: "Đại học",
    master: "Thạc sĩ",
    doctorate: "Tiến sĩ",
    other: "Khác",
};
const surface =
    "rounded-2xl border border-border/50 bg-card p-5 shadow-card sm:p-7";

function ContentSection({
    title,
    children,
}: {
    title: string;
    children: ReactNode;
}) {
    return (
        <section className="space-y-4">
            <h2 className="border-l-[3px] border-primary pl-3 text-lg font-bold">
                {title}
            </h2>
            {children}
        </section>
    );
}

export function JobDetailPage({
    job,
    related,
}: {
    job: JobDetail;
    related: Job[];
}) {
    const address = [job.location.address, job.location.ward, job.location.city]
        .filter(Boolean)
        .join(", ");
    const overview = [
        {
            Icon: BriefcaseBusiness,
            label: "Cấp bậc",
            value: job.experienceLevel
                ? experienceLabel(job)
                : JOB_LEVEL_LABELS[job.level],
        },
        {
            Icon: Clock3,
            label: "Kinh nghiệm",
            value: experienceLabel(job),
        },
        {
            Icon: GraduationCap,
            label: "Học vấn",
            value: job.educationLevel
                ? educationLabels[job.educationLevel]
                : "Chưa cập nhật",
        },
        {
            Icon: Wallet,
            label: "Mức lương",
            value: formatSalaryRange(job.salary),
        },
        {
            Icon: UsersRound,
            label: "Số lượng tuyển",
            value: job.headcount ? `${job.headcount} người` : "Chưa cập nhật",
        },
        { Icon: MapPin, label: "Địa điểm", value: address },
    ];
    return (
        <main className="ui-container space-y-7 py-6 text-sm sm:py-8">
            <nav
                aria-label="Đường dẫn"
                className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground"
            >
                <Link href="/" className="hover:text-primary">
                    Trang chủ
                </Link>
                <span>/</span>
                <Link href="/jobs" className="hover:text-primary">
                    Việc làm
                </Link>
                <span>/</span>
                <span aria-current="page" className="text-foreground">
                    {job.title}
                </span>
            </nav>
            <JobSearch />

            <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,2fr)_minmax(280px,1fr)]">
                <div className="min-w-0 space-y-6">
                    <JobDetailHeader job={job} />

                    <article className={`${surface} space-y-8`}>
                        <ContentSection title="Mô tả công việc">
                            {/<[a-z][^>]*>/i.test(job.description) ? (
                                <TextList text={job.description} heading="Mô tả công việc" />
                            ) : (
                                <p className="text-sm leading-7">{job.description.split("\n")[0]}</p>
                            )}
                        </ContentSection>
                        {!/<[a-z][^>]*>/i.test(job.description) && job.description.includes("\n") && (
                            <ContentSection title="Trách nhiệm chính">
                                <TextList
                                    text={job.description
                                        .split("\n")
                                        .slice(1)
                                        .join("\n")}
                                />
                            </ContentSection>
                        )}
                        <ContentSection title="Yêu cầu ứng viên">
                            <TextList text={job.requirements} heading="Yêu cầu ứng viên" />
                        </ContentSection>
                        {job.benefits && (
                            <ContentSection title="Quyền lợi">
                                <TextList text={job.benefits} heading="Quyền lợi" />
                            </ContentSection>
                        )}
                        <ContentSection title="Địa điểm và cách ứng tuyển">
                            <div className="space-y-4 leading-6">
                                <div>
                                    <h3 className="font-semibold">
                                        Địa điểm làm việc
                                    </h3>
                                    <p className="mt-1 text-muted-foreground">
                                        {address}
                                    </p>
                                </div>
                                <div>
                                    <h3 className="font-semibold">
                                        Hình thức làm việc
                                    </h3>
                                    <p className="mt-1 text-muted-foreground">
                                        {WORK_TYPE_LABELS[job.workType]}
                                    </p>
                                </div>
                                {job.hiringRounds?.length ? (
                                    <div>
                                        <h3 className="font-semibold">
                                            Quy trình tuyển dụng
                                        </h3>
                                        <ol className="mt-2 list-inside list-decimal space-y-1 text-muted-foreground">
                                            {job.hiringRounds.map((round) => (
                                                <li key={round}>{round}</li>
                                            ))}
                                        </ol>
                                    </div>
                                ) : null}
                                {job.applicationDeadline && (
                                    <p className="font-semibold">
                                        Hạn ứng tuyển:{" "}
                                        {formatDate(job.applicationDeadline)}
                                    </p>
                                )}
                            </div>
                        </ContentSection>
                        <div>
                            <h3 className="font-semibold">Từ khóa</h3>
                            <div className="mt-3 flex flex-wrap gap-2">
                                {[
                                    WORK_TYPE_LABELS[job.workType],
                                    job.experienceLevel
                                        ? experienceLabel(job)
                                        : JOB_LEVEL_LABELS[job.level],
                                    ...(job.skills ?? []),
                                ].map((tag) => (
                                    <Badge key={tag} variant="outline">
                                        {tag}
                                    </Badge>
                                ))}
                            </div>
                        </div>
                        <JobShare title={job.title} />
                    </article>
                </div>
                <aside
                    aria-label="Thông tin tuyển dụng"
                    className="min-w-0 space-y-6"
                >
                    <JobCompanyCard job={job} />
                    <section className={surface}>
                        <h2 className="text-base font-bold">
                            Tổng quan công việc
                        </h2>
                        <dl className="mt-6 space-y-5">
                            {overview.map(({ Icon, label, value }) => (
                                <div
                                    key={label}
                                    className="flex items-start gap-3"
                                >
                                    <Icon
                                        aria-hidden="true"
                                        className="mt-0.5 size-5 shrink-0 text-primary"
                                    />
                                    <div className="min-w-0">
                                        <dt className="font-semibold">
                                            {label}
                                        </dt>
                                        <dd className="mt-1 text-sm leading-6 text-muted-foreground">
                                            {value}
                                        </dd>
                                    </div>
                                </div>
                            ))}
                        </dl>
                    </section>

                </aside>
            </div>
            <section aria-labelledby="related-title" className="pt-5">
                <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
                    <div>
                        <h2 id="related-title" className="text-2xl font-bold">
                            Việc làm liên quan
                        </h2>
                        <p className="mt-2 text-sm text-muted-foreground">
                            Khám phá thêm cơ hội tại {job.location.city}.
                        </p>
                    </div>
                    <Link
                        href={`/jobs?${new URLSearchParams({ city: job.location.city })}`}
                        className="inline-flex min-h-11 items-center gap-2 font-medium text-primary hover:underline"
                    >
                        Xem tất cả
                        <ArrowRight className="size-4" />
                    </Link>
                </div>
                {related.length ? (
                    <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
                        {related.map((item) => (
                            <JobCard key={item.id} job={item} />
                        ))}
                    </div>
                ) : (
                    <p className="rounded-xl border border-border bg-card p-5 text-muted-foreground">
                        Chưa có việc làm liên quan tại địa điểm này.
                    </p>
                )}
            </section>
            <Image
                src={banner}
                alt="Khám phá cơ hội nghề nghiệp cùng TalentAI"
                sizes="(min-width: 1280px) 1216px, 100vw"
                className="h-auto w-full rounded-2xl"
            />
        </main>
    );
}
