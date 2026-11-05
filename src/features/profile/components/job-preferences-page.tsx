"use client";

import { CandidatePageTitle } from "@/components/layout/candidate/candidate-page-title";

import { useState, type ReactNode } from "react";
import { Controller, useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { CheckCircle2, ChevronUp, SlidersHorizontal } from "lucide-react";
import {
    Alert,
    Button,
    Checkbox,
    FormField,
    Input,
    MultiSelect,
    Select,
} from "@/components/ui";
import { LoadingState } from "@/components/shared/loading-state";
import { ApiError } from "@/lib/api/errors";
import { usePersonalProfile } from "../hooks/use-personal-profile";
import { useSaveJobPreferences } from "../hooks/use-job-preferences";
import {
    optionsWithSavedValues,
    profileToJobPreferences,
} from "../job-preferences-mapping";
import type { PersonalProfile } from "../types";
import {
    jobPreferencesDraftSchema,
    type JobPreferencesDraft,
} from "../schemas/job-preferences";
import {
    PREFERENCE_EXPERIENCE,
    PREFERENCE_INDUSTRIES,
    PREFERENCE_LEVELS,
    PREFERENCE_LOCATIONS,
    PREFERENCE_WORK_TYPES,
} from "../job-preference-options";

function FieldLabel({
    children,
    hint,
    required,
}: {
    children: ReactNode;
    hint?: string;
    required?: boolean;
}) {
    return (
        <span className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
            <span>
                {children}
                {required && (
                    <span
                        className="ml-1 text-destructive"
                        aria-label="bắt buộc"
                    >
                        *
                    </span>
                )}
            </span>
            {hint && (
                <span className="text-xs font-normal text-muted-foreground">
                    {hint}
                </span>
            )}
        </span>
    );
}

export function JobPreferencesPage({ userId }: { userId: string }) {
    const profile = usePersonalProfile(userId);
    return (
        <div className="candidate-page">
            <header className="mb-5">
                <CandidatePageTitle>Tiêu chí tìm việc</CandidatePageTitle>
                <p className="mt-2 text-sm text-muted-foreground">
                    Tối ưu hồ sơ năng lực, thu hút nhà tuyển dụng hàng đầu với
                    AI
                </p>
            </header>
            {profile.isPending ? (
                <LoadingState title="Đang tải tiêu chí tìm việc" />
            ) : profile.isError ? (
                <Alert variant="error" title="Không tải được tiêu chí tìm việc">
                    <Button
                        variant="outline"
                        onClick={() => void profile.refetch()}
                    >
                        Thử lại
                    </Button>
                </Alert>
            ) : (
                <JobPreferencesForm userId={userId} profile={profile.data} />
            )}
        </div>
    );
}

function JobPreferencesForm({
    userId,
    profile,
}: {
    userId: string;
    profile: PersonalProfile;
}) {
    const [advanced, setAdvanced] = useState(true);
    const [saved, setSaved] = useState<JobPreferencesDraft>(() =>
        profileToJobPreferences(profile),
    );
    const [notice, setNotice] = useState("");
    const [saveError, setSaveError] = useState("");
    const mutation = useSaveJobPreferences(userId);
    const {
        control,
        register,
        handleSubmit,
        reset,
        clearErrors,
        setError,
        formState: { errors, isDirty, isSubmitting },
    } = useForm<JobPreferencesDraft>({
        resolver: zodResolver(jobPreferencesDraftSchema),
        mode: "onTouched",
        defaultValues: saved,
    });
    const selections = useWatch({ control });
    const negotiable = useWatch({ control, name: "negotiable" });
    const multi = (
        name: "industries" | "locations" | "levels" | "workTypes",
        label: string,
        options: { value: string; label: string }[],
        max: number,
        placeholder: string,
        required = false,
    ) => (
        <FormField
            label={
                <FieldLabel
                    hint={`Tối đa ${max} ${name === "industries" ? "ngành nghề" : name === "locations" ? "địa điểm" : name === "levels" ? "cấp bậc" : "hình thức"}`}
                    required={required}
                >
                    {label}
                </FieldLabel>
            }
            error={errors[name]?.message}
        >
            {(field) => (
                <Controller
                    name={name}
                    control={control}
                    render={({ field: selected }) => (
                        <MultiSelect
                            disabled={isSubmitting}
                            id={field.id}
                            label={label}
                            value={selected.value}
                            onValueChange={(value) => {
                                selected.onChange(value);
                                setNotice("");
                            }}
                            options={options}
                            maxSelections={max}
                            placeholder={placeholder}
                            aria-describedby={field["aria-describedby"]}
                            aria-invalid={field["aria-invalid"]}
                        />
                    )}
                />
            )}
        </FormField>
    );
    const salaryInput = (name: "salaryMin" | "salaryMax", label: string) => (
        <FormField
            label={label}
            error={errors[name]?.message}
            className="[&>label]:sr-only"
        >
            {(field) => (
                <Controller
                    name={name}
                    control={control}
                    render={({ field: amount }) => (
                        <Input
                            {...field}
                            {...amount}
                            type="text"
                            inputMode="decimal"
                            autoComplete="off"
                            disabled={negotiable || isSubmitting}
                            placeholder={name === "salaryMin" ? "Từ" : "Đến"}
                            trailingIcon={
                                <span className="flex h-9 items-center rounded-lg bg-muted px-3 text-xs text-muted-foreground">
                                    Triệu
                                </span>
                            }
                            className="[&_input]:pr-19"
                        />
                    )}
                />
            )}
        </FormField>
    );
    const submit = handleSubmit(async (values) => {
        setNotice("");
        setSaveError("");
        try {
            const profile = await mutation.mutateAsync(values);
            const next = profileToJobPreferences(profile);
            setSaved(next);
            reset(next);
            setNotice("Đã lưu tiêu chí tìm việc.");
        } catch (error) {
            setSaveError(
                error instanceof ApiError
                    ? error.message
                    : "Không thể lưu tiêu chí. Vui lòng thử lại.",
            );
            const fields: Record<string, keyof JobPreferencesDraft> = {
                desiredJobTitle: "position",
                desiredIndustries: "industries",
                experienceLevel: "experience",
                minDesiredSalary: "salaryMin",
                maxDesiredSalary: "salaryMax",
                salaryNegotiable: "negotiable",
                desiredLocations: "locations",
                currentSeniorityLevels: "levels",
                employmentTypes: "workTypes",
                "workPreferences.hybrid": "hybrid",
                "workPreferences.thirteenthMonthSalary": "thirteenthMonth",
                "workPreferences.healthInsurance": "healthInsurance",
            };
            if (error instanceof ApiError)
                for (const issue of error.fieldErrors ?? []) {
                    const name =
                        fields[issue.field] ??
                        fields[issue.field.split("[")[0]];
                    if (name)
                        setError(name, {
                            type: "server",
                            message: issue.message,
                        });
                }
            setAdvanced(true);
        }
    });
    return (
        <form
            noValidate
            onSubmit={submit}
            aria-busy={isSubmitting}
            className="rounded-2xl border border-border/30 bg-card p-5 sm:p-8 lg:p-10"
        >
            <fieldset disabled={isSubmitting} className="min-w-0 space-y-7">
                <div className="grid items-start gap-x-10 gap-y-7 md:grid-cols-[minmax(0,1.45fr)_minmax(0,1fr)]">
                    {multi(
                        "industries",
                        "Ngành nghề làm việc",
                        optionsWithSavedValues(
                            PREFERENCE_INDUSTRIES,
                            selections.industries ?? [],
                        ),
                        3,
                        "Chọn ngành nghề",
                        true,
                    )}
                    <FormField
                        label="Số năm kinh nghiệm"
                        required
                        error={errors.experience?.message}
                    >
                        {(field) => (
                            <Controller
                                name="experience"
                                control={control}
                                render={({ field: selected }) => (
                                    <Select
                                        {...field}
                                        disabled={isSubmitting}
                                        value={selected.value}
                                        onValueChange={selected.onChange}
                                        onOpenChange={(open) => {
                                            if (!open) selected.onBlur();
                                        }}
                                        options={optionsWithSavedValues(
                                            PREFERENCE_EXPERIENCE,
                                            selections.experience
                                                ? [selections.experience]
                                                : [],
                                        )}
                                        aria-label="Số năm kinh nghiệm"
                                        placeholder="Chọn số năm kinh nghiệm"
                                    />
                                )}
                            />
                        )}
                    </FormField>
                    <FormField
                        label="Vị trí mong muốn"
                        required
                        error={errors.position?.message}
                    >
                        {(field) => (
                            <Controller
                                name="position"
                                control={control}
                                render={({ field: position }) => (
                                    <Input
                                        {...field}
                                        {...position}
                                        maxLength={150}
                                        placeholder="Nhập vị trí mong muốn"
                                    />
                                )}
                            />
                        )}
                    </FormField>
                    <fieldset className="min-w-0">
                        <legend className="sr-only">Mức lương mong muốn</legend>
                        <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
                            <span className="ui-label">
                                Mức lương mong muốn{" "}
                                <span className="text-destructive">*</span>
                            </span>
                            <Checkbox
                                label="Lương thỏa thuận"
                                {...register("negotiable", {
                                    onChange: (event) => {
                                        if (event.target.checked)
                                            clearErrors([
                                                "salaryMin",
                                                "salaryMax",
                                            ]);
                                    },
                                })}
                                className="text-xs [&_span.font-medium]:font-normal"
                            />
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                            {salaryInput("salaryMin", "Lương tối thiểu")}
                            {salaryInput("salaryMax", "Lương tối đa")}
                        </div>
                    </fieldset>
                </div>
                {multi(
                    "locations",
                    "Địa điểm làm việc mong muốn",
                    optionsWithSavedValues(
                        PREFERENCE_LOCATIONS,
                        selections.locations ?? [],
                    ),
                    5,
                    "Chọn địa điểm",
                    true,
                )}
                <button
                    type="button"
                    aria-expanded={advanced}
                    aria-controls="job-preferences-advanced"
                    onClick={() => setAdvanced(!advanced)}
                    className="flex min-h-12 w-full items-center gap-2 rounded-xl border border-border bg-info-soft/30 px-4 text-left text-sm text-primary transition-colors hover:bg-secondary/40"
                >
                    <SlidersHorizontal className="size-4 shrink-0" />
                    <span className="font-medium">Tùy chọn nâng cao</span>
                    <span className="hidden text-xs text-muted-foreground sm:inline">
                        (Cấp bậc, Hình thức làm việc, Chế độ...)
                    </span>
                    <ChevronUp
                        className={`ml-auto size-4 shrink-0 text-muted-foreground transition-transform ${advanced ? "" : "rotate-180"}`}
                        aria-hidden="true"
                    />
                </button>
                <div
                    id="job-preferences-advanced"
                    hidden={!advanced}
                    className="space-y-6"
                >
                    {multi(
                        "levels",
                        "Cấp bậc hiện tại",
                        optionsWithSavedValues(
                            PREFERENCE_LEVELS,
                            selections.levels ?? [],
                        ),
                        5,
                        "Chọn cấp bậc hiện tại",
                    )}
                    {multi(
                        "workTypes",
                        "Hình thức làm việc",
                        optionsWithSavedValues(
                            PREFERENCE_WORK_TYPES,
                            selections.workTypes ?? [],
                        ),
                        5,
                        "Chọn hình thức làm việc",
                    )}
                    <fieldset>
                        <legend className="ui-label mb-3">
                            Chế độ làm việc / Phúc lợi mong muốn
                        </legend>
                        <div className="grid gap-3 sm:grid-cols-3">
                            {[
                                {
                                    name: "hybrid" as const,
                                    label: "Làm việc Hybrid",
                                },
                                {
                                    name: "thirteenthMonth" as const,
                                    label: "Thưởng tháng 13+",
                                },
                                {
                                    name: "healthInsurance" as const,
                                    label: "Bảo hiểm sức khỏe",
                                },
                            ].map((benefit) => (
                                <div key={benefit.name}>
                                    <Checkbox
                                        label={benefit.label}
                                        {...register(benefit.name)}
                                        className="min-h-11 items-center rounded-lg border border-border px-3 py-2 text-xs transition-colors has-checked:border-primary/30 has-checked:bg-secondary/20 [&_.ui-choice]:mt-0"
                                    />
                                    {errors[benefit.name]?.message && (
                                        <p
                                            role="alert"
                                            className="mt-1 text-xs text-destructive"
                                        >
                                            {errors[benefit.name]?.message}
                                        </p>
                                    )}
                                </div>
                            ))}
                        </div>
                    </fieldset>
                </div>
                {saveError && (
                    <Alert
                        variant="error"
                        title="Chưa thể lưu tiêu chí tìm việc"
                    >
                        {saveError}
                    </Alert>
                )}
                <div className="pt-1">
                    <div className="flex flex-wrap justify-end gap-3">
                        <Button
                            variant="outline"
                            className="min-w-32 text-primary"
                            onClick={() => {
                                reset(saved);
                                setSaveError("");
                                setNotice(
                                    "Đã khôi phục tiêu chí trước khi chỉnh sửa.",
                                );
                            }}
                        >
                            Hủy
                        </Button>
                        <Button
                            type="submit"
                            loading={isSubmitting}
                            className="min-w-40"
                        >
                            Lưu thông tin
                        </Button>
                    </div>
                    {notice && !isDirty && (
                        <p
                            role="status"
                            className="mt-4 flex items-center justify-end gap-2 text-sm text-success-foreground"
                        >
                            <CheckCircle2 className="size-4 shrink-0" />
                            {notice}
                        </p>
                    )}
                </div>
            </fieldset>
        </form>
    );
}
