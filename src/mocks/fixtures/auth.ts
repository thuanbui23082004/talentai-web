import type { components } from "@/lib/api/generated/schema";

import { mockRecruiterAccount, mockRecruiterPassword } from './recruiter-account';

// Development-only credentials. Never imported by client components.
export const mockAuthAccounts: { user: components["schemas"]["User"]; password: string }[] = [
  { user: mockRecruiterAccount, password: mockRecruiterPassword },
  { user: { id: "30000000-0000-4000-8000-000000000001", email: "candidate@example.com", fullName: "Nguyễn Minh Anh", role: "candidate", status: "active", createdAt: "2026-10-01T00:00:00Z" }, password: "TalentAI123!" },
  { user: { id: "30000000-0000-4000-8000-000000000002", email: "recruiter@example.com", fullName: "Trần Hoàng Nam", role: "recruiter", status: "active", companyVerificationStatus: "pending", createdAt: "2026-10-01T00:00:00Z" }, password: "TalentAI123!" },
  { user: { id: "30000000-0000-4000-8000-000000000003", email: "admin@example.com", fullName: "Quản trị TalentAI", role: "admin", status: "active", createdAt: "2026-10-01T00:00:00Z" }, password: "TalentAI123!" },
  { user: { id: "30000000-0000-4000-8000-000000000004", email: "locked@example.com", fullName: "Tài khoản bị khóa", role: "candidate", status: "locked", createdAt: "2026-10-01T00:00:00Z" }, password: "TalentAI123!" },
];
