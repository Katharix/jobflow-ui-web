---
name: jobflow-git-workflow
description: Verified Git and Azure DevOps commands for JobFlow branch setup, commits, pushes, PR creation, code review, and merge gate. Use when creating feature branches, staging changes, committing, creating Azure DevOps work items, reviewing PRs, or merging.
---

# JobFlow Git Workflow

## Critical Rules (Non-Negotiable)

1. **No direct push to main** — always open a PR.
2. **No merge before the merge gate passes** — run the pre-merge checklist before every merge.
3. **No squash unless the user explicitly asks** — atomic commits are preserved; squash destroys history and AB# traceability.
4. **No "tested/verified/working" without pasted command output** — if you cannot run the check, say so.
5. **Force-push only with `--force-with-lease`** — never plain `--force`.
6. **Every resolving PR review reply must cite a commit SHA** — "Fixed", "Done", and "Addressed" with no SHA are banned.

---

## When to use this skill

Use when:
- Creating a new feature branch for a JobFlow task
- Creating an Azure DevOps work item alongside a branch
- Staging, committing, or pushing changes on any JobFlow repo
- Creating or reviewing a PR
- Resolving PR review threads
- Running the merge gate before merging

---

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

---

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

---

## Staging + commit + push

```powershell
# Stage everything (preferred over listing files)
git add -A

# Commit using the repo's child Task ID with the AB# prefix
git commit -m "feat(ui): [AB#<ui-child-id>] short 5 word description"

# Push to tracked upstream
git push
```

---

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

---

## Pull Request Creation (required after every push)

After pushing, always create a PR using `gh pr create`. Never skip this step.

### PR size guidelines

| Size | Lines Changed | Risk |
|------|--------------|------|
| XS | 0–10 | Very Low |
| S | 11–100 | Low |
| M | 101–400 | Medium |
| L | 401–1000 | High |
| XL | 1000+ | Very High |

Target: keep PRs under 400 lines when possible. Flag XL PRs to the user before committing.

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

## Type of Change
- [ ] Bug fix
- [ ] New feature
- [ ] Breaking change
- [ ] Refactoring
- [ ] Documentation / chore

## Changes
Bullet list of the key changes made, grouped by area (e.g., ### API, ### UI, ### Mobile).

## Testing
- [ ] Unit tests added/updated
- [ ] Manual testing performed
- [ ] Screenshots attached (for UI changes)

## Work Item
Closes AB#<child-task-id> — child of User Story #<parent-id>

## Checklist
- [ ] Self-review performed
- [ ] No new lint warnings introduced
- [ ] Tests pass locally
```

### Command
```powershell
gh pr create `
  --base main `
  --head <branch-name> `
  --title "<title>" `
  --body "<body>"
```

---

## Code Review

### Review comment levels

Use these prefixes so reviewers understand the weight of feedback:

```
🔴 Blocking — must be addressed before merge
🟡 Suggestion — should consider, strong preference
🟢 Nit — minor, take it or leave it
💡 Question — seeking understanding, not a change request
👍 Praise — call out good work
```

Example:
```
🔴 Blocking: This passes raw user input into a query — sanitize before use.
🟡 Suggestion: Extract this into a shared service — it's duplicated in JobController too.
🟢 Nit: `data` → `jobListData` would be clearer here.
💡 Question: Why a Map instead of a plain object here?
```

### Responding to review threads

**Every resolving reply must include the commit SHA.** These are banned:
- `Addressed`
- `Fixed`
- `Done`
- `Good point, updated`

**Required format:**
```
Fixed in <sha7> — <one sentence: what changed and why>.
```

Example:
```
Fixed in a3f82c1 — moved sanitization into the JobService before the query executes.
```

After pushing the fix, reply to the thread then resolve it:
```powershell
# Get the SHA of your fix commit
$SHA = git rev-parse HEAD

# Reply to the thread (replace PRRT_xxx with the thread node_id)
gh api graphql -f query='
  mutation($body: String!, $id: ID!) {
    addPullRequestReviewThreadReply(input: {body: $body, pullRequestReviewThreadId: $id}) {
      comment { id }
    }
  }' `
  -f body="Fixed in $($SHA.Substring(0,7)) — <explanation>." `
  -f id="PRRT_xxx"

# Resolve the thread
gh api graphql -f query='mutation { resolveReviewThread(input: {threadId: "PRRT_xxx"}) { thread { isResolved } } }'
```

---

## Merge Gate (run before every merge)

Before merging any PR, verify all of the following. If any check fails, stop and fix — do not override.

```powershell
# Single command that returns every PR-level gate input
gh pr view <NUMBER> --json reviewDecision,mergeStateStatus,mergeable,statusCheckRollup,reviewThreads
```

**Merge-ready requires ALL of:**
- `reviewDecision` == `"APPROVED"`
- `mergeStateStatus` == `"CLEAN"`
- `mergeable` == `"MERGEABLE"`
- Every `statusCheckRollup[].conclusion` == `"SUCCESS"`
- Every `reviewThreads[].isResolved` == `true`

**Also check for CI annotations** (warnings that don't fail the check but still need fixing):
```powershell
gh api "repos/{owner}/{repo}/commits/<SHA>/check-runs" `
  --jq '.check_runs[] | select(.output.annotations_count > 0) | {name, annotations: .output.annotations_count}'
```

### Pre-merge checklist
- [ ] All review threads resolved (verified via API, not by memory)
- [ ] All CI checks passing — no failing jobs
- [ ] No CI annotations outstanding
- [ ] Branch rebased on `main` — no stray merge commits in the PR branch
- [ ] AB# work item reference is correct in the PR title

### Common merge blockers

| Blocker | Diagnosis | Fix |
|---------|-----------|-----|
| `REVIEW_REQUIRED` but no pending reviewers | Auto-approve raced with Copilot review | Re-run PR Quality Gates workflow |
| `BLOCKED` with all checks green | Unresolved review threads (even from old commits) | Resolve all threads via GraphQL |
| Auto-merge dropped after push | New commits nullify `autoMergeRequest` | Re-queue with `gh pr merge --auto` |
| CI annotations but status green | Reviewdog warnings don't block by default | Fix annotations before merging |

---

## Conflict resolution

```powershell
# Preferred: rebase onto main (keeps linear history)
git checkout feature/<id>-description
git fetch origin
git rebase origin/main
# Resolve any conflicts, then:
git add <resolved-file>
git rebase --continue
git push --force-with-lease   # ← always --force-with-lease, never --force
```

If a conflict is complex:
```powershell
git mergetool --tool=vscode
```

---

## Post-merge cleanup

```powershell
# Switch to main and pull
git checkout main
git pull

# Delete the local feature branch
git branch -d feature/<id>-description

# Remote branch is auto-deleted if the repo setting is enabled; otherwise:
git push origin --delete feature/<id>-description
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
