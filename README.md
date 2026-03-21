# JobFlow User Guide

A role-based guide to how JobFlow works, what each area does, and the terms used across the app. JobFlow is built for multi-service industries (contractors, designers, tech repair, consultants, and similar teams) and keeps workflows simple and consistent across web and mobile.

## Who This Is For

- Owners and admins who configure the business and manage billing.
- Staff and technicians who deliver work and update clients.
- Clients who view job progress and approvals in the Client Hub.

## How JobFlow Works (At A Glance)

JobFlow centers around a few core objects:

- Clients own Jobs.
- Jobs are assigned to Staff (Assignments).
- Updates, invoices, and approvals appear on the Job Timeline.
- Clients see their updates and approvals in the Client Hub.

This creates one shared source of truth for the team and the client.

## Core Concepts And Terms

- Organization: Your business account in JobFlow.
- Workspace: The shared area where your team manages all jobs and clients.
- Client: A customer record that owns jobs, invoices, and communications.
- Job: The unit of work you schedule, track, and deliver.
- Assignment: A job plus the staff member(s) responsible for it.
- Status: The current state of a job (for example: Scheduled, In progress, Completed).
- Update: A note, status change, or photo shared with the client.
- Timeline: A chronological view that combines updates, invoices, approvals, and key events.
- Client Hub: The client-facing portal for viewing jobs, updates, and approvals.
- Subscription plan: Your billing tier that unlocks features and limits.
- Approval: A client-confirmed decision or sign-off in the timeline.
- Attachment: A file (often a photo) linked to an update or invoice.

## Quick Tour By Area

### Dashboard

- Snapshot of active work, recent activity, and key counts.
- The Command Center provides shortcuts for common admin tasks.
- Use it as the daily launch point for prioritizing jobs and triage.

### Clients

- Store client profiles, contact methods, and related jobs.
- Review a client history with jobs, updates, and invoices in one place.
- Share Client Hub links when you want clients to self-serve.

### Jobs

- Create, schedule, and assign jobs to staff.
- Track job status, progress, and client communications.
- Use the timeline to keep updates, approvals, and invoices aligned.

### Billing And Payments

- Create invoices and track payment status.
- Manage payment profiles and subscriptions.
- Some billing features require specific subscription tiers.

### Client Hub

- Clients see job status and recent updates.
- Timelines show updates, invoices, and approvals in one place.
- Clients can review approvals where enabled.

### Mobile App

- Designed for field teams and on-site updates.
- Send quick notes, photos, and status updates to clients.
- Offline updates are queued and synced when back online.

## Setup And Onboarding (Deep Dive)

### 1) Create Your Organization

- Add business name, branding, and contact details.
- Confirm timezone and operating hours if applicable.

### 2) Configure Billing

- Choose a subscription plan that matches your team size and needs.
- Add billing details and set invoice preferences.
- Premium features are gated by the active subscription plan.

### 3) Add Users And Roles

- Invite admins and staff.
- Assign roles to control access to settings, billing, and data.

### 4) Build Your Client List

- Import clients or create them manually.
- Validate contact methods so updates and links land correctly.

### 5) Create Your First Job

- Define job scope, dates, and client context.
- Assign it to a staff member.
- Set an initial status to establish workflow visibility.

### 6) Enable The Client Hub

- Turn on the Client Hub so clients can view timelines and approvals.
- Share links from job detail pages or client profiles.

## Daily Workflows (Deep Dive)

### Admin And Owner Workflow

1. Review the Dashboard for current workload and activity.
2. Open any jobs needing attention or status updates.
3. Assign or reassign work based on availability.
4. Review timelines for pending approvals or client questions.
5. Send invoices and confirm payments.

### Staff And Technician Workflow

1. Open assigned jobs on mobile.
2. Post updates (notes, photos, status changes) as work progresses.
3. If offline, continue posting updates and sync later.
4. Close out jobs with a final status update.

### Client Workflow

1. Open the Client Hub link.
2. Review status and timeline entries.
3. Approve items where required.
4. Follow up if more information is needed.

## Job Lifecycle (End To End)

1. Job is created and assigned.
2. Staff completes work and posts updates.
3. Client reviews timeline and approvals.
4. Invoice is issued and payment is recorded.
5. Job is marked completed and archived in history.

## Updates And Timeline Strategy

- Use status updates for clear milestones.
- Use notes for client context and next steps.
- Use photos to document work and reduce ambiguity.
- Keep updates concise and consistent to reduce client questions.

## Client Hub Best Practices

- Share the link early, not just at the end of the job.
- Encourage clients to use approvals instead of email threads.
- Keep timeline entries clear and client-friendly.

## Permissions And Roles

- Admins can manage settings, users, billing, and data.
- Staff can access assigned jobs and post updates.
- Client access is limited to their own jobs and timeline items.

## Billing And Subscriptions

- Plans control feature access and usage limits.
- Premium features should be gated by the active subscription plan.
- Update your plan from the billing area when needed.

## Tips And Best Practices

- Keep job statuses updated to reflect real progress.
- Use updates often to reduce client questions.
- Share photos to document work and build trust.
- Assign clear owners to every job and follow up from the timeline.
- Keep client records up to date to avoid missed communications.

## Glossary

- Approval: A client-confirmed decision in the timeline.
- Attachment: A file (often a photo) linked to an update or invoice.
- Notification: A message sent to the team or client.
- Timeline Item: Any event shown in the job timeline (updates, invoices, approvals).

## Need Help

- Use the Help or Support links in the app for assistance.
- Contact your organization admin for access issues or permissions.

## Development Notes

This project was generated with [Angular CLI](https://github.com/angular/angular-cli) version 17.1.0.

### Development Server

Run `ng serve` for a dev server. Navigate to `http://localhost:4200/`. The application will automatically reload if you change any of the source files.

### Code Scaffolding

Run `ng generate component component-name` to generate a new component. You can also use `ng generate directive|pipe|service|class|guard|interface|enum|module`.

### Build

Run `ng build` to build the project. The build artifacts will be stored in the `dist/` directory.

### Running Unit Tests

Run `ng test` to execute the unit tests via [Karma](https://karma-runner.github.io).

### Running End-to-End Tests

Run `ng e2e` to execute the end-to-end tests via a platform of your choice. To use this command, you need to first add a package that implements end-to-end testing capabilities.

### Further Help

To get more help on the Angular CLI use `ng help` or go check out the [Angular CLI Overview and Command Reference](https://angular.io/cli) page.
