---
name: jobflow-ui-redesign
description: Apply the JobFlow design system to Angular pages. Use when redesigning, restyling, or refactoring any JobFlow-UI component to match the current design language (page-container, kpi-grid, cta-card, content-card, var(--jf-*) tokens).
---

# JobFlow-UI Redesign

## When to use this skill

Use whenever a task involves:
- Redesigning an existing JobFlow-UI page or component
- Migrating a component away from Bootstrap classes / hardcoded colors
- Applying the standard page shell to a new component
- Reviewing a UI PR for design-system compliance

## Confirmed file paths (skip discovery)

```
src/app/admin/dispatch/                                          ← Dispatch
src/app/admin/jobs/job.component.*                               ← Jobs
src/app/admin/jobs/job-schedule/                                 ← Job Schedule
src/app/admin/jobs/job-templates/                                ← Job Templates
src/app/admin/estimates/                                         ← Estimates
src/app/admin/customer/                                          ← Clients (folder is "customer")
src/app/admin/company/                                           ← Company Settings
src/app/admin/employee-roles/                                    ← Employee Roles
src/app/admin/subscription-management/                           ← Subscription Management
src/app/admin/settings/                                          ← Settings hub
src/app/admin/settings/workflow-settings/                        ← Workflow
src/app/views/general/user-profile/                              ← User Profile (NOT admin/)
src/app/views/general/onboarding-checklist/onboarding-steps/connect-payment/  ← Connected Accounts
```

### Naming mismatches to remember

| User-facing name    | Actual folder               |
| ------------------- | --------------------------- |
| Clients             | `customer/`                 |
| Connected Accounts  | `connect-payment/`          |
| Workflow            | `workflow-settings/`        |
| User Profile        | under `views/general/`      |

## Standard HTML patterns

```html
<div class="page-container">
  <header class="page-header">
    <div class="page-header__title-group">
      <h1 class="page-header__title">Title</h1>
      <p class="page-header__subtitle">Subtitle</p>
    </div>
    <div class="page-header__actions"><!-- buttons --></div>
  </header>

  <div class="page-alert page-alert--danger">{{ error }}</div>

  <div class="kpi-grid kpi-grid--4" role="list" aria-label="Metrics">
    <div class="kpi-tile" role="listitem">
      <div class="kpi-tile__accent"></div>
      <div class="kpi-tile__body">
        <span class="kpi-tile__value">{{ value }}</span>
        <span class="kpi-tile__label">Label</span>
        <span class="kpi-tile__note">Note</span>
      </div>
    </div>
  </div>

  <div class="cta-card">
    <p class="cta-card__eyebrow">Section</p>
    <h3 class="cta-card__title">Title</h3>
    <p class="cta-card__body">Body</p>
    <div class="cta-card__actions"><button class="btn btn-primary">Action</button></div>
  </div>

  <div class="content-card">
    <div class="content-card__header">
      <h3 class="content-card__title">Section</h3>
      <div class="content-card__actions"><!-- buttons --></div>
    </div>
    <!-- content -->
  </div>

  <div class="filter-bar">
    <button class="filter-chip" [class.filter-chip--active]="active">Label</button>
  </div>
</div>
```

## Execution rules

1. **Read 2 reference pages first.** Find already-redesigned components (check `admin/dashboard/`, `admin/invoices/`) and read their `.html` + `.scss` fully before editing.
2. **Batch by filesystem location, not count.** 6–7 pages per batch (`src/app/admin/` separate from `src/app/views/`). Batches can run in parallel.
3. **Preserve all Angular syntax.** `*ngFor`, `*ngIf`, `[binding]`, `(event)`, `{{ expr }}`, `async`, `<app-*>`, routerLinks, form controls — untouched.
4. **Only modify `.ts`** when a binding strictly requires it; log any `.ts` changes explicitly.
5. **Per-file completion checklist (verify before moving on):**
   - No `var(--bs-*)` tokens remain
   - No hardcoded hex colors remain (replaced with `var(--jf-*)`)
   - No `.card`, `.card-body`, `.alert`, `.alert-danger` classes remain
   - Page wrapped in `page-container`
   - Header uses BEM `page-header__*` structure

## Token migration reference

| Bootstrap                          | JobFlow                    |
| ---------------------------------- | -------------------------- |
| `var(--bs-primary)`                | `var(--jf-primary)`        |
| `var(--bs-primary-rgb)` (rgba)     | `var(--jf-primary-soft)`   |
| `var(--bs-success)` / `-rgb`       | `var(--jf-success)` / `-soft` |
| `var(--bs-danger)` / `-rgb`        | `var(--jf-danger)` / `-soft`  |
| `var(--bs-warning)` / `-rgb`       | `var(--jf-warning)` / `-soft` |
| `var(--bs-secondary)`              | `var(--jf-text-muted)`     |
| `var(--bs-dark)`                   | `var(--jf-text)`            |
| `var(--bs-border-color)`           | `var(--jf-border)`         |
| `var(--bs-body-bg)`                | `var(--jf-surface)`        |
| `.card` / `.card-body`             | `.content-card`            |
| `.alert.alert-danger`              | `.page-alert.page-alert--danger` |
