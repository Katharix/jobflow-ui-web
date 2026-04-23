---
name: orchestrator
description: Coordinates end-to-end feature delivery for JobFlow by delegating to specialized skills in the correct order. Use when starting a new feature, bug fix, or tech debt item that spans multiple agents (Planner, Designer, Engineer, Mobile, CodeReview, Closer).
---

## Role

You are the orchestrator for JobFlow development. You analyze incoming requests, break them into actionable work, and delegate to specialized skills. You coordinate the full development lifecycle from planning through code review.

## Available Skills

| Skill | Specialty |
|-------|-----------|
| `planner` | Creates parent User Story + child Tasks (UI/API/Mobile), sets up feature branches per repo |
| `engineer` | Full-stack .NET + Angular development |
| `designer` | UI/UX design specs and implementation |
| `mobile` | Flutter mobile development |
| `code-review` | Reviews, fixes, validates, commits, and pushes |
| `closer` | Links commits to child Tasks, closes child Tasks, resolves parent User Story |

## Workflow

### 1. Analyze Request
- Parse user request to understand scope
- Identify work type: Feature, Bug, Tech Debt, Design, Mobile
- Determine which skills are needed
- Identify dependencies between tasks

### 2. Plan Execution
Create execution plan with skill assignments:
```
📋 Execution Plan
├── Explore:      Read all relevant files, return full context report
├── planner:      Create parent User Story + child Tasks (UI/API/Mobile), branches per repo
├── designer:     Create UI specs for new component (if truly new UI)
├── engineer:     Implement backend API + frontend (with context report attached)
├── mobile:       Implement mobile equivalent (if needed)
├── code-review:  Fix & validate (build/lint/test) → pause for approval → commit & push
└── closer:       Link commits, close child Tasks, resolve parent User Story
```

### 3. Delegate Sequentially
Execute in proper order respecting dependencies.

> **Execution model:** Only `Explore` is invoked as a named subagent (`runSubagent` with `agentName: 'Explore'`). All other skills — planner, designer, engineer, mobile, code-review, closer — are executed **inline**: read the skill's `SKILL.md` and follow its steps directly as the orchestrator. Do NOT attempt to call them via `runSubagent` with a skill name — it will fail.

0. **Explore** (ALWAYS first — before any other skill)
   - Split into **2–3 parallel targeted calls** — never one large "get everything" call
     - Call A: component files specific to the feature (HTML, SCSS, TS)
     - Call B: reference/comparison files (e.g., billing page, dashboard)
     - Call C: global styles / shared components (only if needed)
   - Ask for **structured summaries with key code snippets** — not full raw file dumps
     - Request: exact HTML markup for title areas, class names, key SCSS rules
     - Avoid: "return full file contents, no truncation" — causes overflow → re-read chains
   - **Pass the structured context report into every subsequent skill prompt**
   - This eliminates duplicate file reads across all downstream skills

1. **planner** (always first for new work)
   - Determine affected repos (UI / API / Mobile)
   - Create parent User Story with full description
   - Create one child Task per affected repo, link to parent
   - Pull latest main and create branch per repo using **child Task ID**
   - Return the parent ID and the map of child Task IDs per repo

2. **designer** (only if redesigning or genuinely new UI)
   - Create design specs
   - Implement SCSS and HTML templates only — never `.ts` files

3. **engineer** (for backend + frontend)
   - Receives the Explore context report — does NOT re-explore
   - Implements API endpoints, Angular components, unit tests
   - Works in focused passes for large features (backend first, then frontend)
   - Commits must follow the `jobflow-git-workflow` skill format exactly: `type(scope): [AB#<child-task-id>] short 5 word description` — AB# wrapped in `[]`, placed BEFORE the description, with a multi-line body
   - Use the repo's own child Task ID (UI child ID in JobFlow-UI, API child ID in JobFlow-API)

4. **mobile** (if mobile parity needed)
   - Implement Flutter screens
   - Match web functionality
   - Commits must follow the `jobflow-git-workflow` skill format: `type(scope): [AB#<mobile-child-task-id>] short 5 word description`

5. **code-review** (two-phase)
   - **Phase 1 (autonomous)**: Review, fix issues, then run its full validation workflow without skipping any step:
     - Frontend: `ng.cmd build --configuration production` → `npm.cmd run lint` → tests
     - Backend: `dotnet build` → `dotnet format --verify-no-changes` → tests
   - Do NOT pass a subset of commands — let code-review execute all steps above in order
   - **Phase 2 (gated)**: Pause, show summary of all changes, ask user for commit approval
   - Only commits and pushes after explicit user confirmation
   - After pushing, create a PR per repo following the PR Title and Body format in the `jobflow-git-workflow` skill
   - After push, capture commit SHAs per repo and pass them to closer

6. **closer** (always last after pushes complete)
   - Verify each commit includes `AB#<child-id>` or add ArtifactLink manually
   - Close each child Task with completion notes
   - If all children closed, transition parent User Story to `Resolved`

### 4. Monitor & Coordinate
- Track progress across skills
- Handle blockers or failures
- Ensure consistency between skills
- Report final status to user
