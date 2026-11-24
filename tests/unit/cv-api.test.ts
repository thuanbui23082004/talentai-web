import { afterEach, describe, expect, it, vi } from "vitest";
import { handleCvsRequest } from "@/server/bff/candidate/cv-service";
import { resetMockCvs } from "@/server/bff/candidate/mock-cvs";
import { csrfTokenFor } from "@/server/bff/auth/cookies";
import { CV_DOCX_TYPE } from "@/lib/api/cv-schemas";
import example from "../../contracts/examples/uploaded-cv.json";
import { docxCv, pdfCv } from "../support/cv-files";

const base = "http://localhost:3002/api/v1";
const token = "cv-test-token";
function request(path = "", method = "GET", file?: File, headers: Record<string, string> = {}) {
    const body = file ? new FormData() : undefined;
    if (file) body!.set("file", file);
    return new Request(`http://localhost/api/bff/cvs${path}`, { method, body, headers: { cookie: `access_token=${token}`, "x-csrf-token": csrfTokenFor({ access: token }), ...headers } });
}
function network(reply: (url: string, init?: RequestInit) => Response | Promise<Response>, role = "CANDIDATE", userId = "10000000-0000-4000-8000-000000000001") {
    return vi.spyOn(globalThis, "fetch").mockImplementation(async (url, init) => {
        if (!String(url).startsWith("https://res.cloudinary.com/")) expect(new Headers(init?.headers).get("Authorization")).toBe(`Bearer ${token}`);
        if (String(url).endsWith("/auth/me")) return Response.json({ success: true, data: { profile: { id: userId, email: "cv@example.com", displayName: "CV Test", status: "ACTIVE", roles: [role] } } });
        return reply(String(url), init);
    });
}
afterEach(() => { vi.restoreAllMocks(); vi.useRealTimers(); resetMockCvs(); });

