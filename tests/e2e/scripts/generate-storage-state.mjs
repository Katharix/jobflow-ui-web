import { chromium } from 'playwright';
import fs from 'node:fs/promises';
import path from 'node:path';

const baseUrl = process.env.E2E_BASE_URL ?? 'http://127.0.0.1:4200';
const email = process.env.JOBFLOW_TEST_EMAIL;
const password = process.env.JOBFLOW_TEST_PASSWORD;
const storageStatePath =
  process.env.JOBFLOW_UI_STORAGE_STATE_PATH ??
  './tests/e2e/.auth/admin-storage-state.json';
const headless = process.env.PLAYWRIGHT_HEADLESS === 'true';

if (!email || !password) {
  console.error('Missing required env vars: JOBFLOW_TEST_EMAIL and/or JOBFLOW_TEST_PASSWORD');
  process.exit(1);
}

const browser = await chromium.launch({ headless });
const context = await browser.newContext();
const page = await context.newPage();

try {
  await page.goto(`${baseUrl}/auth/login`, { waitUntil: 'domcontentloaded' });

  await page.locator('#email').fill(email);
  await page.locator('#password').fill(password);

  await Promise.all([
    page.waitForURL(/\/admin|\/onboarding|\/subscribe|\/user-profile/i, { timeout: 30000 }),
    page.locator('button[type="submit"]').click()
  ]);

  const fullOutputPath = path.resolve(storageStatePath);
  await fs.mkdir(path.dirname(fullOutputPath), { recursive: true });
  await context.storageState({ path: fullOutputPath });

  console.log(`Storage state written: ${fullOutputPath}`);
} finally {
  await context.close();
  await browser.close();
}
