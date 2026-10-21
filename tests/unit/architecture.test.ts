import { ESLint } from "eslint";
import { describe, expect, it } from "vitest";

describe("architecture guardrails", () => {
  const eslint = new ESLint();
  it("rejects direct server imports, cross-feature internals and raw fetch in components", async () => {
    const [result] = await eslint.lintText('"use client";\nimport { getServerEnv } from "@/lib/env";\nimport { getJobs } from "@/features/jobs/services/jobs";\nexport const load = () => fetch("/jobs");\nconsole.log(getServerEnv, getJobs);', { filePath: "src/features/auth/components/probe.tsx" });
    expect(result.messages.filter((message) => message.ruleId === "project/architecture")).toHaveLength(3);
  });
  it("allows public feature imports in pages", async () => {
    const [result] = await eslint.lintText('import { JobList } from "@/features/jobs";\nexport default function Page() { return <JobList />; }', { filePath: "src/app/probe/page.tsx" });
    expect(result.errorCount).toBe(0);
  });
});
