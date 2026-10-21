import Image from "next/image";
import Link from "next/link";
import type { ReactNode } from "react";
import {
    ArrowRight,
    Bookmark,
    BriefcaseBusiness,
    Building2,
    CalendarDays,
    Check,
    CircleHelp,
    Clock3,
    GraduationCap,
    MapPin,
    Sparkles,
    UsersRound,
    Wallet,
} from "lucide-react";
import { Badge, Input } from "@/components/ui";
import { AvailabilityButton } from "@/components/shared/availability-button";
import { formatDate, formatDeadline, formatSalaryRange } from "@/lib/utils";
import { JobSearch } from "./job-search";
import { JobCard } from "./job-card";
import { JobShare } from "./job-share";
import { JOB_LEVEL_LABELS, WORK_TYPE_LABELS } from "../labels";
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

function TextList({ text }: { text: string }) {
    return (
        <ul className="space-y-3">
            {text
                .split("\n")
                .filter(Boolean)
                .map((line, index) => (
                    <li
                        key={index}
                        className="flex items-start gap-3 text-sm leading-7"
                    >
                        <Check
                            aria-hidden="true"
                            className="mt-1.5 size-4 shrink-0 text-primary"
                        />
                        <span>{line}</span>
                    </li>
                ))}
        </ul>
    );
}

