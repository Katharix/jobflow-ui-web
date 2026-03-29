# JobFlow UI Automation Testing

This repo now supports both Angular unit tests and Playwright end-to-end tests.

## Commands

- `npm run test` runs Angular unit tests.
- `npm run test:e2e` runs Playwright E2E tests.
- `npm run test:e2e:ui` opens Playwright UI mode.
- `npm run test:e2e:report` opens the latest HTML report.

## First-time setup

1. `npm install`
2. `npx playwright install`

## Current Playwright coverage

- Public landing page smoke check.
- Terms page route validation.
- Privacy page route validation.
- 404 route handling.
- Authenticated admin workflow pages after seeded data creation.

## Seeded fixture setup

1. Copy `tests/e2e/.env.example` values into your shell/session.
2. Provide `JOBFLOW_UI_STORAGE_STATE_PATH` that points to a valid admin storage state JSON.
3. Provide `JOBFLOW_API_BASE_URL` and `JOBFLOW_API_BEARER_TOKEN` for API-backed data setup.

Authenticated workflow tests auto-skip when these env vars are missing.

## Generate UI storage state

Use a seeded admin account and run:

1. Set credentials and output path in your shell:
	- `JOBFLOW_TEST_EMAIL`
	- `JOBFLOW_TEST_PASSWORD`
	- Optional: `JOBFLOW_UI_STORAGE_STATE_PATH` (defaults to `./tests/e2e/.auth/admin-storage-state.json`)
2. Generate the auth state file:
	- `npm run e2e:auth:state`
3. Verify the auth state is still usable:
	- `npm run e2e:auth:verify`
4. Print base64 for GitHub secret `JOBFLOW_UI_STORAGE_STATE_B64`:
	- `npm run e2e:auth:state:b64`

Tips:

- Set `PLAYWRIGHT_HEADLESS=true` for headless auth-state generation.
- Keep `tests/e2e/.auth` local only; it is ignored by `.gitignore`.

## Next workflow scenarios to automate

1. Owner sign-in and dashboard load.
2. Onboarding checklist completion path.
3. Create client from admin area.
4. Create estimate and send for approval.
5. Convert estimate to job.
6. Schedule/dispatch job and verify timeline update.
7. Create invoice and verify payment status badge.
8. Validate plan-gated route behavior for `Go`, `Flow`, and higher tiers.
