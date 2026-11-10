import { expect, test } from '@playwright/test';

test('admin pages use one centered search icon and omit demonstration notices', async ({ page }, info) => {
  test.setTimeout(180000);
  await page.goto('/admin/login');
  await page.getByLabel('Email', { exact: true }).fill('admin@example.test');
  await page.getByLabel('Mật khẩu', { exact: true }).fill('TalentAI2026!');
  await page.getByRole('button', { name: 'Đăng nhập', exact: true }).click();
  await expect(page.locator('.admin-cards')).toBeVisible({ timeout: 30000 });
  const routes = ['dashboard', 'users', 'companies', 'jobs', 'catalog', 'reports', 'payments', 'activity-logs', 'monitoring', 'statistics'];
  for (const route of routes) {
    await page.goto(`/admin/${route}`);
    await expect(page.locator('.admin-main h1:visible')).toBeVisible();
    await expect(page.locator('.admin-main .admin-skeleton:visible')).toHaveCount(0, { timeout: 20000 });
    const table = page.locator('.admin-main .admin-users-table:visible').first();
    if (await table.count()) {
      await expect(table.locator('th').last()).toHaveCSS('text-align', 'center');
      for (const cell of await table.locator('tbody tr td:last-child').all()) {
        await expect(cell).toHaveCSS('text-align', 'center');
        const buttons = cell.locator('.admin-access-buttons');
        if (await buttons.count()) {
          await expect(buttons).toHaveCSS('margin-top', '0px');
          await expect(buttons).toHaveCSS('justify-content', 'center');
        }
      }
    }
    await expect(page.locator('.admin-main:visible')).not.toContainText(/AdminContent\.mock|dữ liệu minh họa|chỉ được mô phỏng|giả lập/i);
    const searches = page.locator('.admin-main input[type=search]:visible');
    for (const width of [1280, 375]) {
      await page.setViewportSize({ width, height: 900 });
      await expect.poll(() => page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(width);
      if (route === 'activity-logs') {
        const dates = page.locator('.admin-activity-filters:visible .admin-filter-dates');
        const from = await dates.locator('input').nth(0).boundingBox();
        const to = await dates.locator('input').nth(1).boundingBox();
        expect(from).not.toBeNull(); expect(to).not.toBeNull();
        if (!from || !to) throw new Error('Missing date fields');
        expect(Math.abs(from.y - to.y)).toBeLessThanOrEqual(2);
        expect(to.x).toBeGreaterThan(from.x);
        const controls = page.locator('.admin-activity-filters:visible').locator('input,select,button');
        const bounds = await Promise.all((await controls.all()).map(control => control.boundingBox()));
        for (const box of bounds) {
          expect(box).not.toBeNull();
          if (box) expect(Math.abs(box.y + box.height - from.y - from.height)).toBeLessThanOrEqual(2);
        }
      }
      for (const input of await searches.all()) {
        const wrapper = input.locator('..');
        await expect(wrapper).toHaveClass(/ui-input-wrap/);
        await expect(wrapper.locator('svg')).toHaveCount(1);
        const searchField = input.locator('xpath=ancestor::label[1]');
        await expect(searchField.locator('svg:visible')).toHaveCount(1);
        // A stale outer icon must not remain visible beside the shared Input.
        await searchField.evaluate(label => {
          const extra = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
          extra.classList.add('lucide-search'); extra.setAttribute('data-search-regression', 'true');
          label.prepend(extra);
        });
        await expect(searchField.locator('svg:visible')).toHaveCount(1);
        await searchField.locator('[data-search-regression]').evaluate(node => node.remove());
        const icon = await wrapper.locator('svg').boundingBox(), field = await input.boundingBox();
        expect(icon).not.toBeNull(); expect(field).not.toBeNull();
        if (!icon || !field) throw new Error('Missing search bounds');
        expect(Math.abs(icon.y + icon.height / 2 - field.y - field.height / 2)).toBeLessThanOrEqual(2);
        expect(icon.x).toBeGreaterThan(field.x);
        expect(icon.x + icon.width).toBeLessThan(field.x + field.width);
      }
      if (route === 'users' || route === 'catalog' || route === 'activity-logs') {
        await page.addStyleTag({ content: 'nextjs-portal { display: none !important; }' });
        await page.screenshot({ path: info.outputPath(`${route}-${width}.png`) });
      }
    }
    await page.setViewportSize({ width: 1280, height: 900 });
  }
  for (const route of ['users', 'companies', 'jobs', 'reports', 'payments']) {
    await page.goto(`/admin/${route}`);
    const link = page.locator(`.admin-main:visible a[href^="/admin/${route}/"]`).first();
    await expect(link).toBeVisible();
    await link.click();
    await expect(page.locator('.admin-main h1:visible')).toBeVisible();
    await expect(page.locator('.admin-main:visible')).not.toContainText(/AdminContent\.mock|dữ liệu minh họa|chỉ được mô phỏng|giả lập/i);
  }
});