export function JobDetailPage({
    job,
    related,
}: {
    job: JobDetail;
    related: Job[];
}) {
    const companyName = job.company.name.replace("Công ty mẫu ", "");
    const address = [job.location.address, job.location.ward, job.location.city]
        .filter(Boolean)
        .join(", ");
    const companyJobs = `/jobs?${new URLSearchParams({ q: job.company.name })}`;
    const unavailable =
        "Tính năng này đang được hoàn thiện. Hiện chưa gửi hồ sơ hoặc lưu công việc từ trang này.";
    const overview = [
        {
            Icon: BriefcaseBusiness,
            label: "Cấp bậc",
            value: JOB_LEVEL_LABELS[job.level],
        },
        {
            Icon: Clock3,
            label: "Kinh nghiệm",
            value: job.minExperienceYears
                ? `Từ ${job.minExperienceYears} năm`
                : "Không yêu cầu kinh nghiệm",
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
            <section
                aria-labelledby="job-title"
                className={`${surface} flex flex-col gap-5 sm:flex-row sm:items-center`}
            >
                <div
                    aria-hidden="true"
                    className="flex size-24 shrink-0 items-center justify-center rounded-xl border border-border/50 bg-secondary/15 p-3 text-center text-lg font-extrabold text-primary sm:size-28"
                >
                    {companyName}
                </div>
                <div className="min-w-0 flex-1">
                    <div className="mb-2 flex flex-wrap items-center gap-2">
                        <Badge variant="outline">Đang tuyển</Badge>
                        {job.postedAt && (
                            <span className="text-xs text-muted-foreground">
                                Đăng ngày {formatDate(job.postedAt)}
                            </span>
                        )}
                    </div>
                    <h1
                        id="job-title"
                        className="text-xl leading-snug font-bold sm:text-2xl"
                    >
                        {job.title}
                    </h1>
                    <Link
                        href={companyJobs}
                        className="mt-2 inline-block font-medium text-primary hover:underline"
                    >
                        {job.company.name}
                    </Link>
                    <div className="mt-4 flex flex-wrap gap-x-5 gap-y-3 text-sm text-muted-foreground">
                        {[
                            {
                                Icon: Clock3,
                                text: WORK_TYPE_LABELS[job.workType],
                            },
                            {
                                Icon: Wallet,
                                text: formatSalaryRange(job.salary, true),
                            },
                            {
                                Icon: MapPin,
                                text: [job.location.ward, job.location.city]
                                    .filter(Boolean)
                                    .join(", "),
                            },
                            {
                                Icon: CalendarDays,
                                text: formatDeadline(job.applicationDeadline),
                            },
                        ].map(({ Icon, text }) => (
                            <span
                                key={text}
                                className="inline-flex items-center gap-2"
                            >
                                <Icon
                                    aria-hidden="true"
                                    className="size-4 shrink-0 text-primary"
                                />
                                {text}
                            </span>
                        ))}
                    </div>
                </div>
                <div className="flex shrink-0 flex-col gap-3 sm:w-44">
                    <AvailabilityButton
                        title="Lưu công việc"
                        description={unavailable}
                        className="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg bg-muted px-4 py-3 font-medium hover:bg-secondary"
                    >
                        <Bookmark className="size-4" />
                        Lưu công việc
                    </AvailabilityButton>
                    <AvailabilityButton
                        title="Ứng tuyển công việc"
                        description={unavailable}
                        className="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg bg-primary px-4 py-3 font-semibold text-white shadow-button hover:bg-brand-deep"
                    >
                        Ứng tuyển ngay
                        <ArrowRight className="size-4" />
                    </AvailabilityButton>
                </div>
            </section>
            <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,2fr)_minmax(280px,1fr)]">
                <div className="min-w-0 space-y-6">
                    <section
                        className="rounded-2xl border border-primary/10 bg-gradient-to-br from-secondary to-card p-5 shadow-card sm:p-6"
                        aria-labelledby="match-title"
                    >
                        <div className="flex flex-wrap items-center justify-between gap-3">
                            <h2
                                id="match-title"
                                className="flex items-center gap-2 font-bold text-primary"
                            >
                                <Sparkles className="size-5" />
                                Bạn phù hợp với công việc này?
                            </h2>
                            <Badge variant="outline">Gợi ý từ AI</Badge>
                        </div>
                        <p className="mt-3 text-sm leading-6 text-muted-foreground">
                            Chưa có kết quả phân tích CV của bạn. Tham khảo các
                            kỹ năng trong tin tuyển dụng để chuẩn bị hồ sơ phù
                            hợp.
                        </p>
                        <div className="mt-4 grid gap-3 sm:grid-cols-2">
                            {(job.skills ?? []).slice(0, 4).map((skill) => (
                                <div
                                    key={skill}
                                    className="flex items-start gap-2 rounded-lg border border-primary/10 bg-card p-3"
                                >
                                    <CircleHelp className="mt-0.5 size-4 shrink-0 text-primary" />
                                    <div>
                                        <p className="font-medium">{skill}</p>
                                        <p className="mt-1 text-xs text-muted-foreground">
                                            Kỹ năng nhà tuyển dụng quan tâm
                                        </p>
                                    </div>
                                </div>
                            ))}
                        </div>
                        <p className="mt-4 text-xs text-muted-foreground">
                            Phân tích mức độ phù hợp từ CV: sắp ra mắt.
                        </p>
                    </section>
                    <article className={`${surface} space-y-8`}>
                        <ContentSection title="Mô tả công việc">
                            <p className="text-sm leading-7">
                                {job.description.split("\n")[0]}
                            </p>
                        </ContentSection>
                        {job.description.includes("\n") && (
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
                            <TextList text={job.requirements} />
                        </ContentSection>
                        {job.benefits && (
                            <ContentSection title="Quyền lợi">
                                <TextList text={job.benefits} />
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
                                    JOB_LEVEL_LABELS[job.level],
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
                    <section className={surface}>
                        <h2 className="text-base font-bold">Về công ty</h2>
                        <div className="mt-5 flex items-center gap-3">
                            <span
                                aria-hidden="true"
                                className="flex size-14 shrink-0 items-center justify-center rounded-lg bg-secondary p-2 text-center text-xs font-bold text-primary"
                            >
                                {companyName}
                            </span>
                            <div className="min-w-0">
                                <h3 className="font-semibold">
                                    {job.company.name}
                                </h3>
                                <Link
                                    href={companyJobs}
                                    className="mt-1 inline-block text-xs font-medium text-primary hover:underline"
                                >
                                    Xem việc làm tại công ty →
                                </Link>
                            </div>
                        </div>
                        <div className="mt-5 space-y-3 text-sm leading-6 text-muted-foreground">
                            <p className="flex items-start gap-2">
                                <Building2 className="mt-1 size-4 shrink-0" />
                                {job.industry?.name ??
                                    "Thông tin ngành nghề chưa cập nhật"}
                            </p>
                            <p className="flex items-start gap-2">
                                <MapPin className="mt-1 size-4 shrink-0" />
                                {address}
                            </p>
                        </div>
                        <a
                            href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address)}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="mt-5 flex min-h-28 items-center justify-center gap-2 rounded-xl border border-primary/10 bg-secondary/50 p-5 text-center font-medium text-primary hover:bg-secondary"
                        >
                            <MapPin className="size-5" />
                            Xem địa điểm trên bản đồ
                            <ArrowRight className="size-4" />
                        </a>
                    </section>
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
                    <section className="rounded-2xl bg-secondary/60 p-5 sm:p-6">
                        <h2 className="text-lg font-bold">
                            Liên hệ nhà tuyển dụng
                        </h2>
                        <p className="mt-2 text-xs leading-5 text-muted-foreground">
                            Tính năng liên hệ đang được hoàn thiện.
                        </p>
                        <fieldset disabled className="mt-5 space-y-4">
                            <Input
                                aria-label="Họ và tên"
                                placeholder="Họ và tên"
                            />
                            <Input
                                type="email"
                                aria-label="Địa chỉ email"
                                placeholder="Địa chỉ email"
                            />
                            <Input
                                type="tel"
                                aria-label="Số điện thoại"
                                placeholder="Số điện thoại"
                            />
                            <label className="block">
                                <span className="sr-only">
                                    Nội dung liên hệ
                                </span>
                                <textarea
                                    disabled
                                    placeholder="Nội dung liên hệ"
                                    className="min-h-32 w-full resize-none rounded-xl border border-border bg-card p-3 text-sm disabled:opacity-60"
                                />
                            </label>
                            <button
                                disabled
                                type="button"
                                className="min-h-11 w-full rounded-lg bg-primary px-4 font-semibold text-white opacity-60"
                            >
                                Gửi liên hệ · Sắp ra mắt
                            </button>
                        </fieldset>
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
