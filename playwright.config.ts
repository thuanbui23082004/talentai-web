import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: "./tests/e2e",
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  // Recruiter scenarios mutate the same in-memory mock workspace.
  workers: 1,
  reporter: [["list"], ["html", { open: "never" }]],
  use: {
    baseURL: "http://127.0.0.1:3100",
    trace: "on-first-retry",
  },
  webServer: {
    command: "npm run dev -- --hostname 127.0.0.1 --port 3100",
    url: "http://127.0.0.1:3100/jobs",
    reuseExistingServer: false,
    env: { DATA_MODE: "mock", APPLICATION_DATA_MODE: process.env.APPLICATION_DATA_MODE ?? "mock", PROFILE_DATA_MODE: process.env.PROFILE_DATA_MODE ?? "mock", COMPANY_DATA_MODE: process.env.COMPANY_DATA_MODE ?? "mock", JOB_DATA_MODE: process.env.JOB_DATA_MODE ?? "mock", PLAYWRIGHT_TEST: "1" },
    timeout: 120_000,
  },
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
  ],
});
