import { expect, test } from './recruiter-fixture';
import { vietnamDay } from '@/features/interviews/calendar';

test('schedule shows chronological events, selected weekday, empty state and retries on mobile and desktop', async ({ page }, info) => {
  const month = vietnamDay(new Date().toISOString()).slice(0, 7);
  const selectedDate = `${month}-12`;
  const dateLabel = (day: number) => `${day}/${month.slice(-2)}/${month.slice(0, 4)}`;
  const titles = ['Phỏng vấn Sản phẩm', 'Trao đổi Tài chính', 'Phỏng vấn Thiết kế', 'Trao đổi Nhân sự'];
  const times = ['03:00', '04:30', '07:00', '08:30'];
  const items = times.map((time, index) => ({
    id: `00000000-0000-4000-8000-${String(index + 1).padStart(12, '0')}`,
    applicationId: '00000000-0000-4000-9000-000000000003',
    round: titles[index], jobTitle: ['Chăm sóc khách hàng', 'Tài chính', 'Tiếp thị', 'Nhân sự'][index],
    startTime: `${selectedDate}T${time}:00Z`,
    endTime: new Date(Date.parse(`${selectedDate}T${time}:00Z`) + 3_600_000).toISOString(),
    mode: 'online', invitationStatus: 'pending', status: 'scheduled',
  }));
  const endpoint = '**/api/bff/recruiter/interviews?*';
  let failed = false;
  await page.route(endpoint, route => failed
    ? route.fulfill({ status: 500, json: { error: { code: 'INTERNAL_ERROR' } } })
    : route.fulfill({ json: { items: [...items].reverse(), meta: { page: 1, pageSize: 100, totalItems: 4, totalPages: 1 } } }));
  await page.goto('/recruiter/dashboard');
  const calendar = page.getByRole('region', { name: 'Lịch trình', exact: true });
  // Select through the date strip so server and browser keep the same real clock.
  const targetDay = calendar.getByRole('button', { name: dateLabel(12), exact: true });
  for (let attempt = 0; attempt < 12 && await targetDay.count() === 0; attempt++) {
    const buttons = calendar.locator('.dashboard-calendar-days button');
    const firstDay = Number(await buttons.first().textContent());
    await (firstDay > 12 ? buttons.first() : buttons.last()).click();
  }
  await targetDay.click();
  const events = calendar.locator('.dashboard-calendar-events');
  await expect(events.locator('li')).toHaveCount(4);
  await expect(events.locator('time')).toHaveText(['10:00 AM', '11:30 AM', '2:00 PM', '3:30 PM']);
  await expect(events.locator('strong')).toHaveText(titles);
  await expect(events.getByRole('link').first()).toHaveAttribute('href', `/recruiter/interviews/${items[0].id}`);
  await expect(targetDay).toHaveAttribute('aria-pressed', 'true');
  for (const width of [1440, 375]) {
    await page.setViewportSize({ width, height: 1000 });
    await calendar.scrollIntoViewIfNeeded();
    expect(await events.evaluate(element => element.scrollWidth <= element.clientWidth)).toBe(true);
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    await calendar.screenshot({ path: info.outputPath(`calendar-timeline-${width}.png`) });
  }
  await calendar.getByRole('button', { name: dateLabel(13), exact: true }).click();
  await expect(calendar.getByText('Chưa có lịch phỏng vấn trong ngày này.')).toBeVisible();
  await targetDay.click();
  await expect(events.locator('li')).toHaveCount(4);
  failed = true;
  await calendar.getByRole('button', { name: 'Tháng sau', exact: true }).click();
  await expect(calendar.getByRole('alert')).toBeVisible();
  failed = false;
  await calendar.getByRole('button', { name: 'Thử lại', exact: true }).click();
  await expect(calendar.getByRole('alert')).toHaveCount(0);
  await expect(calendar.getByText('Chưa có lịch phỏng vấn trong ngày này.')).toBeVisible();
});
