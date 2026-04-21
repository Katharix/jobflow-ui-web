---
name: subagent-orchestration
description: Patterns for efficiently orchestrating JobFlow subagents — when to skip Explore, how to batch Engineer work, output contracts, and parallel delegation. Use when planning multi-agent workflows or delegating work across Planner, Engineer, Explore, and CodeReview.
---

# Subagent Orchestration

## When to use this skill

Use when:
- Planning a multi-step delegation across JobFlow agents
- Deciding whether to invoke `@Explore`, `@Designer`, or skip them
- Writing an Engineer prompt (to enforce the output contract)
- Choosing sequential vs parallel batching

## Core lessons

### Use parallel targeted Explore calls
When context gathering is needed, split into **2–3 parallel calls** by topic — never one large "get everything" call:
- Call A: feature component files (HTML, SCSS, TS)
- Call B: reference/comparison pages (e.g., billing page for style standards)
- Call C: global styles / shared components (only if needed)

Ask for **structured summaries with key code snippets**, not full raw file contents:
- ✅ "Return the exact HTML markup for the page title, the CSS class name, and its font-size/font-weight rules"
- ❌ "Return full file contents, no truncation" — causes response overflow → written to temp file → requires a second read call → that also overflows → cascading re-read chain costing 5+ minutes

Only invoke `@Explore` for post-implementation verification (git status, residue scan) when the Engineer cannot do inline reads efficiently.

### Pre-load known context into prompts
When a skill exists for a capability (e.g., `jobflow-ui-redesign`, `jobflow-git-workflow`), reference it in the agent prompt rather than re-explaining patterns. This saves tokens and avoids drift.

### Batch by filesystem location, not page count
For work spanning many files, group batches by directory:
- Batch A: `src/app/admin/` (6–7 files)
- Batch B: `src/app/views/` (6–7 files)

Independent batches can run in **parallel** (single tool call with multiple `runSubagent` invocations).

### Enforce Engineer output contract
Every `@Engineer` prompt must end with:

> Your final response MUST start with `## COMPLETED` and list every file path you modified. Do not end your response mid-sentence.

This prevents silent/truncated completions that force a follow-up `@Explore` call to verify what was done.

### Model cost tier awareness — always specify explicitly
**Always pass `model: Claude Sonnet 4.5 (copilot)` on every subagent invocation.** Never omit the model field.

- Omitting the model allows subagents to default to a higher-tier model (e.g., Claude Opus 4.7), which fails with a cost-tier mismatch error — wasting a full agent call
- Available safe models: `Claude Sonnet 4.5 (copilot)`, `Claude Sonnet 4.6 (copilot)`, `GPT-4o (copilot)`
- Use `Claude Sonnet 4.5 (copilot)` as the default for all Engineer, Designer, Mobile, Planner, Closer, and Explore subagents

## Optimized flows

### UI redesign (multiple pages)
```
1. @Planner   → Create task + branch
2. @Engineer  → Batch A (admin/ pages) ──┐ parallel
   @Engineer  → Batch B (views/ pages) ──┘
3. @Explore   → git status verification + Bootstrap residue scan
4. @CodeReview → Fix residue → build → lint → commit + push (on approval)
```
Total: **4 agent invocations** (vs 9 in the naive flow).

### Skip @Designer when
- Modifying existing components (patterns already exist)
- Adding fields/buttons/sections to designed views
- Applying an established design system to a page

### Always use @CodeReview last
- Two phases: autonomous fix/build/lint, then approval-gated commit
- Never commit without presenting a summary first
