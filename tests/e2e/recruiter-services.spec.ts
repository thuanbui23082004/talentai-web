import { expect, test } from './recruiter-fixture';

test('service navigation, plan comparison and benefit details work', async ({ page }, info) => {
  await page.goto('/recruiter/dashboard');
  await page.locator('.recruiter-sidebar').getByRole('link', { name: 'Dịch vụ', exact: true }).click();
  await expect(page).toHaveURL('/recruiter/services');
  await expect(page.getByRole('heading', { name: 'Tuyển đúng người, phát triển đội ngũ' })).toBeVisible();
  await expect(page.locator('.service-tool-card')).toHaveCount(6);
  await expect(page.getByRole('link', { name: 'Mở bảng theo dõi', exact: true })).toHaveAttribute('href', '/recruiter/candidates/pipeline');
  await page.screenshot({ path: info.outputPath('recruiter-services-desktop.png'), fullPage: true });
  await page.locator('.recruiter-header-nav').getByRole('link', { name: 'Bảng giá', exact: true }).click();
  await expect(page).toHaveURL('/recruiter/pricing');
  await expect(page.locator('.service-plan-card')).toHaveCount(3);
  await expect(page.locator('.service-plan-card').nth(1)).toContainText('990.000');
  await page.getByRole('button', { name: 'Theo năm', exact: true }).click();
  await expect(page.locator('.service-plan-card').nth(1).locator('.service-plan-price strong')).toContainText('10.098.000');
  await page.locator('.service-plan-card').nth(1).getByRole('button', { name: 'Xem quyền lợi', exact: true }).click();
  await expect(page.locator('#plan-benefits')).toContainText('Quyền lợi gói Tăng trưởng');
  await expect(page.locator('#plan-benefits')).toContainText('1.782.000');
  await page.getByRole('button', { name: 'Đóng chi tiết', exact: true }).click();
  await expect(page.locator('#plan-benefits')).toHaveCount(0);
  await page.evaluate(() => window.scrollTo(0, 0));
  await page.screenshot({ path: info.outputPath('recruiter-pricing-desktop.png'), fullPage: true });
  await page.locator('.recruiter-footer').getByRole('link', { name: 'Báo giá dịch vụ', exact: true }).click();
  await expect(page).toHaveURL('/recruiter/pricing');
});

test('promotions filter, copy, conditions and quoted discount respect plan and cycle', async ({ page }, info) => {
  await page.context().grantPermissions(['clipboard-read', 'clipboard-write']);
  await page.goto('/recruiter/promotions');
  await expect(page.locator('.service-offer-card')).toHaveCount(3);
  await page.getByRole('button', { name: 'Sàng lọc AI', exact: true }).click();
  await expect(page.locator('.service-offer-card')).toHaveCount(1);
  await page.locator('.service-offer-card summary').click();
  await expect(page.locator('.service-offer-card dl')).toContainText('Chuyên nghiệp');
  await page.getByRole('button', { name: 'Sao chép mã TALENTAI15', exact: true }).click();
  await expect(page.locator('.service-copy-notice')).toContainText('Đã sao chép mã TALENTAI15');
  expect(await page.evaluate(() => navigator.clipboard.readText())).toBe('TALENTAI15');
  await page.screenshot({ path: info.outputPath('recruiter-promotions-desktop.png'), fullPage: true });
  await page.getByRole('link', { name: 'Xem gói áp dụng', exact: true }).click();
  await expect(page).toHaveURL('/recruiter/pricing?offer=TALENTAI15');
  await expect(page.locator('.service-offer-banner')).toContainText('Đang xem ưu đãi TALENTAI15');
  await expect(page.locator('.service-plan-card').nth(2).locator('.service-plan-price strong')).toContainText('2.116.500');
  await expect(page.locator('.service-plan-card').nth(1)).toContainText('không áp dụng');
  await page.getByRole('button', { name: 'Theo năm', exact: true }).click();
  await expect(page.locator('.service-plan-card').nth(2)).toContainText('không áp dụng');
  await page.getByRole('button', { name: 'Bỏ ưu đãi', exact: true }).click();
  await expect(page).toHaveURL('/recruiter/pricing');
  await expect(page.locator('.service-offer-banner')).toHaveCount(0);
  await page.goto('/recruiter/pricing?offer=UNKNOWN');
  await expect(page.locator('.service-offer-banner [role=alert]')).toContainText('Không tìm thấy ưu đãi');
});

test('all three pages and their navigation fit a 360px screen', async ({ page }, info) => {
  await page.setViewportSize({ width: 360, height: 800 });
  for (const route of ['services', 'pricing', 'promotions']) {
    await page.goto(`/recruiter/${route}`);
    await expect(page.locator('.service-portal h1:visible')).toBeVisible();
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
    await page.screenshot({ path: info.outputPath(`recruiter-${route}-mobile.png`), fullPage: true });
  }
  await page.locator('.service-page-nav').getByRole('link', { name: 'Bảng giá', exact: true }).click();
  await expect(page).toHaveURL('/recruiter/pricing');
  await expect(page.locator('.recruiter-sidebar .active')).toContainText('Dịch vụ');
  for (const width of [768, 900, 1100]) {
    await page.setViewportSize({ width, height: 1000 });
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
  }
});
