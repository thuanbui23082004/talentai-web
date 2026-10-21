import type { components } from "@/lib/api/generated/schema";

export function apiError(status: number, code: components["schemas"]["ErrorCode"], message: string) {
  const body: components["schemas"]["ApiError"] = { error: { code, message } };
  return Response.json(body, { status, headers: { "Cache-Control": "no-store" } });
}
