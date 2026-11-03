import { z } from "zod";
import type { components } from "@/lib/api/generated/schema";

export const userSchema = z.object({
    id: z.uuid(),
    email: z.email(),
    displayName: z.string().min(1),
    avatarUrl: z.url().nullish(),
    status: z.enum(["ACTIVE", "DISABLED"]),
    roles: z.array(z.enum(["CANDIDATE", "RECRUITER", "ADMIN"])).min(1),
    createdAt: z.iso.datetime({ offset: true }).nullish(),
});
export const tokensSchema = z.object({
    accessToken: z.string().min(1),
    refreshToken: z.string().min(1),
    tokenType: z.literal("Bearer"),
    expiresInSeconds: z.number().int().positive().max(2147483647),
});
export const authSchema = z.object({
    success: z.literal(true),
    data: z.object({ user: userSchema, tokens: tokensSchema }),
});
export const profileSchema = z.object({
    success: z.literal(true),
    data: z.object({ profile: userSchema }),
});
export const refreshSchema = z.object({
    success: z.literal(true),
    data: z.object({ tokens: tokensSchema }),
});
export const messageSchema = z.object({
    success: z.literal(true),
    message: z.string(),
});
export const passwordResetSchema = messageSchema.extend({
    resetToken: z.string().min(1).optional(),
});

export function mapUser(
    value: z.infer<typeof userSchema>,
): components["schemas"]["User"] | null {
    const roles = [...new Set(value.roles)];
    if (roles.length === 0) return null;
    const roleMap = {
        CANDIDATE: "candidate",
        RECRUITER: "recruiter",
        ADMIN: "admin",
    } as const;
    return {
        id: value.id,
        email: value.email,
        fullName: value.displayName,
        role: roleMap[roles[0]],
        status: value.status === "ACTIVE" ? "active" : "locked",
        ...(value.createdAt ? { createdAt: value.createdAt } : {}),
        ...(value.avatarUrl ? { avatarUrl: value.avatarUrl } : {}),
    };
}

export async function callAuth(
    backend: string,
    path: string,
    body?: unknown,
    access?: string,
) {
    return fetch(`${backend.replace(/\/$/, "")}/auth/${path}`, {
        method: body === undefined ? "GET" : "POST",
        headers: {
            Accept: "application/json",
            ...(body === undefined
                ? {}
                : { "Content-Type": "application/json" }),
            ...(access ? { Authorization: `Bearer ${access}` } : {}),
        },
        ...(body === undefined ? {} : { body: JSON.stringify(body) }),
        cache: "no-store",
        redirect: "error",
        signal: AbortSignal.timeout(5000),
    });
}
