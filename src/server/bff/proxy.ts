import { apiError } from "./responses";

export async function proxyRequest(request: Request, backendUrl: string): Promise<Response> {
  const source = new URL(request.url);
  const path = source.pathname.slice("/api/bff/".length);
  // Private endpoints require session, cookie and CSRF handling first.
  if (request.method !== "GET" || !["jobs", "health"].includes(path)) {
    return apiError(503, "SERVICE_UNAVAILABLE", "Endpoint chưa được tích hợp.");
  }
  const target = new URL(`${backendUrl.replace(/\/$/, "")}/${path}`);
  target.search = source.search;
  for (let attempt = 0; attempt < 3; attempt++) {
    let upstream: Response;
    try {
      upstream = await fetch(target, {
        headers: { Accept: "application/json" }, cache: "no-store",
        redirect: "error", signal: AbortSignal.timeout(5000),
      });
    } catch {
      if (attempt < 2) await new Promise((resolve) => setTimeout(resolve, 1000));
      continue;
    }
    // Never expose backend error text, headers or cookies to the browser.
    if (!upstream.ok) {
      const codes = { 401: "UNAUTHENTICATED", 403: "FORBIDDEN", 404: "NOT_FOUND", 422: "VALIDATION_FAILED", 429: "RATE_LIMITED" } as const;
      const code = codes[upstream.status as keyof typeof codes];
      return apiError(code ? upstream.status : 503, code ?? "SERVICE_UNAVAILABLE", "Không thể tải dữ liệu. Vui lòng kiểm tra và thử lại.");
    }
    try {
      const body: unknown = await upstream.json();
      return Response.json(body, { headers: { "Cache-Control": "no-store" } });
    } catch {
      return apiError(503, "SERVICE_UNAVAILABLE", "Dữ liệu phản hồi không hợp lệ.");
    }
  }
  return apiError(503, "SERVICE_UNAVAILABLE", "Không thể kết nối dịch vụ. Vui lòng thử lại sau.");
}
