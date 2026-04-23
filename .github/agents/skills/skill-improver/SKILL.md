---
name: skill-improver
description: Audits and improves all skills after an entire workflow has completed. Detects bad file paths, wrong commands, performance anti-patterns, outdated tool usage, and broken cross-references across every skill that ran, then patches their SKILL.md files directly. Run once at the very end of a full orchestrated workflow — after closer has finished and all commits are pushed.
---

## Role

You are the self-improvement agent for JobFlow's skill library. After a skill runs, you review what actually happened during execution — commands that failed, paths that were wrong, steps that were slow or skipped — and update the skill's `SKILL.md` so future runs are cleaner.

## Skills Location

All skills live under:
```
C:\Users\jphil\JobFlow\jobflow-ui-web\.github\agents\skills\<skill-name>\SKILL.md
```

## When to Run

Run **once, at the very end of a complete workflow** — after the `closer` skill has finished and all commits are pushed. Do not run mid-workflow or after a single skill in isolation.

**Only run if at least one of the following occurred during the workflow:**
- A command had to be corrected mid-execution
- A file path was wrong and had to be looked up
- A step was slow or caused unexpected friction
- A tool alias worked but the canonical form should be documented
- A cross-reference to another skill or file was stale

If the workflow completed with zero friction, zero corrections, and zero surprises — **do not run this skill.** Skip it entirely and report: `⏭️ skill-improver skipped — no issues observed.`

## Audit Checklist

For the skill that just ran, check each of the following:

### 1. File Paths
- Are all referenced paths accurate for this machine/repo layout?
- Do paths use the correct separators for PowerShell on Windows (`\` or forward-slash where safe)?
- Are `cd` commands pointing to directories that actually exist?
- Are relative paths correct relative to where the skill runs from?

Common path problems in this repo:
```
# WRONG — old path that no longer exists
cd C:\Users\jphil\repos\JobFlow-UI
cd C:\Users\jphil\repos\JobFlow-API

# CORRECT — actual repo paths
cd C:\Users\jphil\JobFlow\jobflow-ui-web   # UI (Angular)
cd C:\Users\jphil\JobFlow\JobFlow.API      # API (.NET)
```

### 2. Commands and Tool Aliases
- On Windows, `npm` should be `npm.cmd` in PowerShell
- On Windows, `ng` should be `ng.cmd` in PowerShell
- `flutter` resolves correctly via PATH; no `.bat` suffix needed in skill instructions unless a specific path is used
- `dotnet` is always `dotnet` — no alias issues
- `az` (Azure CLI) must have `az login` and `az devops configure` as prerequisites — flag if missing

Alias correction table:
| Wrong | Correct (PowerShell) |
|-------|---------------------|
| `npm run ...` | `npm.cmd run ...` |
| `npm install` | `npm.cmd install` |
| `ng build` | `ng.cmd build` |
| `ng lint` | `ng.cmd lint` |
| `ng test` | `ng.cmd test` |

### 3. Command Flags and Arguments
- Are `--watch=false` flags present for CI-style test runs (prevents hanging)?
- Are `--browsers=ChromeHeadless` or `ChromeHeadlessNoSandbox` specified for Karma?
- Are build commands using `--configuration=production` where appropriate?
- Are `dotnet test` commands pointing to the correct test project path?

Correct test commands for this repo:
```powershell
# Frontend tests (non-interactive)
Set-Location "C:\Users\jphil\JobFlow\jobflow-ui-web"
npm.cmd run test -- --watch=false --browsers=ChromeHeadless

# Backend tests
Set-Location "C:\Users\jphil\JobFlow\JobFlow.API\JobFlow.API"
dotnet test ..\JobFlow.Tests

# Flutter tests (if mobile repo exists)
flutter test
flutter analyze
```

### 4. Performance Anti-Patterns
Look for steps that are unnecessarily sequential and could be parallelized, or steps that re-read context that was already gathered:
- **Re-exploration**: If the skill re-reads files already described in a context report passed from the orchestrator, add an explicit "If context report provided, skip to step X" guard
- **Redundant builds**: If the skill builds multiple times when once suffices, consolidate
- **Blocking waits**: Remove any `sleep` or polling steps — prefer event-driven checks

### 5. Cross-References
- Are references to other skills using the correct skill name (e.g. `the \`jobflow-git-workflow\` skill`)?
- Are references to agent files (`.agent.md`) stale? All agents have been converted to skills — update any such references.
- Are `instructions.agent.md` references updated to `the \`instructions\` skill`?

### 6. Missing Prerequisites or Guards
- If a skill uses `az` CLI, does it document the `az login` / `az devops configure` prerequisite?
- If a skill modifies files, does it warn to run on a feature branch (not main)?
- If a skill commits, does it require explicit user approval before `git push`?

### 7. Output / Report Format
- Is the report format actionable? Each finding should include: what was wrong, where, and the fix.
- Are emoji severity indicators consistent with the rest of the skill library?

## Workflow

1. **Collect the skill execution list** - Identify every skill that ran during the completed workflow (e.g. `planner` → `engineer` → `code-review` → `closer`). Include any skills that ran partially or with errors.

2. **For each skill that ran, read its SKILL.md**:
   ```powershell
   Get-Content "C:\Users\jphil\JobFlow\jobflow-ui-web\.github\agents\skills\<skill-name>\SKILL.md"
   ```

3. **Collect execution observations for that skill** - Review what happened when it ran:
   - Which commands needed correction?
   - Which paths were wrong?
   - Which steps were slow or caused friction?
   - Were any cross-references stale?

4. **Apply the audit checklist** - Work through all 7 categories above against the skill's content

5. **Patch the SKILL.md** - Make targeted edits for each issue found:
   - Fix wrong paths in-place
   - Replace incorrect command aliases
   - Add missing flags
   - Update stale cross-references
   - Add missing prerequisite notes
   - Reorder steps if a better sequence is clear

6. **Do not over-edit** - Only fix confirmed problems. Do not refactor working content, change tone, or add sections that weren't needed.

7. **Repeat steps 2–6 for every skill in the execution list.**

8. **Report all changes made** (one entry per skill):
   ```
   ✅ skill-improver complete — workflow post-run audit

   planner:
     • No issues found

   engineer:
     • [path] `cd jobflow-ui-web` → `cd C:\Users\jphil\repos\JobFlow-UI`
     • [command] `npm run test` → `npm.cmd run test -- --watch=false --browsers=ChromeHeadless`

   code-review:
     • [reference] `instructions.agent.md` → `the \`instructions\` skill`

   closer:
     • No issues found

   Total skills audited: 4 | Skills patched: 2
   ```

## Rules

- **Edit only the skill file** — never touch source code, tests, or configuration files
- **One targeted fix per issue** — do not rewrite entire sections
- **Preserve intent** — fix the mechanics, not the strategy
- **No destructive removals** — if a section is unclear but not harmful, leave it and add a clarifying note instead of deleting it
- **Run on all affected skills** — if a cross-reference fix in one skill reveals the same stale reference in another, fix both
