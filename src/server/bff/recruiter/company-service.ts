import { z } from "zod";
import type { components } from "@/lib/api/generated/schema";
import { companyInputSchema, companySchema, logoFileSchema, companyImageFileSchema, verificationFilesSchema } from "@/features/company";
import { normalizeLocation, provinceCity } from "@/lib/locations/vietnam";
import { hasValidCsrf, isTrustedOrigin } from "../auth/cookies";
import { readRequestIdentity } from "../auth/session";
import { apiError } from "../responses";

const catalogItem = z.object({ id: z.number().int().positive(), name: z.string() });
const catalogResponse = z.object({ data: z.array(catalogItem) });
const documentResponse = z.object({ data: z.array(z.object({ id: z.uuid(), fileName: z.string(), fileSize: z.number().int().nonnegative(), mimeType: z.string(), documentType: z.string(), status: z.enum(["PENDING", "VERIFIED", "REJECTED"]), rejectionReason: z.string().nullish(), uploadedAt: z.string().nullish() })) });
const upstreamCompany = z.object({
    data: z.object({
        id: z.uuid(), name: z.string(),
        verificationStatus: z.enum(["UNVERIFIED", "PENDING", "VERIFIED", "REJECTED"]),
        createdAt: z.string(), updatedAt: z.string().nullish(),
        description: z.string().nullish(), taxCode: z.string().nullish(),
        address: z.string().nullish(), contactPhone: z.string().nullish(), contactEmail: z.string().nullish(),
        logoUrl: z.string().nullish(), coverImageUrl: z.string().nullish(), companySize: z.number().int().positive().nullish(), website: z.string().nullish(), foundedYear: z.number().nullish(),
        industry: catalogItem.nullish(), location: catalogItem.nullish(),
    }),
});
const backendError = z.object({ error: z.object({ code: z.string(), fieldErrors: z.array(z.object({ field: z.string() })).optional() }) });
const fieldNames: Record<string, string> = { name: "name", description: "description", taxCode: "taxCode", industryId: "industryId", locationId: "city", address: "address", contactPhone: "contactPhone", contactEmail: "contactEmail", website: "website", companySize: "companySize", foundedYear: "foundedYear" };
const reply = (body: unknown, status = 200) => Response.json(body, { status, headers: { "Cache-Control": "private, no-store" } });

function invalid(fields: string[], duplicateTaxCode = false) {
    return reply({ error: {
        code: "VALIDATION_FAILED", message: "Vui lòng kiểm tra thông tin công ty.",
        fieldErrors: fields.map(field => ({ field, code: duplicateTaxCode ? "CONFLICT" : "VALIDATION_FAILED", message: "Vui lòng kiểm tra trường này." })),
    } }, 422);
}

async function upstreamError(response: Response) {
    const parsed = backendError.safeParse(await response.json().catch(() => null));
    const code = parsed.success ? parsed.data.error.code : "";
    if (code === "TAX_CODE_ALREADY_EXISTS") return invalid(["taxCode"], true);
    if (code === "INDUSTRY_NOT_FOUND") return invalid(["industryId"]);
    if (code === "LOCATION_NOT_FOUND") return invalid(["city"]);
    if ([400, 422].includes(response.status)) {
        return invalid(parsed.success ? (parsed.data.error.fieldErrors ?? []).flatMap(({ field }) => fieldNames[field] ? [fieldNames[field]] : []) : []);
    }
    if (response.status === 401) return apiError(401, "SESSION_EXPIRED", "Phiên đăng nhập đã hết hạn.");
    if (response.status === 403) return apiError(403, "FORBIDDEN", "Bạn không có quyền quản lý công ty.");
    if (response.status === 404) return apiError(404, "NOT_FOUND", "Chưa có hồ sơ công ty.");
    if (response.status === 409) return apiError(409, "CONFLICT", "Thông tin công ty bị trùng. Vui lòng kiểm tra lại.");
    if (response.status === 413) return apiError(413, "PAYLOAD_TOO_LARGE", "Ảnh vượt quá dung lượng cho phép.");
    if (response.status === 415) return apiError(415, "UNSUPPORTED_MEDIA_TYPE", "Định dạng ảnh không được hỗ trợ.");
    return apiError(503, "SERVICE_UNAVAILABLE", "Không thể kết nối dịch vụ công ty.");
}

export function isRecruiterCompanyRequest(request: Request) {
    return new URL(request.url).pathname.startsWith("/api/bff/recruiter/company");
}

