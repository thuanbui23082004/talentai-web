import { describe, expect, it } from "vitest";
import { envSchema } from "@/lib/env";

describe("server configuration", () => {
  it("starts in mock mode without a backend", () => {
    expect(envSchema.parse({})).toEqual({ DATA_MODE: "mock" });
  });
  it("requires an explicit HTTP backend for real mode", () => {
    for (const value of [undefined, "", "ftp://example.com", "https://user:secret@example.com", "https://example.com/?token=secret"]) {
      expect(envSchema.safeParse({ DATA_MODE: "real", BACKEND_API_URL: value }).success).toBe(false);
    }
    expect(envSchema.safeParse({ DATA_MODE: "real", BACKEND_API_URL: "http://localhost:8000/api" }).success).toBe(true);
  });
  it("rejects misspelled modes instead of silently choosing a source", () => {
    expect(envSchema.safeParse({ DATA_MODE: "mocks" }).success).toBe(false);
  });
});
