import { chromium } from 'playwright';

const referenceUrl = process.env.REFERENCE_URL || 'http://127.0.0.1:8765/project/Main.dc.html';
const appUrl = process.env.LAB_URL || 'http://localhost:4173/';
const executablePath = process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH;
const viewports = [
  { width: 1920, height: 1080 }, { width: 1680, height: 916 }, { width: 1440, height: 900 },
  { width: 1280, height: 800 }, { width: 1024, height: 768 }, { width: 768, height: 1024 }, { width: 375, height: 812 },
];
const selectors = ['.lab', '.lab-a', '.lab-b', '.lab-c', '.tp-phone'];
const browser = await chromium.launch(executablePath ? { executablePath } : {});

async function measure(url) {
  const result = {};
  for (const viewport of viewports) {
    const page = await browser.newPage({ viewport });
    await page.goto(url, { waitUntil: 'load' });
    await page.waitForFunction(() => document.querySelector('.lab'));
    await page.evaluate(() => Promise.race([document.fonts.ready, new Promise(resolve => setTimeout(resolve, 5000))]));
    await page.waitForTimeout(120);
    result[viewport.width] = await page.evaluate(selectors => Object.fromEntries(selectors.map(selector => {
      const rect = document.querySelector(selector)?.getBoundingClientRect();
      return [selector, rect ? { x: rect.x, y: rect.y, width: rect.width, height: rect.height } : null];
    })), selectors);
    await page.close();
  }
  return result;
}

try {
  const [reference, app] = await Promise.all([measure(referenceUrl), measure(appUrl)]);
  const rows = [];
  for (const viewport of viewports) for (const selector of selectors) {
    const ref = reference[viewport.width][selector];
    const actual = app[viewport.width][selector];
    const delta = ref && actual ? Object.fromEntries(['x', 'y', 'width', 'height'].map(key => [key, Math.abs(ref[key] - actual[key])])) : null;
    rows.push({ width: viewport.width, selector, reference: ref, app: actual, delta, pass: !!delta && Object.values(delta).every(value => value <= 1) });
  }
  console.log(JSON.stringify({ referenceUrl, appUrl, compared: rows.length, pass: rows.filter(row => row.pass).length, fail: rows.filter(row => !row.pass).length, rows }, null, 2));
  if (rows.some(row => !row.pass)) process.exitCode = 1;
} finally {
  await browser.close();
}
