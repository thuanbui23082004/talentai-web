import { test, expect, type Page } from '@playwright/test';

async function setup(page: Page) {
  const registration = await page.request.post('/api/bff/auth/register', { data: {
    email: `posting-ui-${crypto.randomUUID()}@example.com`, password: 'TalentAI123!', fullName: 'Posting UI Test', role: 'recruiter',
  } });
  expect(registration.status()).toBe(201);
  const session = await registration.json();
  const catalogs = await (await page.request.get('/api/bff/recruiter/company/catalogs')).json();
  const company = await page.request.post('/api/bff/recruiter/company', {
    headers: { 'X-CSRF-Token': session.csrfToken }, data: {
      name: `Posting Company ${crypto.randomUUID().slice(0, 8)}`, taxCode: String(Date.now()).slice(-10),
      description: 'Company for isolated job posting integration tests.',
      industryIds: [catalogs.industries[0].id], city: catalogs.locations[0].name,
    },
  });
  expect(company.status()).toBe(201);
  return session.csrfToken as string;
}

async function fill(page: Page, title: string) {
  await page.locator('#job-title').fill(title);
  await page.locator('#job-categoryId').click();
  await page.getByRole('option', { name: 'Software Engineering', exact: true }).click();
  await page.locator('#job-experienceLevel').click();
  await page.getByRole('option', { name: 'Chuyên gia', exact: true }).click();
  await page.locator('#description').fill('Build accessible web applications.');
  await page.locator('#requirements').fill('React and TypeScript experience.');
  await page.locator('#job-salaryMin').fill('15');
  await page.locator('#job-salaryMax').fill('25');
  await page.locator('#job-workMode').click();
  await page.getByRole('option', { name: 'Kết hợp', exact: true }).click();
  await page.locator('#job-skillIds').click();
  await page.getByRole('option', { name: 'React', exact: true }).click();
  await page.keyboard.press('Escape');
  await page.locator('#job-city').click();
  const dialog = page.getByRole('dialog');
  await dialog.getByRole('button', { name: 'Hà Nội', exact: true }).click();
  await dialog.getByRole('button', { name: 'Phường Ba Đình', exact: true }).click();
  await dialog.getByRole('button', { name: 'Chọn địa điểm', exact: true }).click();
  await page.locator('#job-address').fill('12 Hùng Vương');
}

async function removeDraft(page: Page, id: string, csrf: string) {
  const current = await (await page.request.get(`/api/bff/recruiter/jobs/${id}`)).json();
  const response = await page.request.delete(`/api/bff/recruiter/jobs/${id}`, {
    headers: { 'X-CSRF-Token': csrf, 'If-Match': String(current.posting.version) },
  });
  expect(response.status()).toBe(204);
}

test('creates a backend draft, reads it after reload and restores its values for editing', async ({ page }, info) => {
  test.setTimeout(120000);
  const csrf = await setup(page);
  const catalogs = await (await page.request.get('/api/bff/recruiter/jobs/options')).json();
  const reactId = catalogs.skills.find((skill: { skillName: string }) => skill.skillName === 'React').skillId;
  await page.goto('/recruiter/jobs/new');
  await expect(page.locator('#job-title')).toBeVisible();
  await page.getByRole('button', { name: 'Lưu & tiếp tục', exact: true }).click();
  await expect(page.getByText('Tiêu đề cần từ 3 đến 200 ký tự.', { exact: true })).toBeVisible();
  await expect(page.locator('#job-level, #job-minExperienceYears, #job-rounds')).toHaveCount(0);
  const title = `Posting ${crypto.randomUUID().slice(0, 8)}`;
  await fill(page, title);
  await page.locator('#job-applicationDeadline').click();
  await page.getByRole('group', { name: 'Danh sách ngày', exact: true }).getByRole('button').nth(15).click();
  const savedResponse = page.waitForResponse(response => response.url().endsWith('/api/bff/recruiter/jobs') && response.request().method() === 'POST');
  await page.getByRole('button', { name: 'Lưu & tiếp tục', exact: true }).click();
  const response = await savedResponse;
  expect(response.status()).toBe(201);
  const saved = await response.json();
  try {
  const body = response.request().postDataJSON();
  expect(body).toMatchObject({ categoryId: 1, experienceLevel: 'EXPERT', workMode: 'HYBRID', salaryMin: 15000000, skillIds: [reactId] });
  expect(saved.posting).toMatchObject({ status: 'DRAFT', version: 0, workplace: '1:00004' });
  expect(saved.posting.locations[0].wardId).toBeGreaterThan(0);
  await expect(page).toHaveURL(`/recruiter/jobs/${saved.id}`);
    await page.reload();
    await expect(page.getByRole('heading', { name: title, exact: true })).toBeVisible();
    await expect(page.getByText('Chuyên gia', { exact: true })).toBeVisible();
    const list = await (await page.request.get('/api/bff/recruiter/jobs?pageSize=100')).json();
    expect(list.items.some((job: { id: string }) => job.id === saved.id)).toBe(true);
    await page.goto(`/recruiter/jobs/${saved.id}/edit`);
    await expect(page.locator('#job-title')).toHaveValue(title);
    await expect(page.locator('#job-workMode')).toContainText('Kết hợp');
    await expect(page.locator('#job-experienceLevel')).toContainText('Chuyên gia');
    await expect(page.locator('#job-city')).toContainText('Phường Ba Đình');
    await expect(page.locator('#job-address')).toHaveValue('12 Hùng Vương');
    await expect(page.locator('#job-salaryMin')).toHaveValue('15');
    await page.screenshot({ path: info.outputPath('posting-edit-desktop.png'), fullPage: true });
    await page.locator('#job-title').fill(`${title} updated`);
    const updateResponse = page.waitForResponse(response => response.url().endsWith(`/api/bff/recruiter/jobs/${saved.id}`) && response.request().method() === 'PUT');
    await page.getByRole('button', { name: 'Lưu thay đổi', exact: true }).click();
    expect((await updateResponse).status()).toBe(200);
  } finally {
    await removeDraft(page, saved.id, csrf);
  }
});

test('mobile form retains entered data after a failed save and can retry', async ({ page }, info) => {
  test.setTimeout(120000);
  const csrf = await setup(page);
  await page.setViewportSize({ width: 375, height: 900 });
  await page.goto('/recruiter/jobs/new');
  await expect(page.locator('#job-title')).toBeVisible();
  await fill(page, 'Mobile posting test');
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await page.screenshot({ path: info.outputPath('posting-mobile.png'), fullPage: true });
  await page.route('**/api/bff/recruiter/jobs', route => route.fulfill({ status: 503, contentType: 'application/json', body: JSON.stringify({ error: { code: 'SERVICE_UNAVAILABLE' } }) }));
  await page.getByRole('button', { name: 'Lưu & tiếp tục', exact: true }).click();
  await expect(page.locator('.submit-error')).toBeVisible();
  await expect(page.locator('#job-title')).toHaveValue('Mobile posting test');
  await expect(page.locator('#job-city')).toContainText('Phường Ba Đình');
  await page.unroute('**/api/bff/recruiter/jobs');
  const savedResponse = page.waitForResponse(response => response.url().endsWith('/api/bff/recruiter/jobs') && response.request().method() === 'POST');
  await page.getByRole('button', { name: 'Lưu & tiếp tục', exact: true }).click();
  const response = await savedResponse;
  expect(response.status()).toBe(201);
  const saved = await response.json();
  await removeDraft(page, saved.id, csrf);
});
