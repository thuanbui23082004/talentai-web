import { z } from "zod";
import type { components } from "@/lib/api/generated/schema";
import { parseCompanySearch } from "@/lib/companies/search";
import { findProvinceByCity, normalizeLocation } from "@/lib/locations/vietnam";
import { apiError } from "../responses";

const catalogItem = z.object({
    id: z.number().int().positive(),
    name: z.string(),
});
const catalogResponse = z.object({ data: z.array(catalogItem) });
const companySchema = z.object({
    id: z.uuid(),
    name: z.string(),
    logoUrl: z.string().nullish(),
    coverImageUrl: z.string().nullish(),
    description: z.string().nullish(),
    website: z.string().nullish(),
    address: z.string().nullish(),
    companySize: z.number().int().nonnegative().nullish(),
    foundedYear: z.number().int().nullish(),
    locationId: z.number().int().nullish(),
    industryId: z.number().int().nullish(),
    location: catalogItem.nullish(),
    industry: catalogItem.nullish(),
    verificationStatus: z
        .enum(["UNVERIFIED", "PENDING", "VERIFIED", "REJECTED"])
        .nullish(),
});
const companyPage = z.object({
    content: z.array(companySchema),
    number: z.number().int().nonnegative(),
    size: z.number().int().positive(),
    totalElements: z.number().int().nonnegative(),
    totalPages: z.number().int().nonnegative(),
});
type Catalogs = components["schemas"]["CompanyCatalogs"];

export function isPublicCompanyRequest(request: Request) {
    return /^\/api\/bff\/companies(?:\/(?:catalogs|[0-9a-f-]{36}(?:\/jobs)?))?$/i.test(
        new URL(request.url).pathname,
    );
}

function safeUrl(value?: string | null) {
    if (!value) return undefined;
    try {
        const url = new URL(value);
        return ["http:", "https:"].includes(url.protocol) &&
            !url.username &&
            !url.password
            ? url.href
            : undefined;
    } catch {
        return undefined;
    }
}

function publicCompany(
    raw: z.infer<typeof companySchema>,
    catalogs?: Catalogs,
): components["schemas"]["CompanyPublic"] {
    const industry =
        raw.industry ??
        catalogs?.industries.find((item) => item.id === String(raw.industryId));
    const location =
        raw.location ??
        catalogs?.locations.find((item) => item.id === String(raw.locationId));
    // Explicit allowlist: upstream detail includes internal tax/contact data.
    return {
        id: raw.id,
        name: raw.name,
        logoUrl: safeUrl(raw.logoUrl),
        coverImageUrl: safeUrl(raw.coverImageUrl),
        description: raw.description ?? undefined,
        website: safeUrl(raw.website),
        address: raw.address ?? undefined,
        companySize:
            raw.companySize && raw.companySize > 0
                ? raw.companySize
                : undefined,
        foundedYear: raw.foundedYear ?? undefined,
        city: location?.name,
        industries: industry
            ? [{ id: String(industry.id), name: industry.name }]
            : undefined,
        isVerified:
            raw.verificationStatus == null
                ? undefined
                : raw.verificationStatus === "VERIFIED",
    };
}

class UpstreamFailure extends Error {
    constructor(public status: number) {
        super("Company service request failed");
    }
}

