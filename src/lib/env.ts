import { z } from "zod";

export const envSchema = z.object({
  DATA_MODE: z.enum(["mock", "real"]).default("mock"),
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
    BACKEND_API_URL: process.env.BACKEND_API_URL || undefined,
  });
}
