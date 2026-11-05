import { afterEach, describe, expect, it, vi } from "vitest";
import { handleProfileRequest } from "@/server/bff/candidate/profile-service";
import { resetMockProfile } from "@/server/bff/candidate/mock-profile";
import { csrfTokenFor } from "@/server/bff/auth/cookies";
import example from "../../contracts/examples/candidate-career.json";

const base = "http://localhost:3002/api/v1";
const token = "profile-test-token";
function request(path = "experience", method = "GET", body?: unknown, headers: Record<string, string> = {}) {
    return new Request(`http://localhost/api/bff/candidate/${path}`, { method, headers: { cookie: `access_token=${token}`, "x-csrf-token": csrfTokenFor({ access: token }), "Content-Type": "application/json", ...headers }, ...(body === undefined ? {} : { body: JSON.stringify(body) }) });
}
function network(reply: () => Response | Promise<Response>, role = "CANDIDATE", userId = "10000000-0000-4000-8000-000000000001") {
    return vi.spyOn(globalThis, "fetch").mockImplementation(async (url, init) => {
        expect(new Headers(init?.headers).get("Authorization")).toBe(`Bearer ${token}`);
        if (String(url).endsWith("/auth/me")) return Response.json({ success: true, data: { profile: { id: userId, email: "profile@example.com", displayName: "Profile Test", status: "ACTIVE", roles: [role] } } });
        return reply();
    });
}
afterEach(() => { vi.restoreAllMocks(); vi.useRealTimers(); resetMockProfile(); });

describe("candidate profile BFF", () => {
    it.each(["experience", "education", "certificates"] as const)("loads %s with nullable values and original dates", async resource => {
        const fetch = network(() => Response.json({ success: true, data: { items: example[resource].map(item => ({ ...item, userId: "private-user" })) } }));
        const response = await handleProfileRequest(request(resource), base);
        expect(response.status).toBe(200);
        expect(await response.json()).toEqual(example[resource]);
        expect(String(fetch.mock.calls[1][0])).toBe(`${base}/candidate/${resource}`);
        expect(response.headers.get("cache-control")).toContain("no-store");
    });
    it("creates and edits experience with one backend write and no invented fields", async () => {
        const { id, ...input } = example.experience[0];
        const fetch = network(() => Response.json({ success: true, data: example.experience[0] }));
        expect((await handleProfileRequest(request("experience", "POST", input), base)).status).toBe(201);
        expect((await handleProfileRequest(request(`experience/${id}`, "PUT", { ...input, title: "Senior Engineer" }), base)).status).toBe(200);
        const writes = fetch.mock.calls.filter(([, init]) => ["POST", "PUT"].includes(init?.method ?? ""));
        expect(writes).toHaveLength(2);
        expect(JSON.parse(String(writes[1][1]?.body))).toEqual({ ...input, title: "Senior Engineer" });
    });
    it("updates skills as one array and does not offer certificate updates", async () => {
        const fetch = network(() => Response.json({ success: true, data: example.skills }));
        expect(await (await handleProfileRequest(request("skills", "PUT", example.skills), base)).json()).toEqual(example.skills);
        expect(fetch.mock.calls[1][1]?.method).toBe("PUT");
        expect((await handleProfileRequest(request("certificates/some-id", "PUT", {}), base)).status).toBe(405);
        expect(fetch).toHaveBeenCalledTimes(2);
    });
    it("accepts bodyless deletes and never exposes errors from another user's missing entry", async () => {
        network(() => new Response(null, { status: 204 }));
        expect((await handleProfileRequest(request("education/education-id", "DELETE"), base)).status).toBe(204);
        network(() => Response.json({ error: { message: "private data" } }, { status: 404 }));
        const response = await handleProfileRequest(request("education/not-owned", "DELETE"), base);
        expect(response.status).toBe(404);
        expect(JSON.stringify(await response.json())).not.toContain("private data");
    });
    it("requires candidate identity and protects writes from forged CSRF and cross-origin requests", async () => {
        const fetch = network(() => Response.json({}));
        expect((await handleProfileRequest(request("skills", "GET", undefined, { cookie: "" }), base)).status).toBe(401);
        const invalidHeaders: Record<string, string>[] = [{ "x-csrf-token": "bad" }, { origin: "https://evil.example" }, { "sec-fetch-site": "cross-site" }];
        for (const headers of invalidHeaders) expect((await handleProfileRequest(request("skills", "PUT", example.skills, headers), base)).status).toBe(403);
        expect(fetch).not.toHaveBeenCalled();
        vi.restoreAllMocks(); const forbidden = network(() => Response.json({}), "RECRUITER");
        expect((await handleProfileRequest(request(), base)).status).toBe(403);
        expect(forbidden).toHaveBeenCalledTimes(1);
    });
    it("validates body limits before writes and returns field errors without private server messages", async () => {
        const fetch = network(() => Response.json({ error: { fieldErrors: [{ field: "title", message: "database internals" }] } }, { status: 400 }));
        expect((await handleProfileRequest(request("experience", "POST", { company: "", title: "" }), base)).status).toBe(422);
        expect(fetch).toHaveBeenCalledTimes(1);
        const response = await handleProfileRequest(request("experience", "POST", { company: "Sao Mai", title: "Engineer" }), base);
        const body = await response.json();
        expect(body.error.fieldErrors[0].field).toBe("title");
        expect(JSON.stringify(body)).not.toContain("database internals");
    });
    it("does not retry failed writes or silently fall back to a mock", async () => {
        const fetch = network(() => { throw new Error("offline"); });
        expect((await handleProfileRequest(request("experience", "POST", { company: "Company", title: "Engineer" }), base)).status).toBe(503);
        expect(fetch).toHaveBeenCalledTimes(2);
    });
    it("rejects broken response shapes", async () => {
        network(() => Response.json({ success: true, data: { items: [{ id: "broken" }] } }));
        expect((await handleProfileRequest(request(), base)).status).toBe(503);
    });
    it("persists mock changes, uses backend IDs for edits, and isolates accounts", async () => {
        vi.useFakeTimers();
        network(() => Response.json({}));
        async function call(path: string, method = "GET", input?: unknown) {
            const promise = handleProfileRequest(request(path, method, input));
            await vi.runAllTimersAsync(); return promise;
        }
        expect(await (await call("experience")).json()).toEqual([]);
        const created = await (await call("experience", "POST", { company: "Company", title: "Engineer" })).json();
        expect((await call(`experience/${created.id}`, "PUT", { company: "Company", title: "Senior" })).status).toBe(200);
        expect((await (await call("experience")).json())[0].title).toBe("Senior");
        vi.restoreAllMocks(); network(() => Response.json({}), "CANDIDATE", "10000000-0000-4000-8000-000000000002");
        expect(await (await call("experience")).json()).toEqual([]);
        expect((await call(`experience/${created.id}`, "DELETE")).status).toBe(404);
    });
});