export async function handleCompanyService(
    request: Request,
    baseUrl: string,
): Promise<Response> {
    if (request.method !== "GET")
        return apiError(405, "BAD_REQUEST", "Phương thức không được hỗ trợ.");
    const source = new URL(request.url);
    const path = source.pathname.replace("/api/bff/", "");
    const reply = (body: unknown) =>
        Response.json(body, {
            headers: { "Cache-Control": "private, no-store" },
        });
    async function get(
        path: string,
        params?: URLSearchParams,
    ): Promise<unknown> {
        const target = new URL(`${baseUrl.replace(/\/$/, "")}/${path}`);
        if (params) target.search = params.toString();
        for (let attempt = 0; attempt < 3; attempt++) {
            try {
                const response = await fetch(target, {
                    headers: { Accept: "application/json" },
                    cache: "no-store",
                    redirect: "error",
                    signal: AbortSignal.timeout(5000),
                });
                if (!response.ok) {
                    if (response.status >= 500 && attempt < 2) {
                        await new Promise((resolve) =>
                            setTimeout(resolve, 250),
                        );
                        continue;
                    }
                    throw new UpstreamFailure(response.status);
                }
                return await response.json();
            } catch (error) {
                if (
                    error instanceof UpstreamFailure ||
                    error instanceof SyntaxError ||
                    attempt === 2
                )
                    throw error;
                await new Promise((resolve) => setTimeout(resolve, 250));
            }
        }
        throw new UpstreamFailure(503);
    }
    async function catalogs(): Promise<Catalogs> {
        const [industries, locations] = await Promise.all([
            get("industries"),
            get("locations"),
        ]);
        const map = (value: unknown) =>
            catalogResponse
                .parse(value)
                .data.map((item) => ({ id: String(item.id), name: item.name }));
        return { industries: map(industries), locations: map(locations) };
    }
    try {
        if (path === "companies/catalogs") return reply(await catalogs());
        // Company service has no jobs endpoint. Never combine unrelated mock jobs with real companies.
        if (path.endsWith("/jobs"))
            return apiError(
                503,
                "SERVICE_UNAVAILABLE",
                "Thông tin tuyển dụng chưa sẵn sàng.",
            );
        if (path !== "companies") {
            const body = z
                .object({ data: companySchema })
                .parse(await get(path));
            return reply(publicCompany(body.data));
        }
        const allowed = new Set([
            "q",
            "city",
            "industryId",
            "locationId",
            "size",
            "minSize",
            "maxSize",
            "page",
            "pageSize",
        ]);
        const parsed = parseCompanySearch(source.searchParams);
        if (
            !parsed.success ||
            [...source.searchParams.keys()].some((key) => !allowed.has(key))
        )
            return apiError(
                422,
                "VALIDATION_FAILED",
                "Bộ lọc công ty không hợp lệ hoặc chưa được hỗ trợ.",
            );
        const filters = parsed.data;
        if (filters.industryId && !/^[1-9][0-9]*$/.test(filters.industryId))
            return apiError(
                422,
                "VALIDATION_FAILED",
                "Ngành nghề không hợp lệ.",
            );
        const refs = await catalogs();
        const query = new URLSearchParams({
            page: String(filters.page - 1),
            size: String(filters.pageSize),
        });
        if (filters.q) query.set("name", filters.q);
        if (filters.industryId) query.set("industryId", filters.industryId);
        let locationId = filters.locationId;
        if (filters.city) {
            const city =
                findProvinceByCity(filters.city)?.name.replace(
                    /^(Tỉnh|Thành phố) /,
                    "",
                ) ?? filters.city;
            const location = refs.locations.find(
                (item) =>
                    normalizeLocation(item.name.replace(/^Thành phố /, "")) ===
                    normalizeLocation(city),
            );
            if (!location || (locationId && locationId !== location.id))
                return apiError(
                    422,
                    "VALIDATION_FAILED",
                    "Địa điểm không hợp lệ.",
                );
            locationId = location.id;
        }
        if (locationId) query.set("locationId", locationId);
        if (filters.size) {
            const [minimum, maximum] = filters.size.replace("+", "").split("-");
            query.set("minSize", minimum);
            if (maximum) query.set("maxSize", maximum);
        }
        if (filters.minSize !== undefined)
            query.set("minSize", String(filters.minSize));
        if (filters.maxSize !== undefined)
            query.set("maxSize", String(filters.maxSize));
        if (
            Number(query.get("minSize") ?? 1) >
            Number(query.get("maxSize") ?? Infinity)
        )
            return apiError(
                422,
                "VALIDATION_FAILED",
                "Khoảng quy mô không hợp lệ.",
            );
        const body = companyPage.parse(await get("companies", query));
        const result: components["schemas"]["CompanyPage"] = {
            items: body.content.map((item) => publicCompany(item, refs)),
            meta: {
                page: body.number + 1,
                pageSize: body.size,
                totalItems: body.totalElements,
                totalPages: body.totalPages,
            },
        };
        return reply(result);
    } catch (error) {
        const status = error instanceof UpstreamFailure ? error.status : 503;
        if (status === 404)
            return apiError(404, "NOT_FOUND", "Không tìm thấy công ty.");
        if (status === 400 || status === 422)
            return apiError(
                422,
                "VALIDATION_FAILED",
                "Vui lòng kiểm tra bộ lọc công ty.",
            );
        if (status === 401 || status === 403)
            return apiError(
                status,
                status === 401 ? "UNAUTHENTICATED" : "FORBIDDEN",
                "Dịch vụ công ty chưa cho phép truy cập công khai.",
            );
        return apiError(
            503,
            "SERVICE_UNAVAILABLE",
            "Không thể tải thông tin công ty. Vui lòng thử lại.",
        );
    }
}
