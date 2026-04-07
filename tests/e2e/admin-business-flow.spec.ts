import { test, expect } from '@playwright/test';
import { authJson, unwrapResult } from './support/api';
import { hasEnv, requiredEnv } from './support/env';

interface OrganizationClientDto {
  id: string;
}

interface EstimateDto {
  id: string;
}

interface JobDto {
  id: string;
}

interface InvoiceDto {
  id: string;
}

const hasAuthFixtures =
  hasEnv('JOBFLOW_UI_STORAGE_STATE_PATH') &&
  hasEnv('JOBFLOW_API_BASE_URL') &&
  hasEnv('JOBFLOW_API_BEARER_TOKEN');

test.describe('Admin workflow (seeded auth)', () => {
  test.skip(!hasAuthFixtures, 'Requires JOBFLOW_UI_STORAGE_STATE_PATH, JOBFLOW_API_BASE_URL and JOBFLOW_API_BEARER_TOKEN.');

  test('business flow pages are accessible after API-created entities', async ({ browser, request, baseURL }) => {
    const apiBaseUrl = requiredEnv('JOBFLOW_API_BASE_URL').replace(/\/$/, '');
    const apiToken = requiredEnv('JOBFLOW_API_BEARER_TOKEN');
    const storageStatePath = requiredEnv('JOBFLOW_UI_STORAGE_STATE_PATH');

    const stamp = Date.now();

    const createdClientRaw = await authJson<unknown>(
      request,
      'post',
      `${apiBaseUrl}/api/organization/clients/upsert`,
      apiToken,
      {
        firstName: 'UI',
        lastName: `E2E-${stamp}`,
        emailAddress: `ui-e2e-${stamp}@example.test`
      }
    );

    const createdClient = unwrapResult<OrganizationClientDto>(createdClientRaw);

    const createdEstimate = await authJson<EstimateDto>(
      request,
      'post',
      `${apiBaseUrl}/api/estimates`,
      apiToken,
      {
        organizationClientId: createdClient.id,
        title: `UI Estimate ${stamp}`,
        description: 'UI workflow seed estimate',
        notes: 'Created by UI Playwright test',
        lineItems: [
          {
            name: 'Visit',
            description: 'On-site visit',
            quantity: 1,
            unitPrice: 100
          }
        ]
      }
    );

    const upsertedJob = await authJson<JobDto>(
      request,
      'post',
      `${apiBaseUrl}/api/job/upsert`,
      apiToken,
      {
        title: `UI Job ${stamp}`,
        comments: 'Created by UI test',
        lifecycleStatus: 0,
        organizationClientId: createdClient.id,
        estimateId: createdEstimate.id
      }
    );

    const createdInvoice = await authJson<InvoiceDto>(
      request,
      'post',
      `${apiBaseUrl}/api/invoice/organization`,
      apiToken,
      {
        organizationId: process.env.JOBFLOW_ORGANIZATION_ID ?? '00000000-0000-0000-0000-000000000000',
        jobId: upsertedJob.id,
        dueDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString(),
        lineItems: [
          {
            description: 'Service',
            quantity: 1,
            unitPrice: 100,
            lineTotal: 100
          }
        ]
      }
    );

    expect(createdInvoice.id).toBeTruthy();

    const context = await browser.newContext({ storageState: storageStatePath });
    const page = await context.newPage();

    await page.goto(`${baseURL}/admin/estimates`);
    await expect(page).toHaveURL(/\/admin\/estimates$/);
    await expect(page).not.toHaveURL(/\/auth\/login/);

    await page.goto(`${baseURL}/admin/jobs`);
    await expect(page).toHaveURL(/\/admin\/jobs$/);
    await expect(page).not.toHaveURL(/\/auth\/login/);

    await page.goto(`${baseURL}/admin/invoices`);
    await expect(page).toHaveURL(/\/admin\/invoices$/);
    await expect(page).not.toHaveURL(/\/auth\/login/);

    await context.close();
  });
});
