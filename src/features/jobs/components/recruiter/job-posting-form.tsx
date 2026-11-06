"use client";

import Link from "next/link";
import { useRef, useState } from "react";
import {
    Controller,
    FormProvider,
    useForm,
    useFormContext,
    useWatch,
} from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import {
    ArrowLeft,
    ArrowRight,
    BriefcaseBusiness,
    CircleHelp,
    Clock3,
    MapPin,
    Minus,
    Plus,
    Wallet,
} from "lucide-react";
import {
    Button,
    Checkbox,
    DatePicker,
    Input,
    MultiSelect,
} from "@/components/ui";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { LocationPicker } from "@/components/shared/location-picker";
import { resolveLocation, provinceCity } from "@/lib/locations/vietnam";
import { useJobPostingOptions, useSaveJob } from "../../hooks/use-create-job";
import {
    jobPostingFormSchema,
    jobPostingDefaults,
    toJobPostingInput,
    type JobPostingFormValues,
} from "../../schemas/job-posting-form";
import { JOB_SEARCH_FILTERS } from "../../search-options";
import { JobRequestError } from "../../errors";
import type { RecruiterJob } from "../../types";
import { JobFormSection } from "./job-form-section";
import { JobEditor } from "./job-editor";
import { JobDataState } from "./job-data-state";
import "./create-job.css";
import { JobCreatedSuccess } from "./job-created-success";

type TextName = "title" | "salaryMin" | "salaryMax" | "headCount" | "address";
function TextField({
    name,
    label,
    placeholder,
    disabled,
    required,
}: {
    name: TextName;
    label: string;
    placeholder?: string;
    disabled?: boolean;
    required?: boolean;
}) {
    const t = useTranslations("JobForm");
    const {
        register,
        formState: { errors },
    } = useFormContext<JobPostingFormValues>();
    const error = errors[name];
    return (
        <div className="create-job-field">
            <label htmlFor={`job-${name}`}>
                {label}
                {required && <span> *</span>}
            </label>
            <Input
                id={`job-${name}`}
                type={
                    ["salaryMin", "salaryMax", "headCount"].includes(name)
                        ? "number"
                        : "text"
                }
                {...register(name)}
                disabled={disabled}
                placeholder={placeholder}
                aria-required={required}
                aria-invalid={!!error}
                aria-describedby={error ? `${name}-error` : undefined}
            />
            {error && (
                <p className="field-error" id={`${name}-error`} role="alert">
                    {t(`validation.${error.message}`)}
                </p>
            )}
        </div>
    );
}

