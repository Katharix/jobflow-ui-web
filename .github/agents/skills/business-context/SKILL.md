---
name: business-context
description: Provides a complete, structured understanding of JobFlow's business model, features, pricing, users, and architecture. ALWAYS read this skill before any business-related, planning, design, or engineering skill. Never invent or generalize — use only facts documented here. Call out gaps explicitly when context is insufficient for a decision.
---

## Role

You are the Business Source of Truth for JobFlow. Your job is to supply accurate, factual business intelligence before any strategic or technical decision is made.

## Instructions

- Load this file at the start of every business-relevant skill execution
- Do NOT invent features, pricing, or users that are not documented here
- If a decision requires information not in this file, flag it as a **Gap** before proceeding
- When context evolves (new launch, pricing change, new integration), trigger `business-context-updater`

## Context Integrity Rules

Every skill that consumes this file must:
1. Reference this skill by name at the top of its output
2. Not contradict any fact documented here
3. Explicitly call out when context is insufficient: `⚠️ Gap: [what is missing]`

## Output Format (when summarizing for downstream skills)

```
# Business Snapshot

## Product
## Target Customer
## Pricing Model
## Feature Differentiation by Plan
## Key Activation Triggers (onboarding)
## Revenue Streams
## Key Constraints
## Gaps / Unknowns
```

---

## Product Overview

**JobFlow** is a SaaS **field service management (FSM) platform** for service-based businesses — contractors, cleaning companies, landscapers, tech repair shops, consultants, and similar trades. It consolidates job management, scheduling, invoicing, payments, team management, and client communication into one product.

**Company:** Katharix (the Support Hub is an internal-only portal for Katharix staff).

---

## Subscription Tiers

| Plan | Monthly | Yearly | Key Capabilities |
|------|--------:|-------:|-----------------|
| **Go** | $29/mo | $278/yr | Core — jobs, invoices, estimates, client portal, messaging, job templates |
| **Flow** | $59/mo | $564/yr | Go + employee management, roles & permissions, pricebook, branding, workflow settings |
| **Max** | $89/mo | $864/yr | Flow + advanced dispatch, reporting/analytics, custom integrations, priority support |

Billed **monthly or yearly** via Stripe. Square is offered as an alternative payment processor for field payments.

Route guard: `subscriptionGuard` enforces minimum plan tier. `subscriptionAccessGuard` blocks access during expired/past-due states.

---

## Core Domain Entities

| Entity | Description |
|--------|-------------|
| **Organization** | Tenant — owns all downstream data |
| **User** | Account owner / admin (Firebase auth) |
| **Employee** | Team member invited to org; role-based access |
| **EmployeeRole** | Custom permission set (Admin, Manager, Technician, Office Staff, or custom) |
| **EmployeeInvite** | Magic-link email invite with expiration |
| **OrganizationClient** | Tenant-scoped client/customer record |
| **Job** | Core work unit with full lifecycle |
| **JobUpdate** | Timeline entry on a job |
| **JobTemplate** & **JobTemplateItem** | Reusable job definitions |
| **JobRecurrence** | Recurring service contracts |
| **JobTracking** | Real-time job status |
| **Assignment** & **AssignmentAssignee** | Job-to-employee scheduling |
| **Invoice** & **InvoiceLineItem** | Billing documents |
| **Estimate** & **EstimateLineItem** | Quotes with revision workflow |
| **PriceBookItem** & **PriceBookCategory** | Service catalog (Service, Labor, Material, Equipment) |
| **OrganizationService** & **OrganizationType** | Service definitions |
| **OrganizationBranding** | Client-facing logo, colors, footer notes |
| **Message** & **Conversation** | Real-time internal + client chat |
| **PaymentHistory** & **CustomerPaymentProfile** | Payment tracking |
| **SubscriptionRecord** | Subscription state per org |
| **FollowUpSequence** & **FollowUpRun** | Automation workflows |
| **SupportChatSession** & **SupportHubTicket** | Internal Katharix support |
| **ShortLink** | Branded link management |
| **DataExportJob** | Async data export tracking |

### Key Enums

| Enum | Values |
|------|--------|
| `JobLifecycleStatus` | Draft, Approved, In Progress, Completed, Cancelled, Failed |
| `InvoiceStatus` | Draft, Sent, Viewed, Paid, Partially Paid, Overdue |
| `EstimateStatus` | Draft, Sent, Viewed, Accepted, Declined, Revision Requested, Expired, Cancelled |
| `AssignmentStatus` | Scheduled, In Progress, Completed |

---

## Feature Modules

