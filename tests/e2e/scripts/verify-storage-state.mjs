import { chromium } from 'playwright';
import fs from 'node:fs/promises';
import path from 'node:path';

const baseUrl = process.env.E2E_BASE_URL ?? 'http://127.0.0.1:4200';
const storageStatePath =
  process.env.JOBFLOW_UI_STORAGE_STATE_PATH ??
  './tests/e2e/.auth/admin-storage-state.json';
const headless = process.env.PLAYWRIGHT_HEADLESS === 'true';

const fullStorageStatePath = path.resolve(storageStatePath);

async function ensureStorageStateFileExists(filePath) {
  try {
    await fs.access(filePath);
  } catch {
    console.error(`Storage state not found at: ${filePath}`);
    console.error('Run the auth-state generator first: npm run e2e:auth:state');
    process.exit(1);
  }
}

await ensureStorageStateFileExists(fullStorageStatePath);

const browser = await chromium.launch({ headless });
const context = await browser.newContext({ storageState: fullStorageStatePath });
const page = await context.newPage();

try {
  await page.goto(`${baseUrl}/admin`, { waitUntil: 'domcontentloaded' });
  await page.waitForLoadState('networkidle', { timeout: 30000 });

  const finalUrl = page.url();
  const redirectedToLogin = /\/auth\/login/i.test(finalUrl);

  if (redirectedToLogin) {
    const screenshotPath = path.resolve('./tests/e2e/.auth/storage-state-invalid.png');
    await page.screenshot({ path: screenshotPath, fullPage: true });

    console.error('Stored auth state is not valid.');
    console.error(`Final URL: ${finalUrl}`);
    console.error(`Screenshot: ${screenshotPath}`);
    process.exit(1);
  }

  console.log(`Storage state is valid. Final URL: ${finalUrl}`);
} finally {
  await context.close();
  await browser.close();
}
