import { test as base, expect } from '@playwright/test';

export * from '@playwright/test';
export { expect };

export const test = base.extend<{ recruiterLogin: void }>({
  recruiterLogin: [async ({ page }, use) => {
    const response = await page.request.post('/api/bff/auth/login', {
      data: { email: 'recruiter@example.test', password: 'TalentAI2026!' },
    });
    expect(response.ok()).toBeTruthy();
    await use();
  }, { auto: true }],
});