describe("candidate CV BFF", () => {
    it("loads lists and details without exposing storage keys or user IDs", async () => {
        network(url => Response.json({ success: true, data: url.endsWith("/cvs") ? { items: [{ ...example, userId: "private", cloudinaryPublicId: "secret" }] } : { ...example, userId: "private" } }));
        expect(await (await handleCvsRequest(request(), base)).json()).toEqual([example]);
        expect(await (await handleCvsRequest(request("/cv-upload-1"), base)).json()).toEqual(example);
    });
    it.each([["resume.pdf", "application/pdf", pdfCv()], ["resume.docx", CV_DOCX_TYPE, docxCv()]] as const)("uploads valid %s once with a new multipart boundary", async (name, type, bytes) => {
        const fetch = network(async (url, init) => {
            expect(url).toBe(`${base}/cvs`);
            expect(init?.body).toBeInstanceOf(FormData);
            expect(new Headers(init?.headers).has("Content-Type")).toBe(false);
            const forwarded = (init?.body as FormData).get("file");
            expect(forwarded).toBeInstanceOf(File);
            expect((forwarded as File).name).toBe(name);
            expect((forwarded as File).type).toBe(type);
            expect(Buffer.from(await (forwarded as File).arrayBuffer())).toEqual(bytes);
            return Response.json({ success: true, data: example }, { status: 201 });
        });
        expect((await handleCvsRequest(request("", "POST", new File([bytes], name, { type })), base)).status).toBe(201);
        expect(fetch).toHaveBeenCalledTimes(2);
    });
    it("accepts a PDF with a leading newline from an exporter", async () => {
        network(() => Response.json({ success: true, data: example }, { status: 201 }));
        const file = new File(["\n", pdfCv()], "exported.pdf", { type: "application/pdf" });
        expect((await handleCvsRequest(request("", "POST", file), base)).status).toBe(201);
    });
    it("serves an owned mock PDF inline and as an attachment", async () => {
        network(() => Response.json({}));
        const bytes = Buffer.from("\n%PDF-1.7 sample");
        const uploaded = await handleCvsRequest(request("", "POST", new File([bytes], "resume.pdf", { type: "application/pdf" })));
        const cv = await uploaded.json();
        const inline = await handleCvsRequest(request(`/${cv.id}/file`));
        expect(inline.status).toBe(200);
        expect(inline.headers.get("content-type")).toBe("application/pdf");
        expect(inline.headers.get("content-disposition")).toContain("inline");
        expect(Buffer.from(await inline.arrayBuffer())).toEqual(bytes);
        const attachment = await handleCvsRequest(request(`/${cv.id}/file?disposition=attachment`));
        expect(attachment.headers.get("content-disposition")).toContain("attachment");
    });
    it("fetches a real CV through the BFF without forwarding the bearer token to storage", async () => {
        const bytes = Buffer.from("\n%PDF-1.7 sample");
        network((url, init) => {
            if (url.endsWith("/cvs/cv-upload-1")) return Response.json({ success: true, data: { ...example, fileUrl: "https://res.cloudinary.com/demo/raw/upload/resume.pdf" } });
            expect(url).toBe("https://res.cloudinary.com/demo/raw/upload/resume.pdf");
            expect(new Headers(init?.headers).has("Authorization")).toBe(false);
            return new Response(bytes, { headers: { "Content-Type": "application/pdf" } });
        });
        const response = await handleCvsRequest(request("/cv-upload-1/file"), base);
        expect(response.status).toBe(200);
        expect(Buffer.from(await response.arrayBuffer())).toEqual(bytes);
    });
    it("rejects invalid and oversized files before contacting the CV backend", async () => {
        const fetch = network(() => Response.json({}));
        for (const file of [new File(["html"], "cv.pdf", { type: "application/pdf" }), new File(["PK fake zip"], "cv.docx", { type: CV_DOCX_TYPE }), new File([], "cv.pdf", { type: "application/pdf" }), new File([new Uint8Array(5 * 1024 * 1024 + 1)], "large.pdf", { type: "application/pdf" })]) {
            expect((await handleCvsRequest(request("", "POST", file), base)).status).toBe(422);
        }
        expect(fetch.mock.calls.filter(([url]) => !String(url).endsWith("/auth/me"))).toHaveLength(0);
    });
    it("requires candidate identity and valid CSRF/origin on writes", async () => {
        const fetch = network(() => new Response(null, { status: 204 }));
        expect((await handleCvsRequest(request("", "GET", undefined, { cookie: "" }), base)).status).toBe(401);
        expect((await handleCvsRequest(request("/id/default", "PATCH", undefined, { "x-csrf-token": "bad" }), base)).status).toBe(403);
        expect((await handleCvsRequest(request("/id", "DELETE", undefined, { origin: "https://evil.example" }), base)).status).toBe(403);
        expect(fetch).not.toHaveBeenCalled();
        network(() => Response.json({}), "RECRUITER");
        expect((await handleCvsRequest(request(), base)).status).toBe(403);
    });
    it("supports bodyless default/delete operations and does not retry failed writes", async () => {
        const fetch = network(() => new Response(null, { status: 204 }));
        expect((await handleCvsRequest(request("/id/default", "PATCH"), base)).status).toBe(204);
        expect((await handleCvsRequest(request("/id", "DELETE"), base)).status).toBe(204);
        expect(fetch.mock.calls[1][1]?.method).toBe("PATCH");
        network(() => { throw new Error("offline"); });
        expect((await handleCvsRequest(request("/id", "DELETE"), base)).status).toBe(503);
    });
    it("keeps mock files and defaults consistent and isolates accounts", async () => {
        network(() => Response.json({}));
        async function call(path = "", method = "GET", file?: File) {
            return handleCvsRequest(request(path, method, file));
        }
        const first = await (await call("", "POST", new File([pdfCv()], "first.pdf", { type: "application/pdf" }))).json();
        const second = await (await call("", "POST", new File([pdfCv()], "second.pdf", { type: "application/pdf" }))).json();
        expect(first.isDefault).toBe(true); expect(second.isDefault).toBe(false);
        expect((await call(`/${second.id}/default`, "PATCH")).status).toBe(204);
        expect((await (await call()).json()).filter((item: { isDefault: boolean }) => item.isDefault).map((item: { id: string }) => item.id)).toEqual([second.id]);
        await call(`/${second.id}`, "DELETE");
        expect((await (await call()).json())[0].isDefault).toBe(true);
        network(() => Response.json({}), "CANDIDATE", "10000000-0000-4000-8000-000000000002");
        expect(await (await call()).json()).toEqual([]);
        expect((await call(`/${first.id}`)).status).toBe(404);
        expect((await call(`/${first.id}/default`, "PATCH")).status).toBe(404);
        expect((await call(`/${first.id}`, "DELETE")).status).toBe(404);
    });
});
