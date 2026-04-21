---
name: bootstrap-token-audit
description: Scan JobFlow-UI files for Bootstrap residue and hardcoded colors that must be replaced with JobFlow design tokens. Use during code review of any HTML/SCSS changes to confirm design-system compliance.
---

# Bootstrap Token Audit

## When to use this skill

Use during code review of any JobFlow-UI HTML or SCSS change to verify no legacy Bootstrap classes or hardcoded colors remain.

## Automated scan commands

Run from repo root against the set of modified files:

```powershell
# Find Bootstrap CSS variable tokens
Select-String -Path $files -Pattern 'var\(--bs-' -AllMatches

# Find Bootstrap component classes
Select-String -Path $files -Pattern '\b(card|card-body|alert|alert-danger|alert-success|alert-warning)\b'

# Find hardcoded hex colors in SCSS
Select-String -Path $files -Pattern '#[0-9A-Fa-f]{3,8}\b' -Include '*.scss'
```

Expected result for a clean file: **zero matches** for `var(--bs-*)` and Bootstrap component classes. Hex colors may appear inside `rgba()` fallbacks only if a matching `var(--jf-*)` doesn't exist.

## Required replacements

| Found                                | Replace with                       |
| ------------------------------------ | ---------------------------------- |
| `var(--bs-primary)`                  | `var(--jf-primary)`                |
| `rgba(var(--bs-primary-rgb), 0.15)`  | `var(--jf-primary-soft)`           |
| `var(--bs-success)` / `-rgb`         | `var(--jf-success)` / `-soft`      |
| `var(--bs-danger)` / `-rgb`          | `var(--jf-danger)` / `-soft`       |
| `var(--bs-warning)` / `-rgb`         | `var(--jf-warning)` / `-soft`      |
| `var(--bs-secondary)`                | `var(--jf-text-muted)`             |
| `var(--bs-dark)`                     | `var(--jf-text)`                   |
| `var(--bs-border-color)`             | `var(--jf-border)`                 |
| `var(--bs-body-bg)`                  | `var(--jf-surface)`                |
| `.card` + `.card-body` wrappers      | `.content-card`                    |
| `.alert.alert-danger`                | `.page-alert.page-alert--danger`   |
| Hardcoded `#1E1E24`                  | `var(--jf-text)`                   |
| Hardcoded `#3F67DA`                  | `var(--jf-primary)`                |
| Hardcoded `#FFA630`                  | `var(--jf-warning)`                |
| Hardcoded `#2D898B`                  | `var(--jf-success)`                |
| Hardcoded `#E03616`                  | `var(--jf-danger)`                 |
| Hardcoded `#ffffff` (button fg)      | `var(--jf-text-on-accent)`         |

## Also verify

- Every redesigned page has a `page-container` wrapper
- Every header uses BEM `page-header__title-group` / `page-header__actions`
- All Angular bindings are intact (`*ngFor`, `*ngIf`, `[input]`, `(event)`, `{{ expr }}`, `async`, `<app-*>`)
- Build passes before running lint (lint noise on unbuildable code wastes time)
