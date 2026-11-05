import { randomUUID } from "node:crypto";
import type { components } from "@/lib/api/generated/schema";
import { emptyCandidateCareer } from "@/mocks/fixtures/candidate-profile";
import { apiError } from "../responses";

type Entry = components["schemas"]["ProfileExperience"] | components["schemas"]["ProfileEducation"] | components["schemas"]["ProfileCertificate"];
type Resource = "experience" | "education" | "certificates" | "skills";
type Career = { entries: Record<Exclude<Resource, "skills">, Entry[]>; skills: string[] };
const shared = globalThis as typeof globalThis & { talentaiCandidateCareer?: Map<string, Career> };
export function resetMockProfile() { delete shared.talentaiCandidateCareer; }

export async function mockProfileRequest(userId: string, resource: Resource, id: string | undefined, method: string, input: unknown, scenario: string | null) {
    await new Promise(resolve => setTimeout(resolve, scenario === "slow" ? 1500 : 200));
    if (scenario === "error") return apiError(503, "SERVICE_UNAVAILABLE", "Không thể tải hồ sơ.");
    shared.talentaiCandidateCareer ??= new Map();
    if (!shared.talentaiCandidateCareer.has(userId)) shared.talentaiCandidateCareer.set(userId, {
        entries: { experience: structuredClone(emptyCandidateCareer.experience), education: structuredClone(emptyCandidateCareer.education), certificates: structuredClone(emptyCandidateCareer.certificates) }, skills: [],
    });
    const career = shared.talentaiCandidateCareer.get(userId)!;
    const json = (body: unknown, status = 200) => Response.json(body, { status, headers: { "Cache-Control": "private, no-store" } });
    if (resource === "skills") {
        if (method === "PUT") career.skills = [...new Set((input as components["schemas"]["ProfileSkills"]).skills)];
        return json({ skills: scenario === "empty" ? [] : career.skills });
    }
    const entries = career.entries[resource];
    if (method === "GET") return json(scenario === "empty" ? [] : entries);
    const index = entries.findIndex(entry => entry.id === id);
    if (id && index < 0) return apiError(404, "NOT_FOUND", "Không tìm thấy mục hồ sơ.");
    if (method === "DELETE") {
        entries.splice(index, 1);
        return new Response(null, { status: 204, headers: { "Cache-Control": "private, no-store" } });
    }
    const entry = { ...(input as Omit<Entry, "id">), id: id ?? randomUUID() } as Entry;
    if (id) entries[index] = entry;
    else entries.unshift(entry);
    return json(entry, id ? 200 : 201);
}
