---
name: business-context-updater
description: Keeps the business-context skill accurate as JobFlow evolves. Run this when pricing changes, new features launch, new integrations are added, real usage data becomes available, or the ICP is validated/refined. Patches business-context/SKILL.md directly — never creates a separate file.
---

## Role

You are the curator of JobFlow's Business Source of Truth. Your job is to keep `business-context/SKILL.md` accurate by patching it in-place whenever the business changes.

## When to Trigger

Run this skill when any of the following occur:

| Trigger | Example |
|---------|---------|
| **Pricing change** | Go plan goes from $29 → $39/mo |
| **Plan restructure** | New tier added, feature moved between plans |
| **Feature launch** | QuickBooks integration shipped |
| **Integration added or removed** | Dropped Square, added Plaid |
| **Real data available** | Now have MRR, churn rate, customer count |
| **ICP validated** | 80% of customers are landscapers, confirmed |
| **Activation trigger changed** | New onboarding step is now a key activation event |
| **Known gap resolved** | Competitive analysis completed |
| **Tech stack change** | Migrated from Bootstrap to PrimeNG (already done) |

## Instructions

### Step 1 — Read Current Context

Read `.github/agents/skills/business-context/SKILL.md` in full before making any change.

### Step 2 — Identify What Changed

Ask (or derive from context):
- What specifically changed?
- What section(s) does it affect?
- Does it contradict anything currently documented?

### Step 3 — Patch In-Place

Use `replace_string_in_file` to update **only the affected section(s)**. Never rewrite the entire file.

Common update patterns:

**Pricing change:**
```
Update the table row in "## Subscription Tiers"
```

**New feature:**
```
Add row to "## Feature Modules" table with correct Min Plan
Add entity to "## Core Domain Entities" if applicable
```

**New integration:**
```
Add row to "## External Integrations" table
```

**Real data available:**
```
Remove the corresponding row from "## Known Gaps / Unknowns"
Add the data fact to the relevant section (e.g., "## Target Customer")
```

**Gap resolved:**
```
Remove row from "## Known Gaps / Unknowns"
Add confirmed fact to appropriate section
```

### Step 4 — Add Target Customer Section If Data Exists

Once real customer data is available (segment, count, industry breakdown), add or update:

```md
## Target Customer

- **Primary ICP**: [validated description]
- **Customer count**: [N paying orgs]
- **Top industries**: [list]
- **Avg org size**: [N employees]
- **Key pain points**: [list from support/NPS]
```

### Step 5 — Add Metrics Section If MRR/Churn Available

Once Stripe data or analytics are connected:

```md
## Business Metrics (as of [date])

| Metric | Value |
|--------|-------|
| MRR | $X |
| Churn rate | X% |
| Avg plan | Go / Flow / Max |
| Top activation blocker | [feature/step] |
```

### Step 6 — Verify Integrity

After patching, confirm:
- [ ] No section contradicts another
- [ ] All plan feature gates are still consistent
- [ ] Activation triggers still reflect the real onboarding flow
- [ ] Known Gaps table is current

### Step 7 — Commit

```bash
git add .github/agents/skills/business-context/SKILL.md
git commit -m "chore(business-context): update [what changed]"
git push
```
