import { randomUUID } from "node:crypto";
import type { components } from "@/lib/api/generated/schema";
import { emptyUploadedCvs } from "@/mocks/fixtures/uploaded-cvs";
import { getMockMedia } from "../recruiter/account-company-handler";
import { apiError } from "../responses";

type Cv = components["schemas"]["UploadedCv"];
const shared = globalThis as typeof globalThis & { talentaiUploadedCvs?: Map<string, Cv[]> };
export function resetMockCvs() { delete shared.talentaiUploadedCvs; }

export async function mockCvsRequest(userId: string, method: string, id?: string, isDefault = false, file?: File, scenario?: string | null) {
    await new Promise(resolve => setTimeout(resolve, scenario === "slow" ? 1500 : 200));
    if (scenario === "error") return apiError(503, "SERVICE_UNAVAILABLE", "Không thể tải CV. Vui lòng thử lại.");
    shared.talentaiUploadedCvs ??= new Map();
    if (!shared.talentaiUploadedCvs.has(userId)) shared.talentaiUploadedCvs.set(userId, structuredClone(emptyUploadedCvs));
    const cvs = shared.talentaiUploadedCvs.get(userId)!;
    const json = (body: unknown, status = 200) => Response.json(body, { status, headers: { "Cache-Control": "private, no-store" } });
    if (!id && method === "GET") return json(scenario === "empty" ? [] : cvs);
    if (file) {
        const mediaId = randomUUID();
        getMockMedia().set(mediaId, { ownerId: userId, ownerRole: "candidate", type: file.type, bytes: new Uint8Array(await file.arrayBuffer()) });
        const fileName = file.name.replace(/\s/g, "_");
        const cv: Cv = { id: randomUUID(), cvId: randomUUID(), fileName, cvTitle: fileName.replace(/\.[^.]+$/, ""), fileUrl: `/api/mock-media/${mediaId}`, contentType: file.type, sizeBytes: file.size, version: 1, isDefault: cvs.length === 0, createdAt: new Date().toISOString() };
        cvs.unshift(cv);
        return json(cv, 201);
    }
    const index = cvs.findIndex(cv => cv.id === id);
    if (index < 0) return apiError(404, "NOT_FOUND", "CV không tồn tại hoặc đã bị xóa.");
    if (method === "GET") return json(cvs[index]);
    if (isDefault) cvs.forEach(cv => { cv.isDefault = cv.id === id; });
    else {
        const [removed] = cvs.splice(index, 1);
        getMockMedia().delete(removed.fileUrl.split("/").at(-1)!);
        if (removed.isDefault && cvs.length) cvs[0].isDefault = true;
    }
    return new Response(null, { status: 204, headers: { "Cache-Control": "private, no-store" } });
}
