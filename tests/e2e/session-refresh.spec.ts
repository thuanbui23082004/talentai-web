import { expect, test } from '@playwright/test';

test('renews an expired access cookie on reload and retries an expired API read', async ({ page, context }) => {
  test.setTimeout(90000);
  const registration = await page.request.post('/api/bff/auth/register', { data: {
    email: `session-${crypto.randomUUID()}@example.com`, password: 'TalentAI123!', fullName: 'Session Test', role: 'candidate',
  } });
  expect(registration.status()).toBe(201);
  // Java currently fails rotation within the same second as token issuance.
  // Model an aged access token rather than rotating the just-issued token.
  await new Promise(resolve => setTimeout(resolve, 1100));
  await context.clearCookies({ name: 'access_token' });
  await page.goto('/candidate/profile');
  await expect(page.getByRole('heading', { name: 'Hồ sơ của tôi', exact: true })).toBeVisible();
  expect((await context.cookies()).some(cookie => cookie.name === 'access_token' && cookie.httpOnly)).toBe(true);

  let reads = 0;
  let refreshes = 0;
  page.on('request', request => {
    if (request.url().endsWith('/api/bff/auth/refresh')) refreshes++;
  });
  await page.route('**/api/bff/candidate/profile', async route => {
    reads++;
    if (refreshes === 0) {
      await route.fulfill({ status: 401, contentType: 'application/json', body: JSON.stringify({ error: { code: 'SESSION_EXPIRED' } }) });
    } else await route.continue();
  });
  await new Promise(resolve => setTimeout(resolve, 1100));
  await page.reload();
  await expect(page.getByRole('heading', { name: 'Hồ sơ của tôi', exact: true })).toBeVisible();
  await expect.poll(() => refreshes).toBe(1);
  expect(reads).toBeGreaterThanOrEqual(2);
  await expect(page).toHaveURL(/\/candidate\/profile$/);
});
