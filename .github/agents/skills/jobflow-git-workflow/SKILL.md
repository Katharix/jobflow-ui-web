---
name: jobflow-git-workflow
description: Verified Git and Azure DevOps commands for JobFlow branch setup, commits, and pushes. Use when creating feature branches, staging changes, committing, or creating Azure DevOps work items.
---

# JobFlow Git Workflow

## When to use this skill

Use when:
- Creating a new feature branch for a JobFlow task
- Creating an Azure DevOps work item alongside a branch
- Staging, committing, or pushing changes on any JobFlow repo

## Branch setup (verified working)

Branch names use the **child Task ID** for the repo being worked on.

```powershell
# 1. Check for an existing branch before creating a new one
git branch -a | Select-String KEYWORD

# 2. If none exists, start fresh from main
git checkout main
git pull

# 3. Create and push with upstream tracking (use this repo's child Task ID)
git checkout -b feature/<child-task-id>-short-description
git push -u origin feature/<child-task-id>-short-description
```

## Azure DevOps work item hierarchy

JobFlow uses a **parent User Story + one child Task per affected repo** model:

```
User Story #<parent-id>          ← product-facing, holds description + AC
├── Task #<ui-id>       (UI)     ← cited by JobFlow-UI commits
├── Task #<api-id>      (API)    ← cited by JobFlow-API commits
└── Task #<mobile-id>   (Mobile) ← cited by JobFlow-Mobile commits
```

Commits in each repo reference **only that repo's child Task ID** — never the parent.

### Creating the hierarchy
```powershell
# Parent User Story (always with description)
az boards work-item create `
  --title "As a [user], I want [feature] so that [benefit]" `
  --type "User Story" `
  --description "<h2>Description</h2><p>...</p><h2>Acceptance Criteria</h2><ul><li>...</li></ul>" `
  --tags "feature"

# Child Task (repeat per affected repo, then link to parent)
az boards work-item create --title "UI: <short>" --type "Task" --description "<p>...</p>" --tags "frontend;ui"
az boards work-item relation add --id <child-id> --relation-type "Parent" --target-id <parent-id>
```

Always report back: **parent ID + child ID per repo + each branch name + upstream tracking status**.

## Staging + commit + push

```powershell
# Stage everything (preferred over listing files)
git add -A

# Commit using the repo's child Task ID with the AB# prefix
git commit -m "feat(ui): [AB#<ui-child-id>] short 5 word description"

# Push to tracked upstream
git push
```

## Commit message format

```
type(scope): [AB#<child-task-id>] short 5 word description
```

**Rules:**
- `type` is always present: `feat`, `fix`, `refactor`, `chore`, `style`, `test`, etc.
- `scope` is always present: `ui`, `api`, `mobile`, or a specific feature area
- `AB#<id>` is always wrapped in square brackets `[]`
- `AB#<id>` always comes BEFORE the description
- Description is ~5 words, meaningful to the PR/change
- No trailing punctuation, no ellipsis
- Use the child Task ID **for the repo being committed to** — never the parent User Story ID
  - JobFlow-UI commits → UI child Task ID
  - JobFlow-API commits → API child Task ID
  - JobFlow-Mobile commits → Mobile child Task ID

**Examples:**
```
feat(ui): [AB#20] add mobile sidebar toggle button
fix(ui): [AB#20] fix sidebar hover active colors
feat(api): [AB#21] add employee CSV import endpoint
refactor(ui): [AB#18] standardize page title components
```

### Commit body

Every commit must include a multi-line body (passed as a second `-m` argument). The body explains the change in plain English and uses footnote-style references that map to specific files and line numbers.

**Format:**
```
type(scope): [AB#<id>] short 5 word description

<summary sentence of what changed and why>

Changes:
[1] Short description of change one
[2] Short description of change two
[3] Short description of change three

References:
[1] [path/to/file.ts:42](https://github.com/<org>/<repo>/blob/<branch>/path/to/file.ts#L42)
[2] [path/to/other.scss:88](https://github.com/<org>/<repo>/blob/<branch>/path/to/other.scss#L88)
[3] [path/to/another.component.html:15](https://github.com/<org>/<repo>/blob/<branch>/path/to/another.component.html#L15)
```

**Rules:**
- The summary sentence comes first — one line, plain English, no bullet
- `Changes:` lists what was done, numbered with `[n]`
- `References:` maps each number to the exact file and line where that change lives, formatted as a Markdown permalink
- Permalink format: `[path/to/file:line](https://github.com/<org>/<repo>/blob/<branch>/path/to/file#L<line>)`
- Derive `<org>/<repo>` from `git remote get-url origin` (strip `.git` suffix, extract the last two path segments)
- `<branch>` is the current feature branch (e.g. `bugfix/39-support-hub-login-button`)
- `<path>` is relative from the repo root (no leading slash)
- Line numbers should be accurate — point to the method, rule, or element changed
- Every number in Changes must have a matching entry in References
- Use relative paths from the repo root in the link display text