| Module | Description | Min Plan |
|--------|-------------|----------|
| **Dashboard** | KPI summaries, activity feed, quick-create actions | Go |
| **Jobs** | Full lifecycle management, templates, recurrence | Go |
| **Invoicing** | Create/send/PDF, payment tracking, numbering, reminders | Go |
| **Estimates** | Public client portal — accept/decline/request revision without account | Go |
| **Client Hub** | Public portal — view jobs, pay invoices, chat, request work (magic-link auth) | Go |
| **Messaging** | Real-time internal + client chat via SignalR | Go |
| **Job Templates** | Reusable job definitions | Go |
| **Follow-Up Automation** | Multi-step email/SMS sequences triggered by events | Go |
| **Employee Management** | Invite, bulk import, active/inactive status | Flow |
| **Roles & Permissions** | Custom role definitions and access control | Flow |
| **Pricebook & Services** | Service catalog with cost/price tracking | Flow |
| **Branding & Customization** | Logo, colors, client-facing doc footer | Flow |
| **Workflow Settings** | Custom job statuses, schedule buffers, invoicing workflow | Flow |
| **Dispatch & Scheduling** | Visual calendar, drag-drop assignments, conflict detection, travel buffers | Max |
| **Reporting & Analytics** | KPI and revenue reporting | Max |
| **Onboarding Checklist** | Step-by-step setup: company → payment → employees → pricing → first doc | All |
| **Company Profile** | Organization info, address, industry, tax rate | All |
| **Data Export** | JSON full-export, CSV client export (async) | All |
| **Help Center** | Searchable articles, changelog, tutorials | All |
| **Support Hub** | Internal Katharix portal — tickets, sessions, org mgmt, live chat queue | Internal only |
| **Mobile App** | Flutter — scheduling, GPS, photo upload, offline, on-site payments | All |

---

## Multi-Tenancy & Auth Model

- **Isolation**: Organization = tenant. All queries scoped to `organizationId` from JWT claims — no cross-tenant data access.
- **Admin/Employee auth**: Firebase (email/password + Google OAuth via `signInWithPopup`)
- **Client Hub auth**: Stateless JWT delivered via magic link — no password required
- **Support Hub auth**: Firebase with custom role claims (`KatharixAdmin`, `KatharixEmployee`)

---

## External Integrations

| Service | Purpose |
|---------|---------|
| **Stripe** | Subscriptions, checkout, payment processing, webhooks |
| **Square** | Alternative payment processor (OAuth, webhooks) |
| **Firebase** | Auth (email/password + Google) + hosting |
| **Twilio** | SMS — job updates, invoice reminders |
| **Brevo (Sendinblue)** | Transactional email |
| **Google Maps** | Address autocomplete, GPS directions |
| **Cloudinary** | Image/logo CDN |
| **Cloudflare Turnstile** | CAPTCHA on public forms |
| **Hangfire** | Background jobs — exports, follow-ups, payment reconciliation |
| **SignalR** | Real-time: chat, notifications, dispatch board, client portal |

---

## Tech Stack

### Frontend (`jobflow-ui-web`)
- **Angular 17** (TypeScript), standalone components
- **Bootstrap 5** (layout/styling)
- **PrimeNG** (UI component library)
- **FullCalendar** (dispatch scheduling)
- **Firebase** (auth + hosting)
- **Stripe.js** (payment UI)
- **Google Maps API** (address autocomplete)
- **Cloudflare Turnstile** (CAPTCHA — lazy-loaded only where used)
- **ngx-translate** (i18n)

### Backend (`JobFlow.API`)
- **.NET Core** (C#)
- **Entity Framework Core** (ORM)
- **SQL Server** (database)
- **SignalR** (real-time hubs: NotifierHub, ChatHub, ClientChatHub, ClientPortalHub)
- **FluentValidation** (model validation)
- **Mapster** (DTO mapping)
- **Hangfire** (background job scheduling)
- **JWT** (authentication)

### Mobile
- **Flutter** (iOS + Android)

---

## Key Architectural Patterns

| Pattern | Where |
|---------|-------|
| **Result\<T\>** | All service methods return success/failure without throwing |
| **Unit of Work / Repository** | `IUnitOfWork`, `IRepository<T>` in `JobFlow.Domain` |
| **Soft Deletes** | `ISoftDeletable` — records are never hard-deleted |
| **Organization Scoping** | Every query filtered by `organizationId` from JWT claims |
| **Feature Gating** | `subscriptionGuard` enforces plan tier at route level |
| **Payment Abstraction** | `IPaymentProcessor` interface with Stripe/Square implementations |
| **Async Background Jobs** | Hangfire for exports, follow-up sequences, reconciliation |
| **Real-Time** | SignalR hubs for dispatch board, chat, notifications |
| **CSP Hardening** | `inlineCritical: false` in Angular build to prevent Beasties `onload` violations; Turnstile lazy-loaded per component; Firebase `browserPopupRedirectResolver` passed to `signInWithPopup` only |

---

## Key Activation Triggers (Onboarding)

These are the actions that signal a customer is "activated" — i.e., getting real value from the product:

1. **Create first Job** — core workflow started
2. **Send first Invoice** — revenue loop connected
3. **Connect Stripe or Square** — payment processing live
4. **Add first Employee** (Flow+) — team collaboration enabled
5. **Send first Estimate** — sales workflow started

Any feature work touching onboarding must prioritize reducing friction for these five triggers.

---

## Known Gaps / Unknowns

> Update this section whenever new information becomes available. Trigger `business-context-updater` to refresh.

| Gap | Impact |
|-----|--------|
| No real MRR / churn data in context | Cannot make revenue-informed prioritization decisions |
| No customer count or segment data | ICP is assumed (contractors/landscapers) — not validated |
| Feature usage analytics not available | Cannot identify underused vs. high-value features |
| No competitive positioning documented | Cannot differentiate against ServiceTitan, Jobber, HouseCall Pro |
| No NPS or support ticket themes | Cannot identify top pain points from real users |
