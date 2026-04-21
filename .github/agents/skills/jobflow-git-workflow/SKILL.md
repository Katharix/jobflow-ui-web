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
git commit -m "feat(ui): AB#<ui-child-id> short message

Optional longer body describing what changed and why."

# Push to tracked upstream
git push
```

## Commit message format

```
<type>(<scope>): AB#<child-task-id> <short summary>

<optional body>
```

- `type`: `feat`, `fix`, `chore`, `refactor`, `docs`, `test`, `style`
- `scope`: `ui`, `api`, `mobile`, or a specific feature (`dispatch`, `jobs`, etc.)
- `child-task-id`: the child Task ID **for the repo being committed to**
  - JobFlow-UI commits → UI child Task ID
  - JobFlow-API commits → API child Task ID
  - JobFlow-Mobile commits → Mobile child Task ID
- The `AB#` prefix triggers Azure DevOps auto-linking between commit and work item

### Example
```
Parent User Story: #1200
  ├── UI Task:     #1201 → commits in JobFlow-UI use     "AB#1201"
  ├── API Task:    #1202 → commits in JobFlow-API use    "AB#1202"
  └── Mobile Task: #1203 → commits in JobFlow-Mobile use "AB#1203"
```

## Rules

- Never `git push --force` without explicit user approval
- Never bypass hooks (`--no-verify`)
- Never commit without running build first
