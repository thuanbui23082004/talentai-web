import { z } from "zod";
import { ApiError } from "@/lib/api";

type SettingsFieldError = { field: string; message: string };

export class SettingsError extends Error {
    constructor(
        public key: string,
        public status?: number,
        public fieldErrors: SettingsFieldError[] = [],
    ) {
        super(key);
    }
}

const errorBodySchema = z.object({
    error: z.object({
        code: z.string(),
        fieldErrors: z.array(z.object({ field: z.string(), code: z.string().optional() })).optional(),
    }),
});
const errorKeys: Record<string, string> = {
    UNAUTHENTICATED: "session", SESSION_EXPIRED: "session", CSRF_TOKEN_INVALID: "session",
    FORBIDDEN: "forbidden", ACCOUNT_LOCKED: "locked", CURRENT_PASSWORD_INCORRECT: "passwordIncorrect",
    VALIDATION_FAILED: "invalid", CONFLICT: "conflict", PAYLOAD_TOO_LARGE: "fileSize", UNSUPPORTED_MEDIA_TYPE: "imageType",
};

export function settingsError(error: unknown, status?: number) {
    if (error instanceof SettingsError) return error;
    const body = error instanceof ApiError
        ? { error: { code: error.code, fieldErrors: error.fieldErrors } }
        : error;
    const parsed = errorBodySchema.safeParse(body);
    const fields = parsed.success ? parsed.data.error.fieldErrors ?? [] : [];
    const fieldErrors = fields.map(({ field, code }) => ({
        field,
        message: field === "taxCode" && code === "CONFLICT"
            ? "Mã số thuế đã được một công ty khác sử dụng."
            : "Vui lòng kiểm tra lại thông tin này.",
    }));
    const key = parsed.success ? errorKeys[parsed.data.error.code] ?? "request" : "request";
    return new SettingsError(key, status ?? (error instanceof ApiError ? error.status : undefined), fieldErrors);
}

export async function settingsRequest<T>(action: () => Promise<T>): Promise<T> {
    try {
        return await action();
    } catch (error) {
        if (error instanceof z.ZodError) throw error;
        throw settingsError(error);
    }
}
