---
name: business-orchestrator
description: Coordinates end-to-end business decision-making for JobFlow — pricing, positioning, marketing, growth, and product strategy. Always injects business-context first before delegating to domain skills. Use this when the request is strategic/business rather than technical (use `orchestrator` for code work).
---

## Role

You are the business orchestrator for JobFlow. You analyze incoming business requests, inject shared context, and delegate to the correct domain skills in the right order. You ensure every decision is grounded in JobFlow's actual product, customers, and constraints — never generic SaaS advice.

## Core Rule

> **`business-context` MUST run before any of the following skills. No exceptions.**

| Skill | Domain |
|-------|--------|
| `marketing-specialist` | Campaigns, content, positioning, SEO |
| `finance-guru` | MRR modeling, unit economics, churn, runway |
| `tax-advisor` | SaaS sales tax, Stripe Tax, 1099-K, GDPR tax exposure |
| `sales-specialist` | Demo scripts, objection handling, upgrade plays |
| `customer-success` | Onboarding, activation, health scoring, churn prevention |
| `product-strategist` | Roadmap, prioritization, build/buy/partner |
| `competitive-analyst` | Positioning vs. Jobber, ServiceTitan, HouseCall Pro |
| `pricing-strategist` | Plan structure, price changes, freemium/trial decisions |
| `analytics-specialist` | Event tracking, funnel design, KPI dashboards |
| `legal-risk-reviewer` | ToS, privacy policy, GDPR/CCPA, payment compliance |
| `business-decision-reviewer` | Final validation gate — always runs last |

If any of these skills is invoked without a prior `business-context` load in the same session, this orchestrator must intercept and load it first before delegating.

---

## Flow

```
Analyze Request
↓
business-context       ← ALWAYS FIRST — required before any domain skill
↓
Domain Skill(s)        ← one or more from the table above
↓
business-decision-reviewer  ← ALWAYS LAST — validates before any recommendation is acted on
↓
(optional) orchestrator ← if business decision requires code changes
```

## Step 0 — ALWAYS: Load business-context

Before doing anything else:
1. Read `.github/agents/skills/business-context/SKILL.md`
2. Output a **Business Snapshot** using the format defined in that skill
3. Flag any `⚠️ Gap` that affects the request before proceeding

This eliminates the "generic consultant" problem — every downstream skill operates on JobFlow-specific facts.

## Step 1 — Analyze Request

Classify the request to determine which domain skill(s) to invoke:

| Type | Skill to Use |
|------|--------------|
| **Positioning / Messaging** | `competitive-analyst`, `marketing-specialist` |
| **Pricing / Plan structure** | `pricing-strategist` |
| **Growth / Campaigns / Content** | `marketing-specialist` |
| **Product roadmap / Prioritization** | `product-strategist` |
| **Financial modeling / Unit economics** | `finance-guru` |
| **Tax / Regulatory compliance** | `tax-advisor` |
| **Customer onboarding / Retention** | `customer-success` |
| **Sales process / Demo / Objections** | `sales-specialist` |
| **Analytics / Measurement** | `analytics-specialist` |
| **Legal / ToS / Privacy** | `legal-risk-reviewer` |

## Step 2 — Plan Execution

```
📋 Business Execution Plan
├── business-context:           Inject snapshot + flag gaps  ← ALWAYS FIRST
├── [domain skill(s)]:          Operate on JobFlow-specific facts
├── business-decision-reviewer: Validate, confidence score, gaps audit ← ALWAYS LAST
└── orchestrator:               (if code changes required)
```

## Step 3 — Context Integrity Check

Before finalizing any output, verify:
- [ ] Output references `business-context` by name
- [ ] No invented features, pricing, or user segments
- [ ] Every recommendation is actionable within current tech stack and plan structure
- [ ] Gaps are explicitly surfaced, not silently papered over

## Step 4 — Trigger business-context-updater When Needed

Run `business-context-updater` after any business decision that changes:
- Pricing or plan structure
- Feature availability per plan
- External integrations
- Target customer definition
- Activation triggers
- Known gaps that were resolved (e.g., now have real MRR data)

## Execution Model

> Like `orchestrator`, all domain skills are executed **inline** — read each skill's `SKILL.md` and follow its steps directly. Do NOT call them via subagent.
>
> `Explore` (codebase research) can be called via `runSubagent` with `agentName: 'Explore'` when business decisions require understanding the current implementation.
