import { Check, CircleHelp, Sparkles } from "lucide-react";
import type { components } from "@/lib/api/generated/schema";

type MatchingPreview = components["schemas"]["MatchingPreview"];
type FieldScore = components["schemas"]["MatchingPreviewFieldScore"];

const criteria = [
    { key: "roles", label: "Vai trò", maximum: 20 },
    { key: "education", label: "Học vấn", maximum: 10 },
    { key: "languages", label: "Ngoại ngữ", maximum: 5 },
    { key: "locations", label: "Địa điểm", maximum: 5 },
    { key: "experience", label: "Kinh nghiệm", maximum: 25 },
    { key: "skills", label: "Kỹ năng", maximum: 35 },
] as const;

const numberFormat = new Intl.NumberFormat("vi-VN", {
    maximumFractionDigits: 1,
});

export function CandidateMatchingResult({
    result,
    jobTitle,
}: {
    result: MatchingPreview;
    jobTitle: string;
}) {
    return (
        <div
            aria-live="polite"
            className="matching-result-content space-y-5 pt-5"
        >
            <div className="grid items-center gap-6 sm:grid-cols-[152px_1fr]">
                <div
                    className="matching-score mx-auto flex size-36 items-center justify-center rounded-full p-3"
                    style={{
                        background: `conic-gradient(var(--primary) 0 ${result.score ?? 0}%, var(--secondary) ${result.score ?? 0}% 100%)`,
                    }}
                >
                    <div className="flex size-full flex-col items-center justify-center rounded-full bg-card">
                        <strong className="text-3xl text-brand-deep">
                            {numberFormat.format(result.score ?? 0)}%
                        </strong>
                        <span className="text-xs text-muted-foreground">
                            Mức độ phù hợp
                        </span>
                    </div>
                </div>
                <div>
                    <h3 className="font-bold">{jobTitle}</h3>
                    {result.explanation && (
                        <p className="mt-2 text-sm leading-6 text-muted-foreground">
                            {result.explanation}
                        </p>
                    )}
                    <p className="mt-3 text-xs text-muted-foreground">
                        Điểm ngữ nghĩa:{" "}
                        {numberFormat.format(result.semantic_score ?? 0)}% ·
                        Điểm kỹ năng:{" "}
                        {numberFormat.format(result.skill_score ?? 0)}%
                    </p>
                </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
                <SkillList
                    title="Kỹ năng phù hợp"
                    skills={result.matched_skills ?? []}
                    positive
                />
                <SkillList
                    title="Kỹ năng còn thiếu"
                    skills={result.missing_skills ?? []}
                />
            </div>

            <section aria-labelledby="matching-criteria-title">
                <h3
                    id="matching-criteria-title"
                    className="flex items-center gap-2 font-bold"
                >
                    <Sparkles className="size-4 text-primary" /> Nhận xét theo
                    tiêu chí
                </h3>
                <div className="mt-3 flex flex-col gap-3">
                    {criteria.map((criterion) => (
                        <CriterionCard
                            key={criterion.key}
                            label={criterion.label}
                            maximum={criterion.maximum}
                            field={result.field_scores?.[criterion.key]}
                        />
                    ))}
                </div>
            </section>
            <p className="flex items-start gap-2 text-xs leading-5 text-muted-foreground">
                <CircleHelp className="mt-0.5 size-4 shrink-0" /> Kết quả AI chỉ
                hỗ trợ đánh giá mức độ phù hợp, không thay thế quyết định tuyển
                dụng.
            </p>
        </div>
    );
}

function CriterionCard({
    label,
    maximum,
    field,
}: {
    label: string;
    maximum: number;
    field?: FieldScore;
}) {
    return (
        <article className="min-w-0 break-words rounded-xl border border-border bg-secondary/20 p-4">
            <div className="flex items-center justify-between gap-3">
                <h4 className="font-semibold">{label}</h4>
                <strong className="shrink-0 text-primary">
                    {field ? numberFormat.format(field.score) : "—"}/{maximum}
                </strong>
            </div>
            <div className="mt-2 h-2 overflow-hidden rounded-full bg-secondary">
                <div
                    className="h-full rounded-full bg-primary"
                    style={{
                        width: `${field ? Math.min(100, (field.score / maximum) * 100) : 0}%`,
                    }}
                />
            </div>
            <p className="mt-3 text-sm leading-6 text-muted-foreground">
                {field?.reason || "Chưa có nhận xét cho tiêu chí này."}
            </p>
            {field?.evidence && (
                <p className="mt-2 text-xs leading-5 text-muted-foreground">
                    <span className="font-semibold text-foreground">
                        Trong CV:{" "}
                    </span>
                    {field.evidence}
                </p>
            )}
            {field?.requirement && (
                <p className="mt-1 text-xs leading-5 text-muted-foreground">
                    <span className="font-semibold text-foreground">
                        Yêu cầu:{" "}
                    </span>
                    {field.requirement}
                </p>
            )}
        </article>
    );
}

function SkillList({
    title,
    skills,
    positive = false,
}: {
    title: string;
    skills: string[];
    positive?: boolean;
}) {
    return (
        <section
            className={`rounded-xl border p-4 ${positive ? "border-success/15 bg-success-soft" : "border-destructive/15 bg-destructive-soft"}`}
        >
            <h3
                className={`flex items-center gap-2 text-sm font-bold ${positive ? "text-success-foreground" : "text-destructive"}`}
            >
                <span
                    className={`flex size-5 items-center justify-center rounded-full text-white ${positive ? "bg-success" : "bg-destructive"}`}
                >
                    {positive ? <Check className="size-3" /> : "!"}
                </span>
                {title} ({skills.length})
            </h3>
            {skills.length ? (
                <ul className="mt-3 flex flex-wrap gap-1.5">
                    {skills.map((skill) => (
                        <li
                            key={skill}
                            className="rounded-full bg-card/80 px-2.5 py-1 text-xs"
                        >
                            {skill}
                        </li>
                    ))}
                </ul>
            ) : (
                <p className="mt-3 text-xs text-muted-foreground">
                    Không có kỹ năng nào được ghi nhận.
                </p>
            )}
        </section>
    );
}
