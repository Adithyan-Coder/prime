const { chromium } = require('playwright');
(async () => {
  const browser = await chromium.launch();
  const context = await browser.newContext();
  const page = await context.newPage();
  page.on('console', msg => console.log('console>', msg.type(), msg.text()));
  page.on('pageerror', err => console.log('pageerror>', err.toString()));
  await page.goto('http://localhost:5173');
  await page.waitForTimeout(2000);
  try {
    await page.click('text=Sign In');
  } catch (e) {}
  await page.waitForTimeout(1000);
  await page.click('text=View details');
  await page.waitForTimeout(1500);
  await page.click('text=Repository');
  await page.waitForTimeout(1500);
  console.log('Done.');
  await browser.close();
})();
