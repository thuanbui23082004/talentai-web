import { z } from "zod";

const DEFAULT_GATEWAY_API_URL = "http://localhost:3000/api/v1";

const backendApiUrl = z.url().refine((value) => {
    try {
        const url = new URL(value);
        return ["http:", "https:"].includes(url.protocol) &&
            !url.username && !url.password && !url.search && !url.hash;
    } catch {
        return false;
    }
}, "BACKEND_API_URL phải là URL HTTP(S) không có thông tin đăng nhập, query hoặc fragment");

export const envSchema = z.object({
    DATA_MODE: z.enum(["mock", "real"]).default("mock"),
    APPLICATION_DATA_MODE: z.enum(["mock", "real"]).optional(),
    PROFILE_DATA_MODE: z.enum(["mock", "real"]).optional(),
    COMPANY_DATA_MODE: z.enum(["mock", "real"]).optional(),
    JOB_DATA_MODE: z.enum(["mock", "real"]).optional(),
    MATCHING_DATA_MODE: z.enum(["mock", "real"]).optional(),
    BACKEND_API_URL: backendApiUrl.optional(),
}).superRefine((value, context) => {
    if (value.DATA_MODE === "real" && !value.BACKEND_API_URL) {
        context.addIssue({
            code: "custom",
            path: ["BACKEND_API_URL"],
            message: "DATA_MODE=real yêu cầu BACKEND_API_URL",
        });
    }
});

// Auth and notifications use the gateway even while business data is mocked.
export function getGatewayApiUrl(backendUrl?: string) {
    return backendUrl ?? DEFAULT_GATEWAY_API_URL;
}

// Read only on the server, at request time.
export function getServerEnv() {
    return envSchema.parse({
        DATA_MODE: process.env.DATA_MODE,
        APPLICATION_DATA_MODE: process.env.APPLICATION_DATA_MODE || undefined,
        PROFILE_DATA_MODE: process.env.PROFILE_DATA_MODE || undefined,
        COMPANY_DATA_MODE: process.env.COMPANY_DATA_MODE || undefined,
        JOB_DATA_MODE: process.env.JOB_DATA_MODE || undefined,
        MATCHING_DATA_MODE: process.env.MATCHING_DATA_MODE || undefined,
        BACKEND_API_URL: process.env.BACKEND_API_URL || undefined,
    });
}

// Auth must work independently of DATA_MODE validation.
export function getAuthApiUrl() {
    return getGatewayApiUrl(backendApiUrl.optional().parse(process.env.BACKEND_API_URL || undefined));
}
