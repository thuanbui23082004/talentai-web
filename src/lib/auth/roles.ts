export type UserRole = "candidate" | "recruiter" | "admin";

export const ROLES = {
  CANDIDATE: "candidate",
  RECRUITER: "recruiter",
  ADMIN: "admin",
} as const;
