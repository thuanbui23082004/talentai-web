import { expect, test } from './recruiter-fixture';

test('create and edit forms balance the preview and keep a compact page heading', async ({ page }, info) => {
  await page.goto('/recruiter/jobs');
  const jobLink = page.locator('.detail-card-link').first();
  await expect(jobLink).toBeVisible();
  const href = await jobLink.getAttribute('href');
  for (const route of ['/recruiter/jobs/new', `${href}/edit`]) {
    await page.goto(route);
    await expect(page.locator('.create-job-grid')).toBeVisible();
    const heading = await page.locator('.create-job-heading h1').boundingBox();
    const grid = await page.locator('.create-job-grid').boundingBox();
    const form = await page.locator('.create-job-grid>form').boundingBox();
    const side = await page.locator('.create-job-side').boundingBox();
    expect(grid!.y - heading!.y - heading!.height).toBeLessThanOrEqual(40);
    expect(side!.width).toBe(360);
    expect(side!.y).toBeCloseTo(form!.y, 0);
    expect(side!.x - form!.x - form!.width).toBeCloseTo(24, 0);
    expect(side!.width / grid!.width).toBeGreaterThan(.26);
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    await page.screenshot({ path: info.outputPath(route.endsWith('/edit') ? 'edit-form-desktop.png' : 'create-form-desktop.png') });
  }
  await page.goto('/recruiter/jobs/new');
  await page.getByRole('textbox', { name: 'Tiêu đề tin', exact: true }).fill('Kỹ sư phát triển giao diện');
  await expect(page.locator('.create-job-preview h3')).toHaveText('Kỹ sư phát triển giao diện');
});

test('job form and preview fit tablet and mobile widths', async ({ page }, info) => {
  for (const width of [1280, 1024, 768, 375, 360]) {
    await page.setViewportSize({ width, height: 1000 });
    await page.goto('/recruiter/jobs/new');
    await expect(page.locator('.create-job-preview')).toBeVisible();
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), `width ${width}`).toBe(true);
    const preview = await page.locator('.create-job-preview').boundingBox();
    expect(preview!.width).toBeGreaterThanOrEqual(280);
    if (width === 375) await page.screenshot({ path: info.outputPath('create-form-mobile.png') });
  }
});

test('salary fields align and negotiable salary retains entered amounts in create and edit forms', async ({ page }, info) => {
  await page.goto('/recruiter/jobs');
  const link = page.locator('.detail-card-link').first();
  await expect(link).toBeVisible();
  const href = await link.getAttribute('href');
  for (const route of ['/recruiter/jobs/new', `${href}/edit`]) {
    await page.setViewportSize({ width: 1440, height: 1000 });
    await page.goto(route);
    const basic = page.locator('#job-basic');
    const min = basic.getByRole('spinbutton', { name: 'Từ', exact: true });
    const max = basic.getByRole('spinbutton', { name: 'Đến', exact: true });
    const negotiable = basic.getByRole('checkbox', { name: 'Thỏa thuận', exact: true });
    await min.fill('10');
    await max.fill('25');
    const minBox = await min.boundingBox();
    const maxBox = await max.boundingBox();
    expect(minBox!.y).toBeCloseTo(maxBox!.y, 0);
    expect(minBox!.width).toBeCloseTo(maxBox!.width, 0);
    expect(minBox!.height).toBe(40);
    const controls = await basic.locator('.job-basic-details [data-slot=select-trigger], .job-basic-details input').evaluateAll(elements => elements.filter(element => element.getAttribute('data-slot') === 'input' || element.getAttribute('data-slot') === 'select-trigger').map(element => element.getBoundingClientRect().y));
    expect(controls).toHaveLength(3);
    for (const y of controls) expect(y).toBeCloseTo(controls[0], 0);
    expect((await negotiable.boundingBox())!.y).toBeGreaterThan(minBox!.y + minBox!.height);
    await negotiable.check();
    await expect(min).toBeDisabled();
    await expect(max).toBeDisabled();
    await expect(page.locator('.create-job-preview')).toContainText('Thỏa thuận');
    await negotiable.uncheck();
    await expect(min).toHaveValue('10');
    await expect(max).toHaveValue('25');
    await basic.screenshot({ path: info.outputPath(route.endsWith('/edit') ? 'edit-salary.png' : 'create-salary.png') });
    await page.setViewportSize({ width: 375, height: 1000 });
    const mobileMin = await min.boundingBox();
    const mobileMax = await max.boundingBox();
    expect(mobileMin!.y).toBeCloseTo(mobileMax!.y, 0);
    expect(mobileMin!.width).toBeCloseTo(mobileMax!.width, 0);
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    await basic.screenshot({ path: info.outputPath(route.endsWith('/edit') ? 'edit-salary-mobile.png' : 'create-salary-mobile.png') });
  }
});