// Keep the browser contract stable; only this adapter knows Java's IDs and envelope.
export async function handleRecruiterCompany(request: Request, baseUrl: string): Promise<Response> {
    const path = new URL(request.url).pathname;
    const isCatalog = path === "/api/bff/recruiter/company/catalogs";
    const isDocuments = path === "/api/bff/recruiter/company/verification-documents";
    const imageKind = path === "/api/bff/recruiter/company/logo" ? "logo" : path === "/api/bff/recruiter/company/cover" ? "cover" : undefined;
    if (!isCatalog && !isDocuments && !imageKind && path !== "/api/bff/recruiter/company") {
        return apiError(503, "SERVICE_UNAVAILABLE", "Chức năng công ty này chưa được tích hợp.");
    }
    if (!(isCatalog ? ["GET"] : isDocuments ? ["POST"] : imageKind ? ["PUT"] : ["GET", "POST", "PUT"]).includes(request.method)) {
        return apiError(405, "BAD_REQUEST", "Phương thức không được hỗ trợ.");
    }
    if (request.method !== "GET" && (!isTrustedOrigin(request) || !hasValidCsrf(request))) {
        return apiError(403, "CSRF_TOKEN_INVALID", "Phiên thao tác không hợp lệ.");
    }
    try {
        const identity = await readRequestIdentity(request);
        if (!identity) return apiError(401, "UNAUTHENTICATED", "Vui lòng đăng nhập.");
        if (identity.user.role !== "recruiter") return apiError(403, "FORBIDDEN", "Chức năng dành cho nhà tuyển dụng.");

        const accessToken = identity.access;
        async function call(path: string, body?: unknown) {
            return fetch(`${baseUrl.replace(/\/$/, "")}/${path}`, {
                method: body === undefined ? "GET" : "PUT",
                headers: { Accept: "application/json", Authorization: `Bearer ${accessToken}`, ...(body === undefined ? {} : { "Content-Type": "application/json" }) },
                ...(body === undefined ? {} : { body: JSON.stringify(body) }),
                cache: "no-store", redirect: "error", signal: AbortSignal.timeout(5000),
            });
        }
        async function catalogs(): Promise<components["schemas"]["CompanyCatalogs"]> {
            const [industries, locations] = await Promise.all([call("industries"), call("locations")]);
            if (!industries.ok) throw await upstreamError(industries);
            if (!locations.ok) throw await upstreamError(locations);
            const map = async (response: Response) => catalogResponse.parse(await response.json()).data.map(item => ({ id: String(item.id), name: item.name }));
            return { industries: await map(industries), locations: await map(locations) };
        }
        async function mapCompany(body: unknown) {
            const raw = upstreamCompany.parse(body).data;
            const documents = await call("recruiter/company/documents");
            if (!documents.ok) throw await upstreamError(documents);
            const verificationDocuments = documentResponse.parse(await documents.json()).data.map(file => ({ id: file.id, fileName: file.fileName, mimeType: file.mimeType, sizeBytes: file.fileSize, documentType: file.documentType, status: file.status.toLowerCase(), rejectionReason: file.rejectionReason ?? undefined, uploadedAt: file.uploadedAt ?? undefined }));
            return companySchema.parse({
                ...raw, verificationStatus: raw.verificationStatus.toLowerCase(),
                industries: raw.industry ? [{ id: String(raw.industry.id), name: raw.industry.name }] : undefined,
                city: raw.location ? provinceCity(raw.location.name) : undefined,
                verificationDocuments,
                // Java emits null for optional fields; the browser contract uses omission.
                ...Object.fromEntries(Object.entries(raw).filter(([, value]) => value === null).map(([key]) => [key, undefined])),
            });
        }
        if (isCatalog) return reply(await catalogs());
        if (isDocuments) {
            const data = await request.formData().catch(() => null);
            const files = data?.getAll("files").filter((file): file is File => file instanceof File) ?? [];
            if (!verificationFilesSchema.safeParse(files).success) return apiError(422, "VALIDATION_FAILED", "Tài liệu phải là PDF, PNG hoặc JPG, tối đa 10 MB mỗi tệp.");
            for (const file of files) {
                const bytes = Buffer.from(await file.slice(0, 8).arrayBuffer());
                const valid = file.type === "application/pdf" ? bytes.toString("ascii", 0, 5) === "%PDF-"
                    : file.type === "image/png" ? bytes.equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]))
                    : bytes[0] === 255 && bytes[1] === 216 && bytes[2] === 255;
                if (!valid) return apiError(415, "UNSUPPORTED_MEDIA_TYPE", "Nội dung tài liệu không hợp lệ.");
            }
            for (const file of files) {
                const form = new FormData(); form.set("file", file);
                const upstream = await fetch(`${baseUrl.replace(/\/$/, "")}/recruiter/company/documents?documentType=BUSINESS_REGISTRATION`, {
                    method: "POST", headers: { Accept: "application/json", Authorization: `Bearer ${accessToken}` }, body: form,
                    cache: "no-store", redirect: "error", signal: AbortSignal.timeout(15000),
                });
                if (!upstream.ok) return upstreamError(upstream);
            }
            const company = await call("recruiter/company");
            if (!company.ok) return upstreamError(company);
            const current = upstreamCompany.parse(await company.json());
            if (current.data.verificationStatus === "UNVERIFIED" || current.data.verificationStatus === "REJECTED") {
                const submitted = await fetch(`${baseUrl.replace(/\/$/, "")}/recruiter/company/verification`, {
                    method: "POST", headers: { Accept: "application/json", Authorization: `Bearer ${accessToken}` },
                    cache: "no-store", redirect: "error", signal: AbortSignal.timeout(5000),
                });
                return submitted.ok ? reply(await mapCompany(await submitted.json())) : upstreamError(submitted);
            }
            return reply(await mapCompany(current));
        }
        if (imageKind) {
            const data = await request.formData().catch(() => null);
            const file = data?.get("file");
            const validated = (imageKind === "cover" ? companyImageFileSchema : logoFileSchema).safeParse(file);
            if (!validated.success) return file instanceof File && file.size > 2 * 1024 * 1024
                ? apiError(413, "PAYLOAD_TOO_LARGE", "Ảnh tối đa 2MB.")
                : apiError(415, "UNSUPPORTED_MEDIA_TYPE", "Ảnh không hợp lệ.");
            const bytes = Buffer.from(await validated.data.slice(0, 512).arrayBuffer());
            const valid = validated.data.type === "image/png" ? bytes.subarray(0, 8).equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]))
                : validated.data.type === "image/jpeg" ? bytes[0] === 255 && bytes[1] === 216 && bytes[2] === 255
                : validated.data.type === "image/webp" ? bytes.toString("ascii", 0, 4) === "RIFF" && bytes.toString("ascii", 8, 12) === "WEBP"
                : validated.data.type === "image/svg+xml" && /<svg[\s>]/i.test(bytes.toString("utf8"));
            if (!valid) return apiError(415, "UNSUPPORTED_MEDIA_TYPE", "Nội dung ảnh không hợp lệ.");
            const body = new FormData();
            body.set("file", validated.data);
            const response = await fetch(`${baseUrl.replace(/\/$/, "")}/recruiter/company/${imageKind}`, {
                method: "POST", headers: { Accept: "application/json", Authorization: `Bearer ${accessToken}` },
                body, cache: "no-store", redirect: "error", signal: AbortSignal.timeout(15000),
            });
            return response.ok ? reply(await mapCompany(await response.json())) : upstreamError(response);
        }
        if (request.method === "GET") {
            const response = await call("recruiter/company");
            return response.ok ? reply(await mapCompany(await response.json())) : upstreamError(response);
        }
        const input = companyInputSchema.safeParse(await request.json().catch(() => null));
        if (!input.success) return invalid(input.error.issues.map(issue => String(issue.path[0])));
        const values = input.data;
        const missing = [!values.taxCode?.trim() && "taxCode", !values.description?.trim() && "description"].filter((field): field is string => !!field);
        if (missing.length) return invalid(missing);
        if (values.industryIds.length !== 1) return invalid(["industryId"]);
        // Java expects a headcount, not the UI's size range. Do not invent a number.
        if (values.size) return invalid(["size"]);
        const refs = await catalogs();
        const industry = refs.industries.find(item => item.id === values.industryIds[0]);
        const city = normalizeLocation(provinceCity(values.city));
        const location = refs.locations.find(item => normalizeLocation(provinceCity(item.name)) === city);
        if (!industry || !location) return invalid([!industry && "industryId", !location && "city"].filter((field): field is string => !!field));
        const response = await call("recruiter/company", {
            name: values.name, companySize: values.companySize, taxCode: values.taxCode, description: values.description,
            industryId: Number(industry.id), locationId: Number(location.id),
            address: values.address, contactPhone: values.contactPhone, contactEmail: values.contactEmail,
            website: values.website, foundedYear: values.foundedYear,
        });
        return response.ok ? reply(await mapCompany(await response.json()), request.method === "POST" ? 201 : 200) : upstreamError(response);
    } catch (error) {
        if (error instanceof Response) return error;
        return apiError(503, "SERVICE_UNAVAILABLE", "Không thể kết nối dịch vụ công ty. Vui lòng thử lại.");
    }
}