**Example:**
```
feat(ui): [AB#20] add mobile sidebar toggle button

Added mobile hamburger toggle to admin navbar and fixed sidebar nav-link colors to read correctly on the primary-blue background.

Changes:
[1] Added hamburger button (d-lg-none) wired to toggleSidebar()
[2] Injected DOCUMENT, added toggleSidebar() and auto-close on navigation
[3] Fixed hover state — replaced $dark with $sidebar-nav-link-hover-color
[4] Fixed sub-menu hover and active states to match top-level

References:
[1] [src/app/layouts/admin-layout/admin-navbar/admin-navbar.component.html:12](https://github.com/Katharix/jobflow-ui-web/blob/feature/20-mobile-sidebar/src/app/layouts/admin-layout/admin-navbar/admin-navbar.component.html#L12)
[2] [src/app/layouts/admin-layout/admin-navbar/admin-navbar.component.ts:45](https://github.com/Katharix/jobflow-ui-web/blob/feature/20-mobile-sidebar/src/app/layouts/admin-layout/admin-navbar/admin-navbar.component.ts#L45)
[3] [src/styles/admin/_sidebar.scss:88](https://github.com/Katharix/jobflow-ui-web/blob/feature/20-mobile-sidebar/src/styles/admin/_sidebar.scss#L88)
[4] [src/styles/admin/_sidebar.scss:142](https://github.com/Katharix/jobflow-ui-web/blob/feature/20-mobile-sidebar/src/styles/admin/_sidebar.scss#L142)
```

**Git command:**
```powershell
git commit -m "feat(ui): [AB#20] add mobile sidebar toggle button" -m "Added mobile hamburger toggle to admin navbar and fixed sidebar nav-link colors to read correctly on the primary-blue background.

Changes:
[1] Added hamburger button (d-lg-none) wired to toggleSidebar()
[2] Injected DOCUMENT, added toggleSidebar() and auto-close on navigation
[3] Fixed hover state — replaced \$dark with \$sidebar-nav-link-hover-color
[4] Fixed sub-menu hover and active states to match top-level

References:
[1] [src/app/layouts/admin-layout/admin-navbar/admin-navbar.component.html:12](https://github.com/Katharix/jobflow-ui-web/blob/feature/20-mobile-sidebar/src/app/layouts/admin-layout/admin-navbar/admin-navbar.component.html#L12)
[2] [src/app/layouts/admin-layout/admin-navbar/admin-navbar.component.ts:45](https://github.com/Katharix/jobflow-ui-web/blob/feature/20-mobile-sidebar/src/app/layouts/admin-layout/admin-navbar/admin-navbar.component.ts#L45)
[3] [src/styles/admin/_sidebar.scss:88](https://github.com/Katharix/jobflow-ui-web/blob/feature/20-mobile-sidebar/src/styles/admin/_sidebar.scss#L88)
[4] [src/styles/admin/_sidebar.scss:142](https://github.com/Katharix/jobflow-ui-web/blob/feature/20-mobile-sidebar/src/styles/admin/_sidebar.scss#L142)"
```

## Pull Request Creation (required after every push)

After pushing, always create a PR using `gh pr create`. Never skip this step.

### PR Title Format
`<type>(<scope>): <Short human-readable summary> [AB#<child-task-id>]`
- Keep title under 60 characters (excluding the AB# tag)
- Use sentence-style description — NOT a repeat of the commit message
- Examples:
  - `feat(ui): Live Support admin layout & role gate [AB#24]`
  - `fix(api): Correct invoice total rounding error [AB#31]`

### PR Body (required)
```
## Summary
One or two sentences describing what this PR does and why.

## Changes
Bullet list of the key changes made, grouped by area (e.g., ### API, ### UI, ### Mobile).

## Work Item
Closes AB#<child-task-id> — child of User Story #<parent-id>
```

### Command
```
gh pr create \
  --base main \
  --head <branch-name> \
  --title "<title>" \
  --body "<body>"
```

### Rules
- Never leave a pushed branch without a PR
- PR title must NOT be a copy of the commit message — write a clean human-readable title
- Always include the Work Item section with AB# reference
- PR body is required — always populate all three sections (Summary, Changes, Work Item). Never leave the body empty or use a placeholder.

> **Note:** The `References:` section in the commit body is plain text only — file paths are not clickable in git log or Azure DevOps work item history. For clickable file links, add them to the **PR description** in Azure DevOps, which renders Markdown.

## Rules

- Never `git push --force` without explicit user approval
- Never bypass hooks (`--no-verify`)
- Never commit without running build first
- Always create a PR after pushing — use the PR Title Format and Body Template above
