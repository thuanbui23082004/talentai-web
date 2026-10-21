import type { components } from "@/lib/api/generated/schema";
export type UserRole = components["schemas"]["Role"];

export const ROLES = {
  CANDIDATE: "candidate",
  RECRUITER: "recruiter",
  ADMIN: "admin",
} as const;
