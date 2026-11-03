import { describe, expect, it } from "vitest";
import { loginSchema, registerSchema } from "@/lib/auth/validation";
import example from "../../contracts/examples/auth.json";
import { toApiError } from "@/lib/api/errors";

describe("auth browser validation", () => {
  it("validates email and registration fields before sending to backend", () => {
    expect(loginSchema.parse({ email: " Candidate@Example.com ", password: "x" }).email).toBe("candidate@example.com");
    for (const change of [{ role: "admin" }, { acceptedPrivacyPolicy: false }, { confirmPassword: "mismatch" }, { password: "short" }]) {
      expect(registerSchema.safeParse({ ...example.registerRequest, ...change }).success).toBe(false);
    }
  });
  it("does not require a candidate phone, including after switching from recruiter", () => {
    const candidate = { ...example.registerRequest, role: "candidate", phone: undefined };
    expect(registerSchema.safeParse(candidate).success).toBe(true);
    expect(registerSchema.safeParse({ ...candidate, phone: "" }).success).toBe(true);
    expect(registerSchema.safeParse({ ...candidate, phone: "123" }).success).toBe(true);
    expect(registerSchema.safeParse({ ...candidate, role: "recruiter" }).success).toBe(false);
    expect(registerSchema.safeParse({ ...candidate, role: "recruiter", phone: "123" }).success).toBe(false);
    expect(registerSchema.safeParse({ ...candidate, role: "recruiter", phone: "0901234567" }).success).toBe(true);
  });
  it("never exposes raw server messages", () => {
    const error = toApiError(409, { error: { code: "EMAIL_ALREADY_EXISTS", message: "SQL secret", fieldErrors: [{ field: "email", code: "EMAIL_ALREADY_EXISTS", message: "SQL secret" }] } });
    expect(error.fieldErrors?.[0].field).toBe("email");
    expect(error.message).not.toContain("SQL");
  });
});
