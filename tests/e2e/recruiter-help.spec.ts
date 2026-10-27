import { expect, test } from '@playwright/test';

test('help navigation, Vietnamese search, categories and guides work', async ({ page }, info) => {
  await page.goto('/recruiter/dashboard');
  await page.locator('.recruiter-header-nav').getByRole('link', { name: 'Trợ giúp', exact: true }).click();
  await expect(page).toHaveURL('/recruiter/help');
  await expect(page.getByRole('heading', { name: 'Trung tâm trợ giúp' })).toBeVisible();
  await expect(page.locator('.help-guides article')).toHaveCount(10);
  await expect(page.locator('.sidebar-bottom').getByRole('link', { name: 'Hỗ trợ' })).toHaveAttribute('aria-current', 'page');
  await page.getByRole('button', { name: 'Tin tuyển dụng', exact: true }).click();
  await expect(page.locator('.help-guides article')).toHaveCount(2);
  await page.getByRole('button', { name: 'Tất cả', exact: true }).click();
  await page.getByRole('searchbox', { name: 'Tìm hướng dẫn' }).fill('sang loc');
  await expect(page.locator('.help-guides article')).toHaveCount(1);
  await page.locator('.help-guides summary').click();
  await expect(page.locator('.help-guides details p')).toContainText('kỹ năng phù hợp và còn thiếu');
  await expect(page.locator('.help-guides article a')).toHaveAttribute('href', '/recruiter/jobs');
  await page.getByRole('searchbox', { name: 'Tìm hướng dẫn' }).fill('zzzzzzzz');
  await expect(page.getByRole('status')).toContainText('Không tìm thấy hướng dẫn');
  await page.getByRole('button', { name: 'Xóa bộ lọc' }).click();
  await expect(page.locator('.help-guides article')).toHaveCount(10);
  await page.screenshot({ path: info.outputPath('help-desktop.png'), fullPage: true });
  await page.locator('.help-guides article').first().getByRole('link').click();
  await expect(page).toHaveURL('/recruiter/jobs/new');
  // The development overlay can overlap this bottom link; verify keyboard access.
  await page.locator('.sidebar-bottom').getByRole('link', { name: 'Hỗ trợ', exact: true }).focus();
  await page.keyboard.press('Enter');
  await expect(page).toHaveURL('/recruiter/help');
});

test('help remains accessible and fits mobile and tablet widths', async ({ page }, info) => {
  await page.goto('/recruiter/help');
  for (const width of [900, 768, 360]) {
    await page.setViewportSize({ width, height: 900 });
    await expect(page.getByRole('heading', { name: 'Trung tâm trợ giúp' })).toBeVisible();
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
    if (width === 360) {
      await page.locator('.recruiter-footer').getByRole('link', { name: 'Trợ giúp', exact: true }).click();
      await expect(page).toHaveURL('/recruiter/help');
      await page.evaluate(() => window.scrollTo(0, 0));
      await page.screenshot({ path: info.outputPath('help-mobile.png'), fullPage: true });
    }
  }
});