function ChoiceField({
    name,
    label,
    items,
}: {
    name: "categoryId" | "experienceLevel" | "jobType" | "workMode";
    label: string;
    items: { value: string; label: string }[];
}) {
    const t = useTranslations("JobForm");
    const {
        control,
        formState: { errors },
    } = useFormContext<JobPostingFormValues>();
    const error = errors[name];
    return (
        <div className="create-job-field">
            <label htmlFor={`job-${name}`}>
                {label}
                <span> *</span>
            </label>
            <Controller
                name={name}
                control={control}
                render={({ field }) => (
                    <Select
                        items={items}
                        value={field.value || null}
                        onValueChange={(value) => field.onChange(value ?? "")}
                        onOpenChange={(open) => {
                            if (!open) field.onBlur();
                        }}
                    >
                        <SelectTrigger
                            id={`job-${name}`}
                            ref={field.ref}
                            aria-required
                            aria-invalid={!!error}
                        >
                            <SelectValue placeholder={t("choose")} />
                        </SelectTrigger>
                        <SelectContent
                            align="start"
                            alignItemWithTrigger={false}
                        >
                            {items.map((item) => (
                                <SelectItem key={item.value} value={item.value}>
                                    {item.label}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                )}
            />
            {error && (
                <p className="field-error" role="alert">
                    {t(`validation.${error.message}`)}
                </p>
            )}
        </div>
    );
}

function PostingPreview({
    status = "draft",
    company,
}: {
    status?: string;
    company?: string;
}) {
    const t = useTranslations("JobForm");
    const statusText = useTranslations("Recruiter");
    const { control } = useFormContext<JobPostingFormValues>();
    const value = useWatch({ control });
    const { province, ward } = resolveLocation(value.workplace ?? "");
    const jobType = JOB_SEARCH_FILTERS.find(
        (filter) => filter.key === "jobType",
    )?.options.find((item) => item.value === value.jobType)?.label;
    return (
        <aside className="create-job-side">
            <section className="create-job-preview">
                <div className="preview-heading">
                    <h2>{t("preview")}</h2>
                    <span>{t("live")}</span>
                </div>
                <article>
                    <div className="preview-job-title">
                        <span>
                            <BriefcaseBusiness size={19} aria-hidden="true" />
                        </span>
                        <div>
                            <h3>{value.title || t("previewTitle")}</h3>
                            {company && <p>{company}</p>}
                        </div>
                    </div>
                    <div className="preview-salary">
                        <Wallet size={13} aria-hidden="true" />
                        {value.isSalaryNegotiable
                            ? t("negotiable")
                            : value.salaryMin || value.salaryMax
                              ? `${value.salaryMin || "0"} – ${value.salaryMax || value.salaryMin} ${value.salaryCurrency === "VND" ? "triệu VNĐ" : value.salaryCurrency}`
                              : t("noSalary")}
                    </div>
                    <p>
                        <MapPin size={12} aria-hidden="true" />
                        {province
                            ? [ward?.name, provinceCity(province.name)]
                                  .filter(Boolean)
                                  .join(", ")
                            : t("noLocation")}
                    </p>
                    <div className="preview-job-meta">
                        <Clock3 size={12} aria-hidden="true" />
                        {jobType}
                        <span>{statusText(status)}</span>
                    </div>
                </article>
            </section>
            <nav className="create-job-steps" aria-label={t("steps")}>
                <h2>{t("steps")}</h2>
                {(["basic", "content", "location"] as const).map(
                    (key, index) => (
                        <a key={key} href={`#job-${key}`}>
                            <span>{index + 1}</span>
                            {t(key)}
                            <ArrowRight size={12} />
                        </a>
                    ),
                )}
            </nav>
        </aside>
    );
}

function HeadcountField() {
    const t = useTranslations("JobForm");
    const {
        control,
        formState: { errors },
    } = useFormContext<JobPostingFormValues>();
    return (
        <div className="create-job-field">
            <label htmlFor="job-headCount">
                {t("headcount")}
                <span> *</span>
            </label>
            <Controller
                name="headCount"
                control={control}
                render={({ field }) => (
                    <div className="headcount-control">
                        <Button
                            type="button"
                            variant="ghost"
                            size="icon-sm"
                            aria-label={t("decrease")}
                            disabled={Number(field.value) <= 1}
                            onClick={() =>
                                field.onChange(
                                    String(
                                        Math.max(1, Number(field.value) - 1),
                                    ),
                                )
                            }
                        >
                            <Minus size={12} />
                        </Button>
                        <Input
                            id="job-headCount"
                            {...field}
                            type="number"
                            min={1}
                            aria-required
                            aria-invalid={!!errors.headCount}
                        />
                        <Button
                            type="button"
                            variant="ghost"
                            size="icon-sm"
                            aria-label={t("increase")}
                            onClick={() =>
                                field.onChange(String(Number(field.value) + 1))
                            }
                        >
                            <Plus size={12} />
                        </Button>
                    </div>
                )}
            />
            {errors.headCount && (
                <p className="field-error" role="alert">
                    {t("validation.headcount")}
                </p>
            )}
        </div>
    );
}

export function CreateJobForm({ job }: { job?: RecruiterJob }) {
    const t = useTranslations("JobForm");
    const router = useRouter();
    const options = useJobPostingOptions();
    const mutation = useSaveJob(job?.id);
    const [guide, setGuide] = useState(false);
    const [createdJob, setCreatedJob] = useState<RecruiterJob | null>(null);
    const saving = useRef(false);
    const form = useForm<JobPostingFormValues>({
        resolver: zodResolver(jobPostingFormSchema),
        defaultValues: jobPostingDefaults(job),
        mode: "onBlur",
    });
    const negotiable = useWatch({
        control: form.control,
        name: "isSalaryNegotiable",
    });
    const currency = useWatch({
        control: form.control,
        name: "salaryCurrency",
    });

    async function save(value: JobPostingFormValues) {
        if (saving.current) return;
        saving.current = true;
        try {
            const saved = await mutation.mutateAsync(
                toJobPostingInput(value, job?.posting?.version),
            );
            if (job) router.push(`/recruiter/jobs/${saved.id}`);
            else setCreatedJob(saved);
        } catch {
            /* The mutation error is rendered below and the entered data stays intact. */
        } finally {
            saving.current = false;
        }
    }
    if (createdJob)
        return (
            <JobCreatedSuccess job={createdJob} onPublished={setCreatedJob} />
        );
    if (!options.data)
        return (
            <JobDataState
                loading={options.isPending}
                error={options.error}
                onRetry={() => void options.refetch()}
            />
        );
    if (!options.data.categories.length)
        return (
            <section className="recruiter-panel empty-state">
                <p>{t("noOptions")}</p>
                <Button onClick={() => void options.refetch()}>
                    {t("retry")}
                </Button>
            </section>
        );
    const filter = (key: string) =>
        JOB_SEARCH_FILTERS.find((item) => item.key === key)!.options;

    return (
        <FormProvider {...form}>
            <div className="create-job-page">
                <header className="create-job-heading">
                    <h1>{t(job ? "editHeading" : "heading")}</h1>
                    <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => setGuide(!guide)}
                        aria-expanded={guide}
                    >
                        <CircleHelp size={14} />
                        {t(job ? "editGuide" : "guide")}
                    </Button>
                </header>
                {guide && (
                    <p className="create-job-guide">
                        {t(job ? "editGuideText" : "guideText")}
                    </p>
                )}
                <div className="create-job-grid">
                    <form
                        noValidate
                        onSubmit={(event) =>
                            void form.handleSubmit(save, () => {
                                document
                                    .querySelectorAll<HTMLDetailsElement>(
                                        ".create-job-section",
                                    )
                                    .forEach((section) => {
                                        section.open = true;
                                    });
                            })(event)
                        }
                    >
                        <fieldset
                            className="create-job-fieldset"
                            disabled={mutation.isPending}
                        >
                            <JobFormSection id="job-basic" title={t("basic")}>
                                <TextField
                                    name="title"
                                    label={t("title")}
                                    placeholder={t("titlePlaceholder")}
                                    required
                                />
                                <ChoiceField
                                    name="categoryId"
                                    label={t("industry")}
                                    items={options.data.categories.map(
                                        (item) => ({
                                            value: String(item.categoryId),
                                            label: item.categoryName,
                                        }),
                                    )}
                                />
                                <div className="form-two-columns">
                                    <ChoiceField
                                        name="experienceLevel"
                                        label={t("experience")}
                                        items={filter("experienceLevel")}
                                    />
                                    <div className="create-job-field">
                                        <label htmlFor="job-applicationDeadline">
                                            {t("deadline")}
                                        </label>
                                        <Controller
                                            name="applicationDeadline"
                                            control={form.control}
                                            render={({ field }) => (
                                                <DatePicker
                                                    id="job-applicationDeadline"
                                                    ref={field.ref}
                                                    value={field.value}
                                                    onValueChange={
                                                        field.onChange
                                                    }
                                                    onBlur={field.onBlur}
                                                />
                                            )}
                                        />
                                    </div>
                                </div>
                                <fieldset className="salary-group">
                                    <legend className="field-label">
                                        {currency === "VND"
                                            ? "Mức lương (triệu VNĐ)"
                                            : `Mức lương (${currency})`}
                                    </legend>
                                    <div className="salary-fields">
                                        <TextField
                                            name="salaryMin"
                                            label={t("from")}
                                            disabled={negotiable}
                                        />
                                        <TextField
                                            name="salaryMax"
                                            label={t("to")}
                                            disabled={negotiable}
                                        />
                                    </div>
                                    <Controller
                                        name="isSalaryNegotiable"
                                        control={form.control}
                                        render={({ field }) => (
                                            <label className="checkbox-label salary-negotiable">
                                                <Checkbox
                                                    checked={field.value}
                                                    onCheckedChange={
                                                        field.onChange
                                                    }
                                                />
                                                {t("negotiable")}
                                            </label>
                                        )}
                                    />
                                </fieldset>
                            </JobFormSection>
                            <JobFormSection
                                id="job-content"
                                title={t("content")}
                            >
                                <JobEditor name="description" />
                                <JobEditor name="requirements" />
                                <JobEditor name="benefits" />
                                <div className="form-two-columns">
                                    <ChoiceField
                                        name="jobType"
                                        label={t("workType")}
                                        items={filter("jobType")}
                                    />
                                    <ChoiceField
                                        name="workMode"
                                        label="Chế độ làm việc"
                                        items={filter("workMode")}
                                    />
                                </div>
                                <HeadcountField />
                                <div className="create-job-field">
                                    <label htmlFor="job-skillIds">
                                        {t("skills")}
                                    </label>
                                    <Controller
                                        name="skillIds"
                                        control={form.control}
                                        render={({ field }) => (
                                            <MultiSelect
                                                id="job-skillIds"
                                                label={t("skills")}
                                                value={field.value}
                                                onValueChange={field.onChange}
                                                maxSelections={100}
                                                options={options.data.skills.map(
                                                    (item) => ({
                                                        value: String(
                                                            item.skillId,
                                                        ),
                                                        label: item.skillName,
                                                    }),
                                                )}
                                            />
                                        )}
                                    />
                                </div>
                            </JobFormSection>
                            <JobFormSection
                                id="job-location"
                                title={t("location")}
                            >
                                <div className="location-fields">
                                    <div className="create-job-field job-workplace-field">
                                        <label htmlFor="job-city">
                                            {t("workplaceLocality")}
                                            <span> *</span>
                                        </label>
                                        <div className="job-workplace-trigger">
                                            <Controller
                                                name="workplace"
                                                control={form.control}
                                                render={({ field }) => (
                                                    <LocationPicker
                                                        id="job-city"
                                                        ref={field.ref}
                                                        value={field.value}
                                                        ariaLabel={t(
                                                            "workplaceLocality",
                                                        )}
                                                        placeholder={t(
                                                            "workplacePlaceholder",
                                                        )}
                                                        aria-required
                                                        aria-invalid={
                                                            !!form.formState
                                                                .errors
                                                                .workplace
                                                        }
                                                        onBlur={field.onBlur}
                                                        onChange={(value) =>
                                                            form.setValue(
                                                                "workplace",
                                                                value,
                                                                {
                                                                    shouldDirty: true,
                                                                    shouldValidate: true,
                                                                },
                                                            )
                                                        }
                                                    />
                                                )}
                                            />
                                        </div>
                                        {form.formState.errors.workplace && (
                                            <p
                                                role="alert"
                                                className="field-error"
                                            >
                                                {t("validation.city")}
                                            </p>
                                        )}
                                    </div>
                                    <TextField
                                        name="address"
                                        label={t("address")}
                                        placeholder={t("streetPlaceholder")}
                                    />
                                </div>
                            </JobFormSection>
                            {!job && (
                                <p className="create-job-agreement">
                                    {t("agreement")}
                                </p>
                            )}
                            {mutation.isError && (
                                <p
                                    className="field-error submit-error"
                                    role="alert"
                                >
                                    {t(
                                        `errors.${mutation.error instanceof JobRequestError ? mutation.error.messageKey : "requestFailed"}`,
                                    )}
                                </p>
                            )}
                            <div className="create-job-actions">
                                <Link
                                    href={
                                        job
                                            ? `/recruiter/jobs/${job.id}`
                                            : "/recruiter/jobs"
                                    }
                                >
                                    <ArrowLeft size={13} />
                                    {t("back")}
                                </Link>
                                <Button
                                    type="submit"
                                    className="recruiter-primary"
                                    disabled={mutation.isPending}
                                    aria-busy={mutation.isPending}
                                >
                                    {t(
                                        mutation.isPending
                                            ? "saving"
                                            : job
                                              ? "saveChanges"
                                              : "save",
                                    )}
                                    <ArrowRight size={14} />
                                </Button>
                            </div>
                        </fieldset>
                    </form>
                    <PostingPreview
                        status={job?.status}
                        company={
                            options.data.company?.name ?? job?.company.name
                        }
                    />
                </div>
            </div>
        </FormProvider>
    );
}
