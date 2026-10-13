import { z } from "zod";

export const envSchema = z.object({
  DATA_MODE: z.enum(["mock", "real"]).default("mock"),
  BACKEND_API_URL: z.string().url().optional(),
  NEXT_PUBLIC_APP_URL: z.string().url().optional(),
});

export const env = {
  DATA_MODE: process.env.DATA_MODE || "mock",
  BACKEND_API_URL: process.env.BACKEND_API_URL,
  NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL,
};
