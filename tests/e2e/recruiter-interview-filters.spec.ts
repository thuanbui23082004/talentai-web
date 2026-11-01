import { expect, test } from './recruiter-fixture';

test('interview filter labels and controls align in list and month views', async ({ page }, info) => {
  await page.goto('/recruiter/interviews');
  const filters = page.getByRole('region', { name: 'Lọc lịch phỏng vấn' });
  await expect(filters).toBeVisible();
  const boxes = await filters.locator('[data-slot=select-trigger], input[type=date]').evaluateAll(elements => elements.map(element => { const box = element.getBoundingClientRect(); return { y: box.y, height: box.height, width: box.width }; }));
  expect(boxes).toHaveLength(4);
  for (const box of boxes) {
    expect(box.y).toBeCloseTo(boxes[0].y, 0);
    expect(box.height).toBe(40);
    expect(box.width).toBeCloseTo(boxes[0].width, 0);
  }
  await filters.screenshot({ path: info.outputPath('interview-filters-list.png') });
  await filters.getByLabel('Từ ngày', { exact: true }).fill('2040-05-01');
  await filters.getByLabel('Đến ngày', { exact: true }).fill('2040-05-31');
  await filters.getByRole('button', { name: 'Xóa bộ lọc' }).click();
  await expect(filters.getByLabel('Từ ngày', { exact: true })).toHaveValue('');
  await expect(filters.getByLabel('Đến ngày', { exact: true })).toHaveValue('');
  await page.getByRole('button', { name: 'Lịch tháng', exact: true }).click();
  await expect(filters.locator('input[type=month]')).toBeVisible();
  const selectBox = await filters.locator('[data-slot=select-trigger]').first().boundingBox();
  const monthBox = await filters.locator('input[type=month]').boundingBox();
  expect(monthBox!.y).toBeCloseTo(selectBox!.y, 0);
  await filters.locator('input[type=month]').fill('2040-05');
  await filters.getByRole('button', { name: 'Sau', exact: true }).click();
  await expect(filters.locator('input[type=month]')).toHaveValue('2040-06');
  await filters.getByRole('button', { name: 'Trước', exact: true }).click();
  await expect(filters.locator('input[type=month]')).toHaveValue('2040-05');
  await expect(page.locator('.interview-calendar-scroll')).toBeVisible();
  await expect(page.locator('.interview-calendar-summary')).toBeVisible();
  await expect(page.locator('.interview-empty')).toHaveCount(0);
  await filters.screenshot({ path: info.outputPath('interview-filters-month.png') });
});

test('interview filter grid fits smaller screens in both views', async ({ page }, info) => {
  for (const width of [1024, 768, 375, 360]) {
    await page.setViewportSize({ width, height: 900 });
    await page.goto('/recruiter/interviews');
    const filters = page.locator('.interview-filters');
    await expect(filters.getByLabel('Từ ngày', { exact: true })).toBeVisible();
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    await page.getByRole('button', { name: 'Lịch tháng', exact: true }).click();
    await expect(filters.locator('input[type=month]')).toBeVisible();
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    if (width === 375) await filters.screenshot({ path: info.outputPath('interview-filters-mobile.png') });
  }
});
