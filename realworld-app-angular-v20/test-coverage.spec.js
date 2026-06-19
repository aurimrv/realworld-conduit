const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();

  await page.goto('http://localhost:4200/');
  await page.waitForTimeout(2000);

  await page.goto('http://localhost:4200/register');
  await page.waitForTimeout(2000);

  await page.goto('http://localhost:4200/login');
  await page.waitForTimeout(2000);

  await page.goto('http://localhost:4200/settings');
  await page.waitForTimeout(2000);

  await page.goto('http://localhost:4200/editor');
  await page.waitForTimeout(2000);

  await page.goto('http://localhost:4200/profile/test');
  await page.waitForTimeout(2000);

  await page.goto('http://localhost:4200/');
  await page.waitForTimeout(2000);

  await page.waitForTimeout(8000);

  console.log('Coverage exploration complete!');
  await browser.close();
})();
