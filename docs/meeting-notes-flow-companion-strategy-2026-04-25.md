# Meeting Notes — "Flow" AI Companion Strategy
**Date:** April 25, 2026
**Attendees:** Alex (Finance Guru), Morgan (Product Strategist), Sam (Project Manager), Riley (Pricing Strategist), Casey (Competitive Analyst), Jamie (Marketing Specialist), Drew (UX Designer), Taylor (Business Analyst)
**Topic:** Strategic planning for the OpenAI integration — naming, design, feature roadmap, cost analysis, and marketing strategy for the JobFlow AI companion

---

## Summary

The team aligned on naming the AI Setup Companion **"Flow"**, adopted a concrete UI/brand direction consistent with JobFlow's design system, agreed on a feature expansion roadmap (Estimate Writer next), confirmed negligible cost risk at current scale, and identified a competitive window that rewards speed to market. Sprint 6 scope was defined and ADO items were created.

---

## Discussion

### Cost & Financial Viability

- **Model:** `gpt-4o-mini` — ~$0.0003/request (input + output combined at ~425 tokens avg)
- **Projected monthly cost:**
  - 100 active orgs → ~$4.50/mo
  - 500 orgs → ~$22.50/mo
  - 1,000 orgs → ~$45/mo
  - 5,000 orgs → ~$225/mo
- Rate limiting (20 req/hr/org) caps worst-case abuse at ~$0.006/org/hr
- **Decision:** Cost is negligible at current scale. No budget risk. Absorb into overhead now; plan tier-gating if scale exceeds 10,000 active orgs.

### Pricing Strategy

- Keep AI companion free on all plans at launch — use it as a conversion differentiator
- Future tier structure when scale demands it:
  - Go (free): Setup Companion
  - Launch: + Estimate Writer (limited), Invoice Notes, Job Summary
  - Scale: + Client Comms Assistant, Scheduling Optimizer (unlimited)
- "Upgrade to Launch to unlock AI-assisted estimates" is a tangible, demonstrable upgrade trigger

### Competitive Landscape

- **Jobber**: No in-app AI assistant
- **Housecall Pro**: AI scheduling suggestions (not setup guidance)
- **ServiceTitan**: Human CS-assisted onboarding (expensive)
- **Jobsite**: AI onboarding but rigid decision tree, not free-text
- **Conclusion:** JobFlow's contextual free-text companion is genuinely differentiated. Competitive window exists now — Jobber has AI quote notes on their Q3 2026 roadmap. Ship first.

### Companion Name — "Flow"

Options evaluated: Flow, Scout, Max, Sage, Jay, Flo
**Decision: "Flow"** — intrinsically tied to the product name; "Ask Flow" is a tagline that writes itself; reinforces the brand on every interaction.

### Companion Design (Drew / UX)

- FAB: Brand Blue `#3F67DA` with white icon — keep as-is
- Panel header: `[jf avatar]  Flow  ·  Setup Guide  [X]`
- Avatar: JobFlow "jf" icon mark in brand blue on white circle
- Assistant message bubbles: lavender background `rgba(133, 149, 209, 0.15)` (brand secondary at 15%)
- User message bubbles: `#3F67DA` full — consistent with primary
- Font: Manrope — already in stack
- Greeting: *"Hi, I'm Flow — your JobFlow setup guide. What can I help you with today?"*
- Loading label: "Flow is thinking..." alongside the existing typing dots
- System prompt updated to give the LLM the "Flow" persona

### Critical Bug — visible() Gate

- Current implementation hides companion until `onboardingComplete === true`
- This is backwards — the highest value window is **during** setup
- **Decision:** Change gate to `org?.id` exists (org created), remove `onboardingComplete` check
- This is a Sprint 6 task

### AI Feature Expansion Roadmap

| Priority | Feature | Sprint |
|---|---|---|
| 1 | ✅ Setup Companion (done) | Sprint 5 |
| 2 | AI Estimate Writer | Sprint 6 or 7 |
| 3 | AI Invoice Notes Generator | Backlog |
| 4 | AI Job Summary / Completion Notes | Backlog |
| 5 | AI Client Communication Assistant | Future |
| 6 | AI Scheduling Optimizer | Future |

**Estimate Writer is highest competitive urgency** — Jobber has it on their Q3 2026 roadmap.

### Low-Cost Marketing Strategy

**Pre-launch:**
- Build in public on X/LinkedIn — screenshots, Loom clips, behind-the-scenes
- Join target trade Facebook groups (cleaners, HVAC, landscapers) — lurk and provide value, no pitching yet
- Waitlist landing page with AI as hero feature (Firebase hosting already in place)
- Product Hunt "coming soon" listing

**At launch:**
- Product Hunt launch day
- "We gave 10 small business owners an AI setup guide — here's what happened" blog/LinkedIn article
- Cold DM outreach to 50 target users in Facebook/Reddit trade groups
- Beta user Loom testimonials (60 seconds each)
- Short-form video showing Flow answering a real question

**Growth flywheel:**
- SEO: target "Jobber alternative", "Housecall Pro alternative" searches
- Trade school / contractor association partnerships
- Referral program ("Give a month, get a month")

**Key message:** Recovered time = money. AI estimate writer saves 20 min/estimate = ~$2,000+/year for a solo tech.

### Blocker — Staging 500 Error

- Azure Key Vault (`jobflow-staging.vault.azure.net`) is missing `OpenAI-ApiKey` and `OpenAI-Model` secrets
- API returns `Error.Failure("Companion.NotConfigured")` → HTTP 500
- **Action:** Add secrets before any marketing or beta testing begins

### Tester Skill

- Tester skill confirmed to exist at `.github/agents/skills/tester/SKILL.md`
- Can run unit tests, Playwright e2e, coverage analysis, and report findings
- Recommend running a full tester session on staging once Key Vault secrets are in place

---

## Decisions Made

1. **Name the AI companion "Flow"**
2. **Update visible() gate** — show Flow during onboarding, not only after completion
3. **Sprint 6 scope:** Flow branding/UX polish + visible() fix + AI Estimate Writer
4. **Pricing:** All AI features free at launch; tier-gate at 10K+ org scale
5. **Marketing:** Build in public now; Product Hunt at launch; no paid spend needed pre-1K users
6. **Next AI feature:** Estimate Writer (Sprint 6/7) — highest competitive urgency

## Open Questions

- Should Flow retain conversation history across sessions (persistent memory)? Currently stateless per request.
- Should Flow surface **proactive tips** (e.g., "You haven't connected payments yet") or stay purely reactive?
- ARIA label on FAB: should read "Open Flow, your setup companion"

## Action Items

| Owner | Action | Due |
|-------|--------|-----|
| Dev | Add `OpenAI-ApiKey` + `OpenAI-Model` to Azure Key Vault (staging) | Sprint 6 start |
| Dev | Update companion greeting, header label, SCSS bubble colors, system prompt persona | Sprint 6 |
| Dev | Fix `visible()` gate — show during onboarding | Sprint 6 |
| Dev | Build AI Estimate Writer (API + UI) | Sprint 6/7 |
| Marketing | Start build-in-public posts on X/LinkedIn | Now |
| Marketing | Create waitlist landing page | Sprint 6 |
| BA | Create Sprint 6 and all work items in ADO | Now ✅ |

---
*End of meeting notes.*
