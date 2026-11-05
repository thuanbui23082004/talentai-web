import { apiClient, ensureApiSession } from "@/lib/api";
import { toApiError } from "@/lib/api/errors";
import type { components } from "@/lib/api/generated/schema";
import { experienceSchema, educationSchema, certificateSchema, profileSkillsSchema, personalProfileSchema } from "@/lib/api/profile-schemas";
import { educationPayload, experiencePayload } from "../career-mapping";
import type { ProfileDraftValues, ProfileEditorSection } from "../schemas/profile-editor";
import type { CareerProfile, PersonalProfileInput } from "../types";

export async function getPersonalProfile(signal?: AbortSignal) {
    return personalProfileSchema.parse(unwrap(await apiClient.GET("/candidate/profile", { signal })));
}
export async function savePersonalProfile(body: PersonalProfileInput) {
    const headers = { "X-CSRF-Token": await ensureApiSession() };
    return personalProfileSchema.parse(unwrap(await apiClient.PUT("/candidate/profile", { body, headers })));
}

function unwrap<T>({ data, error, response }: { data?: T; error?: components["schemas"]["ApiError"]; response: Response }): T {
    if (error || data === undefined) throw toApiError(response.status, error);
    return data;
}

export async function getCareerProfile(signal?: AbortSignal): Promise<CareerProfile> {
    // The profile service intermittently returns an empty 403 for concurrent reads.
    const experience = await apiClient.GET("/candidate/experience", { signal });
    const education = await apiClient.GET("/candidate/education", { signal });
    const certificates = await apiClient.GET("/candidate/certificates", { signal });
    const skills = await apiClient.GET("/candidate/skills", { signal });
    return {
        experience: experienceSchema.array().parse(unwrap(experience)), education: educationSchema.array().parse(unwrap(education)),
        certificates: certificateSchema.array().parse(unwrap(certificates)), skills: profileSkillsSchema.parse(unwrap(skills)),
    };
}

export async function saveCareerSection({ values, id, original }: { values: ProfileDraftValues; id?: string; original?: CareerProfile }) {
    const headers = { "X-CSRF-Token": await ensureApiSession() };
    const params = { path: { id: id ?? "" } };
    switch (values.section) {
        case "experience": {
            const body = experiencePayload(values, original?.experience.find(item => item.id === id));
            return unwrap(id ? await apiClient.PUT("/candidate/experience/{id}", { body, headers, params }) : await apiClient.POST("/candidate/experience", { body, headers }));
        }
        case "education": {
            const body = educationPayload(values, original?.education.find(item => item.id === id));
            return unwrap(id ? await apiClient.PUT("/candidate/education/{id}", { body, headers, params }) : await apiClient.POST("/candidate/education", { body, headers }));
        }
        case "skills": return unwrap(await apiClient.PUT("/candidate/skills", { body: { skills: values.skills }, headers }));
        default: throw new Error("Mục hồ sơ chưa được tích hợp.");
    }
}

export async function removeCareerEntry({ section, id }: { section: ProfileEditorSection; id: string }) {
    const options = { params: { path: { id } }, headers: { "X-CSRF-Token": await ensureApiSession() } };
    const result = section === "experience" ? await apiClient.DELETE("/candidate/experience/{id}", options)
        : section === "education" ? await apiClient.DELETE("/candidate/education/{id}", options)
        : section === "certificates" ? await apiClient.DELETE("/candidate/certificates/{id}", options) : null;
    if (!result) throw new Error("Mục hồ sơ không hỗ trợ xóa.");
    if (!result.response.ok) throw toApiError(result.response.status, result.error);
}
