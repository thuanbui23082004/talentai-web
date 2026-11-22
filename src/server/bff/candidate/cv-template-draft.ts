import { z } from "zod";
import { hasValidCsrf, isTrustedOrigin } from "@/server/bff/auth/cookies";
import { readRequestIdentity } from "@/server/bff/auth/session";

const text = z.string().max(4000);
const date = z.string().max(10);
const basics = z.object({ fullName: text, title: text, email: text, phone: text, address: text, avatarUrl: z.string().max(2_000_000), summary: text });
const schema = z.object({
    templateId: z.string().min(1).max(50),
    theme: z.object({ primaryColor: z.string().regex(/^#[0-9a-fA-F]{6}$/), backgroundId: z.string().regex(/^(none|bg-(0[1-9]|1[0-5]))$/) }),
    data: z.object({
        basics,
        education: z.array(z.object({ school: text, degree: text, startDate: date, endDate: date, description: text })).max(50),
        experience: z.array(z.object({ company: text, position: text, startDate: date, endDate: date, current: z.boolean(), description: text })).max(50),
        skills: z.array(z.object({ name: text, level: z.number().min(0).max(100) })).max(100),
        projects: z.array(z.object({ name: text, role: text, link: text, description: text })).max(50),
        certificates: z.array(z.object({ name: text, issuer: text, date })).max(50),
        languages: z.array(z.object({ name: text, level: text })).max(50),
    }),
    updatedAt: z.iso.datetime(),
});

const draftState = globalThis as typeof globalThis & { __cvTemplateDrafts?: Map<string, z.infer<typeof schema>[]> };
const drafts = (draftState.__cvTemplateDrafts ??= new Map<string, z.infer<typeof schema>[]>());

export async function handleCvTemplateDraft(request: Request) {
    if (!isTrustedOrigin(request) || !hasValidCsrf(request)) return Response.json({ error: "CSRF_TOKEN_INVALID" }, { status: 403 });
    const identity = await readRequestIdentity(request);
    if (!identity) return Response.json({ error: "UNAUTHENTICATED" }, { status: 401 });
    if (identity.user.role !== "candidate") return Response.json({ error: "FORBIDDEN" }, { status: 403 });
    const parsed = schema.safeParse(await request.json().catch(() => null));
    if (!parsed.success) return Response.json({ error: "VALIDATION_FAILED" }, { status: 422 });
    const rows = drafts.get(identity.userId) ?? [];
    rows.push(parsed.data);
    drafts.set(identity.userId, rows.slice(-20));
    return Response.json(parsed.data, { status: 201, headers: { "Cache-Control": "private, no-store" } });
}