test('workplace fields have one heading, balanced locality inputs and a full-width address', async ({ page }, info) => {
  await page.goto('/recruiter/jobs');
  const link = page.locator('.detail-card-link').first();
  await expect(link).toBeVisible();
  const href = await link.getAttribute('href');
  for (const route of ['/recruiter/jobs/new', `${href}/edit`]) {
    await page.setViewportSize({ width: 1440, height: 1000 });
    await page.goto(route);
    const section = page.locator('#job-location');
    await expect(section.getByRole('heading', { name: 'Địa điểm làm việc', exact: true })).toBeVisible();
    await expect(section.locator('.workplace-box, h3')).toHaveCount(0);
    const city = section.locator('#job-city');
    const district = section.getByRole('textbox', { name: 'Quận/Huyện', exact: true });
    const address = section.getByRole('textbox', { name: 'Địa chỉ cụ thể', exact: true });
    await expect(city).toHaveAttribute('aria-required', 'true');
    await expect(address).toHaveAttribute('placeholder', 'Số nhà, tên đường, phường/xã');
    await district.fill('Quận kiểm thử');
    await address.fill('Địa chỉ kiểm thử');
    const cityBox = await section.locator('.location-picker').boundingBox();
    const districtBox = await district.boundingBox();
    const addressBox = await address.boundingBox();
    const fieldsBox = await section.locator('.location-fields').boundingBox();
    expect(cityBox!.y).toBeCloseTo(districtBox!.y, 0);
    expect(cityBox!.width).toBeCloseTo(districtBox!.width, 0);
    expect(cityBox!.height).toBe(40);
    expect(addressBox!.width).toBeCloseTo(fieldsBox!.width, 0);
    expect(addressBox!.y).toBeGreaterThan(districtBox!.y + districtBox!.height);
    await section.screenshot({ path: info.outputPath(route.endsWith('/edit') ? 'edit-workplace.png' : 'create-workplace.png') });
    await page.setViewportSize({ width: 375, height: 900 });
    await expect(address).toHaveValue('Địa chỉ kiểm thử');
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    expect((await district.boundingBox())!.y).toBeGreaterThan((await section.locator('.location-picker').boundingBox())!.y);
    await section.screenshot({ path: info.outputPath(route.endsWith('/edit') ? 'edit-workplace-mobile.png' : 'create-workplace-mobile.png') });
  }
});

test('job detail information column matches the editor and its heading stays on one line', async ({ page }, info) => {
  await page.goto('/recruiter/jobs');
  const link = page.locator('.detail-card-link').first();
  await expect(link).toBeVisible();
  const href = await link.getAttribute('href');
  await page.goto(href!);
  const side = page.locator('.detail-info-card');
  const title = side.locator('h2');
  await expect(side).toBeVisible();
  const sideBox = await side.boundingBox();
  const mainBox = await page.locator('.detail-columns>article').boundingBox();
  expect(sideBox!.width).toBe(360);
  expect(sideBox!.y).toBeCloseTo(mainBox!.y, 0);
  expect(sideBox!.x - mainBox!.x - mainBox!.width).toBeCloseTo(24, 0);
  for (const width of [1440, 1280, 1024, 768, 375, 360]) {
    await page.setViewportSize({ width, height: 1000 });
    await expect(title).toBeVisible();
    await expect(title).toHaveCSS('white-space', 'nowrap');
    expect((await title.boundingBox())!.height).toBeLessThanOrEqual(27);
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), `width ${width}`).toBe(true);
    if (width === 1440) await page.screenshot({ path: info.outputPath('job-detail-desktop.png') });
    if (width === 375) await side.screenshot({ path: info.outputPath('job-detail-information-mobile.png') });
  }
});
