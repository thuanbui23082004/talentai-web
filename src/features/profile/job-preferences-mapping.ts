import type { PersonalProfile, PersonalProfileInput } from "./types";
import { INITIAL_JOB_PREFERENCES, type JobPreferencesDraft } from "./schemas/job-preferences";
import { PREFERENCE_INDUSTRIES, PREFERENCE_LEVELS, PREFERENCE_LOCATIONS, PREFERENCE_WORK_TYPES } from "./job-preference-options";

type Option = { value: string; label: string };
const EXPERIENCE_CODES: Record<string, string> = {
    "no-experience": "NO_EXPERIENCE", "under-1": "UNDER_1_YEAR", "1-2": "ONE_TO_TWO_YEARS",
    "2-3": "TWO_TO_THREE_YEARS", "3-5": "THREE_TO_FIVE_YEARS", "5-10": "FIVE_TO_TEN_YEARS", "over-10": "OVER_TEN_YEARS",
};
const labels = (values: string[], options: Option[]) => values.map(value => options.find(option => option.value === value)?.label ?? value);
const keys = (values: string[], options: Option[]) => values.map(value => options.find(option => option.label === value || option.value === value)?.value ?? value);

// Keep saved choices that are outside the current UI suggestions visible and editable.
export function optionsWithSavedValues(options: Option[], values: string[]): Option[] {
    return [...options, ...values.filter(value => !options.some(option => option.value === value)).map(value => ({ value, label: value }))];
}

export function profileToJobPreferences(profile: PersonalProfile): JobPreferencesDraft {
    const locations = profile.desiredLocations ?? (profile.desiredLocation ? [profile.desiredLocation] : []);
    return {
        ...INITIAL_JOB_PREFERENCES,
        position: profile.desiredJobTitle ?? "",
        industries: keys(profile.desiredIndustries ?? [], PREFERENCE_INDUSTRIES),
        experience: Object.entries(EXPERIENCE_CODES).find(([, code]) => code === profile.experienceLevel)?.[0] ?? profile.experienceLevel ?? "",
        salaryMin: profile.minDesiredSalary == null ? "" : String(profile.minDesiredSalary / 1000000),
        salaryMax: profile.maxDesiredSalary == null ? "" : String(profile.maxDesiredSalary / 1000000),
        negotiable: profile.salaryNegotiable ?? false,
        locations: keys(locations, PREFERENCE_LOCATIONS),
        levels: keys(profile.currentSeniorityLevels ?? [], PREFERENCE_LEVELS),
        workTypes: keys(profile.employmentTypes ?? [], PREFERENCE_WORK_TYPES),
        hybrid: profile.workPreferences?.hybrid ?? false,
        thirteenthMonth: profile.workPreferences?.thirteenthMonthSalary ?? false,
        healthInsurance: profile.workPreferences?.healthInsurance ?? false,
    };
}

export function jobPreferencesPayload(values: JobPreferencesDraft): PersonalProfileInput {
    return {
        desiredJobTitle: values.position,
        desiredIndustries: labels(values.industries, PREFERENCE_INDUSTRIES),
        experienceLevel: EXPERIENCE_CODES[values.experience] ?? values.experience,
        salaryNegotiable: values.negotiable,
        // The backend ignores null. Keep the previous range when negotiable, without sending it again.
        ...(!values.negotiable ? { minDesiredSalary: Math.round(Number(values.salaryMin) * 1000000), maxDesiredSalary: Math.round(Number(values.salaryMax) * 1000000), currency: "VND" } : {}),
        desiredLocations: labels(values.locations, PREFERENCE_LOCATIONS),
        currentSeniorityLevels: labels(values.levels, PREFERENCE_LEVELS),
        employmentTypes: labels(values.workTypes, PREFERENCE_WORK_TYPES),
        workPreferences: { hybrid: values.hybrid, thirteenthMonthSalary: values.thirteenthMonth, healthInsurance: values.healthInsurance },
    };
}
