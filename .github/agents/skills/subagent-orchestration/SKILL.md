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

### Skip broad upfront Explore
The Engineer does its own targeted reads efficiently. Only invoke `@Explore` for:
- Post-implementation git status verification
- Searches the Engineer cannot easily do inline (cross-repo, cross-workspace)

**Avoid:** calling `@Explore` first "just to gather context" — it often returns large file-reference artifacts that can't be passed to other agents inline.

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

### Model cost tier awareness
When delegating to subagents, default to `Claude Sonnet 4.6 (copilot)` — attempting to use higher-tier models (e.g., Claude Opus 4.7) from a lower-tier parent will fail with a cost-tier error.

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
