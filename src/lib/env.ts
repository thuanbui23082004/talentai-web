import { z } from "zod";

export const envSchema = z.object({
  DATA_MODE: z.enum(["mock", "real"]).default("mock"),
  COMPANY_DATA_MODE: z.enum(["mock", "real"]).optional(),
  JOB_DATA_MODE: z.enum(["mock", "real"]).optional(),
  JOB_API_URL: z.url().refine(value => {
    const url = new URL(value);
    return ["http:", "https:"].includes(url.protocol) && !url.username && !url.password && !url.search && !url.hash;
  }, "JOB_API_URL phải là URL HTTP(S) hợp lệ").default("http://localhost:3004/api/v1"),
  COMPANY_API_URL: z.url().refine(value => {
    const url = new URL(value);
    return ["http:", "https:"].includes(url.protocol) && !url.username && !url.password && !url.search && !url.hash;
  }, "COMPANY_API_URL phải là URL HTTP(S) hợp lệ").default("http://localhost:3003/api/v1"),
  AUTH_API_URL: z.url().refine((value) => {
    const url = new URL(value);
    return ["http:", "https:"].includes(url.protocol) && !url.username && !url.password && !url.search && !url.hash;
  }, "AUTH_API_URL phải là URL HTTP(S) hợp lệ").default("http://localhost:3001/api/v1"),
  BACKEND_API_URL: z.url().refine((value) => {
    try {
      const url = new URL(value);
      return ["http:", "https:"].includes(url.protocol) && !url.username && !url.password && !url.search && !url.hash;
    } catch {
      return false;
    }
  }, "BACKEND_API_URL phải là URL HTTP(S) không có thông tin đăng nhập, query hoặc fragment").optional(),
}).superRefine((value, context) => {
  if (value.DATA_MODE === "real" && !value.BACKEND_API_URL) {
    context.addIssue({ code: "custom", path: ["BACKEND_API_URL"], message: "DATA_MODE=real yêu cầu BACKEND_API_URL" });
  }
});

// Read only on the server, at request time.
export function getServerEnv() {
  return envSchema.parse({
    DATA_MODE: process.env.DATA_MODE,
    COMPANY_DATA_MODE: process.env.COMPANY_DATA_MODE || undefined,
    JOB_DATA_MODE: process.env.JOB_DATA_MODE || undefined,
    JOB_API_URL: process.env.JOB_API_URL || undefined,
    COMPANY_API_URL: process.env.COMPANY_API_URL || undefined,
    AUTH_API_URL: process.env.AUTH_API_URL || undefined,
    BACKEND_API_URL: process.env.BACKEND_API_URL || undefined,
  });
}

// Auth is independent of business DATA_MODE/BACKEND_API_URL validation.
export function getAuthApiUrl() {
  return envSchema.shape.AUTH_API_URL.parse(process.env.AUTH_API_URL || undefined);
}
