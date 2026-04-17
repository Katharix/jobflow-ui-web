# JobFlow — Complete Feature Guide

JobFlow is an all-in-one field service management platform built for multi-service industries including contractors, designers, tech repair shops, consultants, cleaning companies, landscapers, and more. It gives organizations the tools they need to manage jobs, schedule employees, invoice clients, accept payments, communicate across teams, and deliver a professional client experience — all from a single platform.

This document provides an in-depth look at every feature JobFlow offers, how to use it, and how it benefits your organization.

---

## Table of Contents

1. [Getting Started](#1-getting-started)
2. [Dashboard & Command Center](#2-dashboard--command-center)
3. [Jobs Management](#3-jobs-management)
4. [Dispatch & Scheduling](#4-dispatch--scheduling)
5. [Invoicing](#5-invoicing)
6. [Estimates](#6-estimates)
7. [Follow-Up Automation](#7-follow-up-automation)
8. [Customer Management](#8-customer-management)
9. [Employee Management](#9-employee-management)
10. [Employee Roles & Permissions](#10-employee-roles--permissions)
11. [Pricebook & Services](#11-pricebook--services)
12. [Messaging & Chat](#12-messaging--chat)
13. [Client Hub (Client Portal)](#13-client-hub-client-portal)
14. [Mobile App (Field Technician App)](#14-mobile-app-field-technician-app)
15. [Payments & Payment Processing](#15-payments--payment-processing)
16. [Subscription Plans & Billing](#16-subscription-plans--billing)
17. [Branding & Customization](#17-branding--customization)
18. [Settings & Configuration](#18-settings--configuration)
19. [Onboarding & Quick Start](#19-onboarding--quick-start)
20. [Help Center & Knowledge Base](#20-help-center--knowledge-base)
21. [Company Profile](#21-company-profile)
22. [Data Export](#22-data-export)
23. [Security & Compliance](#23-security--compliance)
24. [Real-Time Notifications](#24-real-time-notifications)
25. [Support Hub (Internal Admin Portal)](#25-support-hub-internal-admin-portal)

---

## 1. Getting Started

### Account Registration

To start using JobFlow, you create an account by providing your name, email, and password. During registration you also select your **organization type** (e.g., "Plumbing," "IT Services," "Cleaning," "General Contracting"), which tailors the platform's defaults to your industry.

Alternatively, you can sign in with **Google** for one-click authentication.

After registration, JobFlow creates your organization and drops you into the **onboarding checklist** to walk you through setup.

### How It Benefits Your Organization

- **Fast setup** — Go from signup to sending your first invoice in minutes.
- **Industry-aware defaults** — Selecting your industry type pre-configures terminology and workflows so the platform feels purpose-built for you.
- **Flexible auth** — Support for email/password and Google sign-in means your team can get started however they prefer.

---

## 2. Dashboard & Command Center

### Overview

The Dashboard is the first screen you see after logging in. It gives you a bird's-eye view of your entire operation through at-a-glance metrics, an activity feed, and quick-action shortcuts.

### Key Metrics Displayed

| Metric | What It Shows |
|--------|---------------|
| **30-Day Revenue** | Total revenue collected in the last 30 days |
| **Outstanding Balance** | Total unpaid amounts across all invoices |
| **Overdue Balance** | Invoices that have passed their due date |
| **Invoice Counts** | Breakdown of invoices by status (Paid, Sent, Overdue) |
| **Job Statuses** | Count of jobs in Draft, Open, In Progress, and Completed states |
| **Today's Assignments** | Number of assignments scheduled for today |
| **Assignments In Progress** | Currently active assignments across your team |
| **Completed Assignments** | Assignments finished today |
| **Estimate Metrics** | Accepted estimate value, revision requests pending |
| **Customer Count** | Total active clients in your organization |

### Command Center

The Command Center is an action hub embedded directly on the dashboard. It provides one-click shortcuts to the most common actions:

- Create a new job
- Send an invoice
- Create an estimate
- Add a new customer
- Add an employee

### Real-Time Activity Feed

The activity feed is a live, scrolling list of events happening across your organization:

- Estimate accepted, declined, or revision requested
- Invoice payments received
- Job status changes
- Client activity and engagement

### How It Benefits Your Organization

- **Instant visibility** — Know the health of your business the moment you log in. No digging through reports.
- **Action-oriented** — The Command Center removes friction between deciding what to do and doing it.
- **Real-time awareness** — The activity feed keeps you in the loop on critical events (payments, estimate responses) without checking each module individually.

---

## 3. Jobs Management

### Overview

Jobs are the backbone of JobFlow. A job represents a unit of work you perform for a client — anything from a one-time repair to a recurring maintenance contract.

### Creating a Job

1. Navigate to **Jobs** in the sidebar.
2. Click **Create Job**.
3. Fill in the job details:
   - **Title** — A name for the job (e.g., "Kitchen Remodel," "HVAC Tune-Up").
   - **Client** — Select an existing client or create a new one inline.
   - **Description** — Detailed notes about the work to be performed.
   - **Address** — The job site location.
   - **Invoicing Workflow** — Choose "Send Invoice" (email the client) or "In Person" (collect on-site).
4. Click **Save** to create the job in Draft status.

### Job Lifecycle

Jobs move through a defined lifecycle:

```
Draft → Approved → In Progress → Completed
                                → Cancelled
                                → Failed
```

- **Draft** — The job has been created but not confirmed.
- **Approved** — The job is confirmed and ready to be scheduled.
- **In Progress** — Work has begun on the job.
- **Completed** — The job has been successfully finished.
- **Cancelled** — The job was cancelled before completion.
- **Failed** — The job could not be completed.

You can customize these status labels and add your own statuses through **Workflow Settings** (Flow plan).

### Job Assignments

Once a job is approved, you can assign employees to it:

1. Open the job and go to the **Assignments** tab.
2. Click **Add Assignment**.
3. Select one or more employees.
4. Set the **schedule type** — either a time window (e.g., "between 9 AM and 12 PM") or an exact time.
5. Set the scheduled start and end date/time.

Assignments appear on the **Dispatch Board** and on each employee's schedule.

### Recurring Jobs

For ongoing service contracts (e.g., weekly lawn care, monthly HVAC maintenance), you can set up **recurrence rules**:

- **Frequency** — Weekly or Monthly.
- **Pattern** — Select specific days of the week or day of the month.
- **End Condition** — Never, on a specific date, or after a set number of occurrences.

JobFlow automatically generates future assignments from recurrence rules so you don't have to manually create each one.

### Job Templates

Save time by creating **Job Templates** (Go plan and above):

1. Set up a job with all its standard details (title, description, line items, assignment defaults).
2. Click **Save as Template**.
3. When creating future jobs, select **Use Template** and pick from your library.

Templates are especially useful for businesses that perform the same types of work repeatedly.

### Job Schedule View

The **Job Schedule** provides a calendar view of all scheduled jobs, letting you see at a glance what's happening on any given day, week, or month.

### Searching & Filtering

The jobs list supports:

- **Full-text search** — Find jobs by title, client name, or description.
- **Status filter** — Show only jobs in a specific lifecycle state.
- **Date range filter** — See jobs scheduled within a specific timeframe.
- **Sorting** — Sort by date, status, client, or title.
- **Cursor-based pagination** — Efficient loading even with thousands of jobs.

### How It Benefits Your Organization

- **End-to-end tracking** — Follow every job from creation to completion, never losing track of work.
- **Recurring automation** — Set it and forget it for routine service contracts. No more manually creating the same job every week.
- **Reusable templates** — Standardize your service delivery and reduce data entry for common job types.
- **Scheduling visibility** — A calendar view tied to employee assignments prevents double-booking and scheduling conflicts.

---

## 4. Dispatch & Scheduling

### Overview

The Dispatch Board is a visual, calendar-based scheduling tool that lets you see all employee assignments at a glance and manage your field team's schedule.

### Using the Dispatch Board

1. Navigate to **Dispatch** in the sidebar.
2. You'll see a calendar view (powered by FullCalendar) with employee rows.
3. **Unscheduled jobs** appear in a sidebar panel. Drag them onto an employee's row to create an assignment.
4. Existing assignments show as colored blocks on the calendar.

### Key Capabilities

- **Visual scheduling** — See who is working where and when at a glance.
- **Conflict detection** — JobFlow automatically detects when two assignments overlap for the same employee and alerts you.
- **Travel time buffer** — Configure a travel buffer (e.g., 30 minutes between jobs) so your team has realistic transition time. The system enforces this automatically.
- **Drag-and-drop** — Reschedule assignments by dragging them to a new time slot or different employee.
- **Unscheduled queue** — Jobs that are approved but not yet assigned live in a queue so nothing falls through the cracks.

### Schedule Settings

Under **Settings → Schedule**, you can configure:

- **Travel buffer duration** — Minimum gap between consecutive assignments for the same employee.
- **Default scheduling window** — The default time window for new assignments.
- **Auto-notify** — Automatically notify clients when their job is scheduled or rescheduled.

### How It Benefits Your Organization

- **Optimize field efficiency** — Visual scheduling with conflict detection and travel buffers helps you route your team effectively.
- **Reduce miscommunication** — When the schedule is centralized and visible to everyone, there's no confusion about who goes where.
- **Never drop a job** — The unscheduled queue ensures every approved job gets assigned.

---

## 5. Invoicing

### Overview

JobFlow's invoicing module lets you create, send, and track invoices. It integrates directly with Stripe and Square so your clients can pay online.

### Creating an Invoice

1. Navigate to **Invoices** in the sidebar.
2. Click **Create Invoice**.
3. Select a **client** (or pick from a job).
4. Add **line items**:
   - Free-form line items with a description, quantity, and unit price.
   - Or import items directly from your **Pricebook** for consistent pricing.
5. Set the **due date**.
6. Review the total, tax, and any notes.
7. Click **Save** (keeps it in Draft) or **Send** (emails the invoice to the client).

### Invoice from a Job

When a job is completed, you can generate an invoice directly from the job. The job's details, line items, and client information are pre-populated, saving you from re-entering data.

### Invoice Lifecycle

```
Draft → Sent → Viewed → Paid
                      → Partially Paid
                      → Overdue
```

- **Draft** — Not yet sent to the client.
- **Sent** — Emailed to the client.
- **Viewed** — The client has opened the invoice link.
- **Paid** — Payment received in full.
- **Partially Paid** — Partial payment received.
- **Overdue** — Past the due date without full payment.

### Sending & Reminders

- **Send Invoice** — Emails the invoice to the client with a link to view and pay online.
- **Send Reminder** — Sends a follow-up email for unpaid invoices.
- Both actions are available as one-click operations from the invoice list.

### PDF Generation

Every invoice can be downloaded as a professionally formatted **PDF**. The PDF includes your organization's branding (logo, colors, tagline) if configured. PDFs can be shared manually or are automatically included in email notifications.

### Invoice Numbering

JobFlow automatically generates sequential invoice numbers per organization (e.g., INV-001, INV-002) to keep your accounting organized.

### How It Benefits Your Organization

- **Fast invoicing** — Create and send invoices in under a minute. Generate them directly from completed jobs for zero re-entry.
- **Professional appearance** — Branded PDFs make your business look polished.
- **Get paid faster** — Online payment links and automated reminders reduce the time between sending and receiving payment.
- **Clear status tracking** — Always know which invoices are paid, pending, or overdue.

---

## 6. Estimates

### Overview

Estimates let you send prospective clients a quote before work begins. Clients can view the estimate online, accept it, decline it, or request revisions — all without needing a JobFlow account.

### Creating an Estimate

1. Navigate to **Estimates** in the sidebar.
2. Click **Create Estimate**.
3. Select a **client**.
4. Add **line items** — either free-form or from your Pricebook.
5. Set an **expiration date** after which the estimate is no longer valid.
6. Add any notes or special terms.
7. Click **Save** or **Send**.

### Estimate Lifecycle

```
Draft → Sent → Viewed → Accepted → (Converted to Job/Invoice)
                      → Declined
                      → Revision Requested
                      → Expired
                      → Cancelled
```

### Client Interaction

When you send an estimate, the client receives an email with a unique link. Using that link, the client can:

- **View** the full estimate with line items and totals.
- **Accept** the estimate, which triggers a notification to your organization.
- **Decline** the estimate, with an optional reason.
- **Request a Revision** — The client can describe what they'd like changed, and you receive a notification to update the estimate.

All of this happens without the client needing to create an account.

### Public PDF Download

Clients can download a branded PDF of the estimate from the public estimate view page.

### How It Benefits Your Organization

- **Win more work** — Professional, branded estimates make a strong first impression.
- **Streamlined approval** — Clients can accept with one click, reducing back-and-forth emails.
- **Revision workflow** — When a client requests changes, you get a structured notification instead of a vague email, so you can respond precisely.
- **Track conversion** — See which estimates are accepted, declined, or expired to understand your win rate.

---

## 7. Follow-Up Automation

### Overview

Follow-Up Automation lets you create multi-step email and SMS sequences that automatically follow up with clients on estimates and invoices. Instead of manually remembering to check in, JobFlow handles it for you.

### How It Works

1. Navigate to **Follow-Up Automation** (accessible from the Estimates or Invoices sections).
2. Create a **Follow-Up Sequence** with:
   - **Trigger** — When the sequence starts (e.g., after an estimate is sent, after an invoice becomes overdue).
   - **Steps** — A series of timed actions:
     - **Delay** — Wait a specified number of days.
     - **Channel** — Send via email, SMS, or both.
     - **Message Template** — The content of the follow-up.
3. Activate the sequence.

### Sequence Example

| Step | Delay | Channel | Action |
|------|-------|---------|--------|
| 1 | 2 days after estimate sent | Email | "Just checking in — did you get a chance to review the estimate?" |
| 2 | 5 days after Step 1 | SMS | "Hi [Client], we'd love to help. Let us know if you have questions about the estimate." |
| 3 | 7 days after Step 2 | Email | "Last follow-up — the estimate expires in 3 days." |

### Automatic Stop Conditions

Sequences automatically stop when:

- The client **replies** (via chat or email).
- The estimate is **accepted** or **declined**.
- The invoice is **paid**.
- You **manually stop** the sequence.
- The **maximum number of steps** is reached.

### Execution Tracking

You can view the status of every automation run:

- Which step it's currently on.
- Whether it completed, was stopped, or is still running.
- A log of every email and SMS that was sent.

### How It Benefits Your Organization

- **Never forget to follow up** — Automation ensures every lead and unpaid invoice gets timely attention.
- **Increase conversion rates** — Consistent follow-up is one of the most effective ways to turn estimates into jobs.
- **Save hours per week** — Eliminate manual reminder tracking and email drafting.
- **Multi-channel reach** — Reach clients where they respond best — email, SMS, or both.

---

## 8. Customer Management

### Overview

The Customers module is your client database. It stores contact information for every person or business you do work for, and ties clients to their jobs, invoices, estimates, and communication history.

### Managing Clients

1. Navigate to **Clients** in the sidebar.
2. Click **Add Client**.
3. Enter client details:
   - **Name** (first and last, or business name)
   - **Email**
   - **Phone number**
   - **Address** (street, city, state, zip)
4. Save the client.

### Capabilities

- **Search** — Find clients by name or email instantly.
- **Edit/Delete** — Update contact information or remove clients.
- **Restore** — Soft-deleted clients can be restored if removed by mistake.
- **Bulk Import** — Import clients from a CSV file for quick onboarding if you're migrating from another system.
- **Client History** — From a client's profile, view their associated jobs, invoices, and estimates.

### How It Benefits Your Organization

- **Centralized client data** — One place for all client information, accessible to your entire team.
- **Faster operations** — When creating a job or invoice, pull the client from your database instead of re-entering details.
- **Easy migration** — CSV import means you can bring your existing client list into JobFlow without manual entry.

---

## 9. Employee Management

### Overview

The Employees module lets you add your team members, assign them roles, and manage their access to the platform. Employees can be assigned to jobs, appear on the dispatch board, and communicate via the messaging system.

### Adding Employees

1. Navigate to **Employees** (Flow plan required).
2. Click **Add Employee**.
3. Enter employee information:
   - **Name**
   - **Email**
   - **Phone number**
   - **Role** — Select from your custom roles or pre-built presets.
4. Save the employee record.

### Employee Invitations

After adding an employee, you can **send an invitation** via email. The invite contains a one-click link that lets the employee:

1. Accept the invitation.
2. Create their account (or link an existing one).
3. Set their password.

Invitations include:

- **Expiration** — Invites expire after a set period for security.
- **Revoke** — Cancel a pending invite if needed.
- **Resend** — Re-send the invitation email.

### Bulk Import

For larger teams, you can **import employees from a CSV file**:

1. Click **Import** on the Employees page.
2. Upload a CSV with columns for name, email, phone, role, etc.
3. Preview the import to validate data.
4. Confirm to create all employee records at once.

### Active/Inactive Status

Mark employees as active or inactive. Inactive employees are hidden from the dispatch board and assignment forms but their historical data is preserved.

### How It Benefits Your Organization

- **Centralized team management** — Everyone's information and access is managed from one place.
- **Controlled access** — Role-based permissions mean each team member only sees what they need.
- **Frictionless onboarding** — Email invitations with one-click acceptance get new hires into the system quickly.
- **Bulk operations** — Import your entire team at once when setting up or growing.

---

## 10. Employee Roles & Permissions

### Overview

Custom Employee Roles let you define exactly what each team member can access within JobFlow. This ensures sensitive data (like financials) is restricted while operational data (like job details) is broadly available.

### Creating Roles

1. Navigate to **Employees → Roles** (Flow plan required).
2. Click **Create Role**.
3. Name the role (e.g., "Field Technician," "Office Manager," "Apprentice").
4. Configure permissions for each module.
5. Save the role.

### Role Presets

JobFlow includes pre-built **role presets** for common positions:

- **Admin** — Full access to all features.
- **Manager** — Access to jobs, invoices, employees, and scheduling.
- **Technician** — Access to assigned jobs and messaging.
- **Office Staff** — Access to clients, invoicing, and estimates.

You can use presets as-is or as starting points for custom roles.

### How It Benefits Your Organization

- **Least-privilege access** — Give each team member only the access they need, reducing the risk of accidental data exposure or modification.
- **Quick setup** — Role presets get you operational immediately; customize later as your needs evolve.
- **Scalable** — As your team grows and specializes, roles ensure everyone stays in their lane without micro-management.

---

## 11. Pricebook & Services

### Overview

The Pricebook is your master catalog of products, services, labor rates, and materials. Items from the Pricebook can be pulled into invoices and estimates to ensure consistent, accurate pricing across your organization.

### Setting Up the Pricebook

1. Navigate to **Pricebook** (Flow plan required).
2. Create **categories** to organize your items (e.g., "Plumbing Services," "Parts," "Labor").
3. Within each category, add **items**:
   - **Name** (e.g., "Faucet Installation")
   - **Description**
   - **Item Type** — Service, Labor, Material, or Equipment
   - **Cost** — Your internal cost (for margin tracking)
   - **Price** — What you charge the client
   - **Unit** — How it's measured (per hour, flat rate, per unit, etc.)

### Organization Services

In addition to the Pricebook, you can define your **Organization Services** — a high-level list of the types of work you perform. These appear on your public-facing pages and help clients understand what you offer.

### Using Pricebook Items

When creating an **invoice** or **estimate**, you can:

1. Click **Add from Pricebook**.
2. Browse or search items.
3. Select items to add as line items.
4. Adjust quantity as needed — pricing is automatically applied.

### How It Benefits Your Organization

- **Consistent pricing** — Every team member quotes and invoices at the same rates.
- **Margin visibility** — Track your cost vs. price to understand profit margins on every item.
- **Faster document creation** — Pull items from the Pricebook instead of typing pricing from memory.
- **Organized catalog** — Categories keep your offerings structured as your service list grows.

---

## 12. Messaging & Chat

### Overview

JobFlow includes a built-in, real-time messaging system powered by SignalR. Team members can chat with each other, and businesses can communicate with clients — all within the platform.

### Internal Messaging (Employee-to-Employee)

1. Navigate to **Messaging** in the sidebar.
2. Select a conversation or start a new one.
3. Type and send messages in real time.

Features include:

- **Real-time delivery** — Messages appear instantly via WebSocket connections.
- **Typing indicators** — See when someone is typing.
- **Read receipts** — Know when your message has been read.
- **Conversation history** — Full message history is preserved.

### Client Messaging (via Client Hub)

Clients can send messages through the **Client Hub** portal. These messages appear in your messaging inbox alongside internal conversations, so you have a single place to manage all communication.

### SMS Integration

JobFlow integrates with **Twilio** for SMS messaging:

- **Outbound SMS** — Send text messages to clients who prefer SMS over email.
- **Inbound SMS** — Client replies to SMS are routed back into the JobFlow conversation, maintaining a unified thread.
- **SMS delivery status** — Track whether messages were delivered.

### How It Benefits Your Organization

- **Centralized communication** — Stop juggling between email, text, and phone calls. All client and team communication lives in one place.
- **Real-time coordination** — Typing indicators and instant delivery mean your team stays aligned without delays.
- **Client flexibility** — Clients can reach you through their preferred channel (portal chat or SMS).

---

## 13. Client Hub (Client Portal)

### Overview

The Client Hub is a self-service portal for your clients. It lets them view their jobs, estimates, and invoices, make payments, communicate with your team, and request new work — all without needing a JobFlow account.

### How Clients Access It

Clients receive a **magic link** via email. Clicking the link authenticates them into their personalized portal — no password needed. Magic links expire for security and can be re-sent at any time.

### Client Hub Features

#### Dashboard / Overview
A summary view showing the client's active jobs, pending invoices, and recent estimates.

#### Estimates
- View all estimates sent by your organization.
- Open an estimate to see full details and line items.
- **Accept** an estimate with one click.
- **Decline** an estimate with an optional reason.
- **Request a Revision** — Describe what you'd like changed, and the organization is notified.

#### Invoices
- View all invoices with their status (Sent, Overdue, Paid, etc.).
- Open an invoice to see line items and totals.
- **Pay online** — Click "Pay Now" to be taken to a secure Stripe or Square checkout.

#### Jobs
- View all active and completed jobs.
- See the **job timeline** — a chronological feed of status updates, notes, and photos posted by the field team.

#### Chat
- Send messages directly to the service provider.
- Real-time delivery powered by SignalR.

#### Request New Work
- Submit a request for new work directly from the portal.
- Describe what's needed, attach files or photos, and submit.

#### Profile
- View and update their contact information.

### How It Benefits Your Organization

- **Professional client experience** — A branded, self-service portal makes your business look modern and established.
- **Frictionless payments** — One-click online payment from the portal reduces payment delays.
- **Reduced support load** — Clients can check job status, view invoices, and download documents without calling your office.
- **Client engagement** — Real-time chat and work requests keep clients connected to your business.

---

## 14. Mobile App (Field Technician App)

### Overview

The JobFlow Mobile App is a Flutter-based application for field technicians and employees. It provides everything a technician needs on-site: their schedule, job details, navigation, live tracking, photo documentation, messaging, and payment collection.

### Login

Employees sign in with their email and password (Firebase authentication). Upon login, the app loads their profile and assignment schedule.

### Jobs Tab

The Jobs tab shows the employee's upcoming assignments for the current week:

- **Job cards** display the job title, client name, address, scheduled time, and current status.
- Tap a job to open the **Job Detail Screen**.

### Job Detail Screen

This is the central hub for managing a specific assignment on-site:

#### Status Actions
- **Start Job** — Marks the assignment as "In Progress" and records the actual start time.
- **Complete Job** — Marks it as "Completed" and records the finish time.

#### Live GPS Tracking
- **Send ETA** — Sends a one-time location update to the client with your estimated arrival.
- **Toggle Live Tracking** — Turns on continuous GPS tracking (updates every 2 minutes) so the client and office can see your real-time location.

#### Navigation
- **Open Directions** — Launches Google Maps with turn-by-turn directions to the job site.

#### Photo Documentation
- **Capture Photo** — Take a photo with the device camera to document before/during/after work.
- **Upload from Gallery** — Attach an existing photo.
- Photos are attached to **Job Updates** and visible in the Client Hub timeline.

#### Job Updates Feed
- View the most recent updates for the job (status changes, notes, photos).
- See count of queued offline updates awaiting sync.

### Route / Map Tab

The Route tab displays a **Google Maps** view with:

- Your current location.
- Route to the next assignment's address.
- **Start Navigation** button to launch full turn-by-turn directions.
- **Send ETA** for manual arrival time updates.

### Messages Tab

A fully functional messaging interface:

- **Conversation list** — See all conversations with unread counts.
- **Message thread** — View the full chat history, send messages.
- Messages sync with the web platform in real time.

### Payments Tab

Accept payments on-site:

1. Enter the product/job name (pre-filled from the active assignment).
2. Enter the amount.
3. Tap **Take Payment** to generate a Stripe checkout session.
4. The checkout opens in a browser for the client to complete payment.

### Offline Support

The mobile app includes **offline queuing** for job updates:

- If you lose internet connectivity, notes, status changes, and photos are saved locally.
- When connectivity returns, queued updates are automatically flushed to the server.
- This ensures no data is lost in the field, even in areas with poor coverage.

### How It Benefits Your Organization

- **Empower your field team** — Technicians have everything they need on their phone: schedule, directions, communication, and payment collection.
- **Real-time job tracking** — GPS tracking and ETA updates keep the office and client informed of technician location and progress.
- **Photo documentation** — Before/after photos protect against disputes and demonstrate quality work.
- **On-site payments** — Collect payment immediately after completing work, improving cash flow.
- **Offline reliability** — Field work often happens in areas with poor connectivity. Offline queuing ensures nothing is lost.

---

## 15. Payments & Payment Processing

### Overview

JobFlow integrates with **Stripe** and **Square** for secure payment processing. You can accept payments through invoices, the Client Hub, on-site via the mobile app, or through direct checkout links.

### Connecting a Payment Provider

During onboarding (or in Settings), you connect your **Stripe** or **Square** account:

- **Stripe Connect** — JobFlow uses Stripe's Connected Accounts model. You link your existing Stripe account (or create one) and payments flow directly to you.
- **Square OAuth** — Connect your Square account via OAuth for seamless integration.

### Payment Methods

| Method | Description |
|--------|-------------|
| **Invoice Payment** | Client receives an invoice via email, clicks "Pay Now," and completes checkout via Stripe or Square. |
| **Client Hub Payment** | Client pays directly from their Client Hub portal invoice view. |
| **On-Site Payment** | Field technician generates a checkout session via the mobile app; client pays on their phone. |
| **In-Person** | For jobs using the "In Person" invoicing workflow, payment is recorded manually. |

### Payment History & Financial Summary

Under **Billing & Payments**, you can view:

- **Payment history** — Every payment received, with date, amount, invoice reference, and payment method.
- **Financial summary** — Revenue metrics, outstanding balances, and collection trends.
- **Refunds** — Issue full or partial refunds directly through the platform. Refunded amounts are reflected in your financial summary.

### How It Benefits Your Organization

- **Get paid faster** — Online payment links reduce friction. Clients pay in seconds instead of mailing checks.
- **Payment flexibility** — Support for multiple payment methods (Stripe, Square) and multiple collection points (email, portal, on-site).
- **Clear financial picture** — Payment history and financial summaries give you instant visibility into your cash flow.
- **Secure processing** — All payments are handled by PCI-compliant providers (Stripe/Square). JobFlow never stores card data.

---

## 16. Subscription Plans & Billing

### Overview

JobFlow offers three subscription tiers that unlock progressively more powerful features. Every subscription includes the core platform; higher tiers add team management, customization, and advanced automation.

### Plans

| Feature | Go | Flow | Max |
|---------|:--:|:----:|:---:|
| Dashboard & Analytics | ✓ | ✓ | ✓ |
| Jobs Management | ✓ | ✓ | ✓ |
| Invoicing | ✓ | ✓ | ✓ |
| Estimates | ✓ | ✓ | ✓ |
| Customer Management | ✓ | ✓ | ✓ |
| Client Hub (Portal) | ✓ | ✓ | ✓ |
| Messaging & Chat | ✓ | ✓ | ✓ |
| Job Templates | ✓ | ✓ | ✓ |
| User Profile Editing | ✓ | ✓ | ✓ |
| Quick Start Onboarding | ✓ | ✓ | ✓ |
| Employee Management | | ✓ | ✓ |
| Employee Roles & Permissions | | ✓ | ✓ |
| Pricebook & Services | | ✓ | ✓ |
| Branding & Customization | | ✓ | ✓ |
| Workflow Settings | | ✓ | ✓ |
| Advanced Dispatch | | | ✓ |
| Custom Integrations | | | ✓ |
| Priority Support | | | ✓ |

### Managing Your Subscription

1. Navigate to **Subscription Management** (accessible from the sidebar or account menu).
2. View your current plan and billing cycle.
3. **Upgrade/Downgrade** — Switch plans at any time. Changes are prorated.
4. **Cancel** — Cancel your subscription. Your data is preserved and you can resubscribe later.

### Billing & Payment History

Under **Billing & Payments**, view:

- Invoice history for your JobFlow subscription.
- Payment method on file.
- Upcoming renewal date and amount.

### Subscription Access Control

If your subscription lapses (unpaid, past due, or cancelled), JobFlow restricts access to admin features while preserving your data. You'll see a **Subscription Required** page that prompts you to resubscribe. Core account access (company info, help center) remains available.

### How It Benefits Your Organization

- **Start small, scale up** — Begin with the Go plan and upgrade as your team and needs grow.
- **No long-term lock-in** — Monthly and yearly billing with the flexibility to change or cancel anytime.
- **Pay only for what you need** — Solo operators save money on the Go plan; growing teams get team management on Flow.

---

## 17. Branding & Customization

### Overview

Make JobFlow yours. The Branding module (Flow plan) lets you customize the look and feel of your client-facing documents and portal.

### Customization Options

- **Logo** — Upload your company logo. It's stored on Cloudinary for fast, reliable delivery.
- **Primary Color** — Set your brand's primary color. It's applied to buttons, links, and accents across the Client Hub and documents.
- **Secondary Color** — A complementary color used for secondary elements.
- **Business Name & Tagline** — Displayed on the Client Hub header and document headers.
- **Footer Note** — A custom message that appears at the bottom of invoices and estimates (e.g., "Thank you for your business!").

### Live Preview

As you adjust branding settings, a **live preview** shows how your invoices and estimates will look with the new branding applied.

### Where Branding Appears

- **Client Hub** — Header, colors, and logo throughout the portal.
- **Invoices** — Logo, colors, business name on PDF and online view.
- **Estimates** — Same as invoices.
- **Email Notifications** — Branded headers in emails sent to clients.

### How It Benefits Your Organization

- **Professional image** — Branded documents and portals make your business look established and trustworthy.
- **Brand consistency** — Every touchpoint with your client carries your brand, reinforcing recognition.
- **Client confidence** — A professional-looking portal and documents signal that you take your business seriously.

---

## 18. Settings & Configuration

### Overview

JobFlow provides granular settings so you can tailor the platform to how your business operates.

### Workflow Settings (Flow plan)

Customize the job lifecycle to match your business processes:

- **Custom Job Statuses** — Add statuses beyond the defaults (e.g., "Waiting for Parts," "Inspection Required").
- **Status Labels** — Rename default statuses to match your terminology.

### Schedule Settings

- **Travel Buffer** — Set the minimum time between consecutive assignments for the same employee (e.g., 30 minutes for travel).
- **Default Window** — The default time range for new assignments.
- **Auto-Notify** — Automatically notify clients when their job is scheduled or rescheduled.

### Invoicing Settings

- **Default Workflow** — Choose whether new jobs default to "Send Invoice" (email) or "In Person" (on-site collection).
- **Invoice Sequence** — Configure the numbering format for invoices.

### How It Benefits Your Organization

- **Fit the tool to your process** — Not the other way around. Custom statuses and workflows mean JobFlow adapts to you.
- **Realistic scheduling** — Travel buffers prevent back-to-back scheduling that's physically impossible.
- **Automatic client communication** — Auto-notify settings keep clients informed without manual effort.

---

## 19. Onboarding & Quick Start

### Overview

When you first sign up, JobFlow guides you through an interactive **Onboarding Checklist** to get your account fully set up.

### Checklist Steps

1. **Company Setup** — Enter your organization's name, contact info, and industry.
2. **Connect Payment Provider** — Link your Stripe or Square account to start accepting payments.
3. **Add Employees** — Add your first team members (or skip if you're solo).
4. **Set Up Pricing** — Create your first Pricebook categories and items.
5. **Send Your First Estimate or Invoice** — Walk through creating your first client-facing document.

### Quick Start (Go plan)

The **Quick Start** feature lets you apply pre-configured settings and sample data to your account so you can explore the platform immediately:

- Pre-built job statuses.
- Sample Pricebook items.
- Default schedule settings.

### Dashboard Integration

If your onboarding isn't complete, the checklist appears on your Dashboard, showing which steps are done and which remain. You can complete steps in any order and skip optional ones.

### How It Benefits Your Organization

- **Guided setup** — Never wonder what to do next. Each step has instructions and a clear action.
- **Faster time-to-value** — Quick Start gets you operational in minutes, not hours.
- **Flexible completion** — Complete steps in any order, skip what doesn't apply, and come back to it later.

---

## 20. Help Center & Knowledge Base

### Overview

The in-app Help Center provides searchable articles, guides, and FAQs organized by topic. It also includes a product changelog so you can stay up to date on new features.

### Features

- **Searchable Articles** — Type a keyword and find relevant guides instantly.
- **Categories** — Articles are organized by topic:
  - Getting Started
  - Jobs
  - Invoicing
  - Estimates
  - Clients
  - Employees
  - Dispatch
  - Messaging
  - Billing
  - Branding
  - Subscription
  - Settings
- **Article Types** — Guides, video tutorials, and FAQs.
- **Featured Articles** — Highlighted articles for common questions.
- **Changelog** — A timeline of product updates categorized as Features, Bug Fixes, and Improvements.
- **Contact Support** — Submit a contact request directly from the Help Center for issues the articles don't cover.

### How It Benefits Your Organization

- **Self-service support** — Find answers without waiting for a support response.
- **Always current** — Articles are updated as the platform evolves.
- **Changelog transparency** — Know exactly what's new, what's fixed, and what's improved.

---

## 21. Company Profile

### Overview

The Company Profile is where you manage your organization's core information. This data is used across the platform — on invoices, estimates, the Client Hub, and email communications.

### What You Can Configure

- **Organization Name** — Your business's legal or trade name.
- **Contact Person** — The primary point of contact.
- **Email** — Your business email address.
- **Phone Number** — Your business phone.
- **Address** — Your business address (street, city, state, zip).
- **Industry / Business Type** — The type of work you do (e.g., Plumbing, IT Services).
- **Tax Rate** — Your default tax rate, applied to invoices and estimates.

This area remains accessible even if your subscription has lapsed so you can always update your business details.

### How It Benefits Your Organization

- **Single source of truth** — Update your business info once, and it's reflected everywhere: invoices, estimates, emails, and the Client Hub.
- **Tax accuracy** — Setting a default tax rate ensures every invoice and estimate is tax-correct without manual calculation.

---

## 22. Data Export

### Overview

JobFlow provides data export capabilities so you can get your data out of the platform whenever you need it.

### Export Options

- **JSON Export** — Export your entire organization's data as a structured JSON bundle. This includes jobs, clients, invoices, estimates, employees, and more.
- **CSV Export (Clients)** — Export your client list as a CSV file for use in spreadsheets or other tools.
- **Long-Running Exports** — For large datasets, data export jobs run in the background (via Hangfire). You're notified when the export is ready for download.

### How It Benefits Your Organization

- **Data ownership** — Your data is always accessible. Export it anytime for accounting, reporting, or migration.
- **Integration flexibility** — CSV and JSON exports make it easy to pull data into other tools (accounting software, CRMs, spreadsheets).
- **No lock-in** — Even if you decide to leave JobFlow, you can take all your data with you.

---

## 23. Security & Compliance

### Overview

JobFlow is built with enterprise-grade security practices to protect your data and your clients' data.

### Authentication

- **Firebase Authentication** — Industry-standard authentication for employees and admins, supporting email/password and Google OAuth.
- **Client Portal JWT** — A separate authentication scheme for client portal sessions using magic links. No passwords for clients to manage or forget.
- **Multi-Scheme Authorization** — Admin users and client portal users are authenticated through separate JWT paths, ensuring complete isolation.

### Authorization & Access Control

- **Role-Based Access** — Employees are assigned roles with specific permissions (Admin, Manager, Technician, Office Staff, or custom roles).
- **Subscription Gating** — Features are gated by subscription plan, preventing unauthorized access.
- **Organization Isolation** — Every query is scoped to the authenticated user's organization. There's no cross-tenant data leakage.

### Rate Limiting

JobFlow enforces rate limits to protect against abuse:

| Policy | Limit | Scope |
|--------|-------|-------|
| Default | 200 requests/min | Per user |
| Payment Operations | 40 requests/min | Per user |
| Webhooks | 80 requests/min | Per IP |

### Audit Logging

Every significant action is logged to an **audit trail**, including:

- Who performed the action.
- What action was taken.
- When it occurred.
- The request details.

### Security Alerts

The system tracks and logs security events, such as suspicious login patterns or authorization failures.

### CAPTCHA Protection

Public-facing forms (contact, newsletter signup) are protected by **Cloudflare Turnstile** to prevent bot abuse.

### Payment Security

- All payment processing is handled by **PCI-compliant** providers (Stripe and Square).
- JobFlow never stores credit card numbers or sensitive payment data.
- Payment tokens and connected account credentials are encrypted at rest.

### How It Benefits Your Organization

- **Client trust** — Enterprise-grade security means your clients' data is protected.
- **Regulatory readiness** — Audit logging and data export support compliance with data retention and privacy requirements.
- **Abuse protection** — Rate limiting and CAPTCHA prevent malicious use of your account and APIs.

---

## 24. Real-Time Notifications

### Overview

JobFlow uses **SignalR** (WebSocket) hubs to deliver real-time notifications across the platform. Events are pushed to users the moment they happen — no page refresh needed.

### Notification Channels

| Hub | Purpose |
|-----|---------|
| **NotifierHub** | Dashboard notifications — new payments, estimate responses, job status changes |
| **ChatHub** | Real-time chat delivery for employee conversations |
| **ClientChatHub** | Real-time chat delivery for client portal conversations |
| **ClientPortalHub** | Client portal live updates — invoice status changes, job timeline updates |

### Email & SMS Notifications

In addition to in-app real-time notifications, JobFlow sends transactional notifications via:

- **Email** (via Brevo/Sendinblue):
  - Welcome emails for new organizations
  - Invoice sent, payment received, payment failed
  - Estimate sent, accepted, declined, revision requested
  - Employee invitations
  - Client portal magic links
  - Job scheduling and rescheduling notifications

- **SMS** (via Twilio):
  - Job ETA updates
  - Arrival notifications
  - Invoice reminders
  - Estimate follow-ups

### How It Benefits Your Organization

- **Instant awareness** — Know the moment a client accepts an estimate, pays an invoice, or messages you.
- **Client engagement** — Clients receive timely notifications about their jobs and invoices, keeping them engaged and informed.
- **Multi-channel delivery** — Between in-app, email, and SMS, notifications reach the right person through the right channel.

---

## 25. Support Hub (Internal Admin Portal)

### Overview

The Support Hub is an internal administration portal used by the JobFlow platform team to manage organizations, handle support requests, and monitor platform health. It requires **KatharixAdmin** or **KatharixEmployee** authorization.

### Capabilities

- **Dashboard** — Platform-wide metrics and health monitoring.
- **Tickets** — Support ticket management for customer issues.
- **Sessions** — View and manage customer support sessions.
- **Organizations** — Browse, search, and manage all organizations on the platform.
- **People** — User management across the platform.
- **Billing** — Platform-level billing and subscription management.
- **Content** — Manage help articles and changelog entries.
- **Settings** — Platform configuration.
- **Team Management** — Invite and manage support team members.

> *Note: The Support Hub is not accessible to regular JobFlow subscribers. It is used by the JobFlow support team to provide customer assistance and manage the platform.*

---

## Summary

JobFlow is a comprehensive field service management platform that covers every aspect of running a service-based business:

| Area | What JobFlow Provides |
|------|----------------------|
| **Operations** | Jobs, scheduling, dispatch, recurring jobs, templates |
| **Sales** | Estimates, follow-up automation, conversion tracking |
| **Finance** | Invoicing, online payments (Stripe/Square), payment history, refunds |
| **Team** | Employee management, roles and permissions, invitations, bulk import |
| **Clients** | Customer database, Client Hub portal, magic link access |
| **Communication** | Real-time chat, SMS, email notifications, typing indicators, read receipts |
| **Field** | Mobile app, GPS tracking, photo documentation, offline support, on-site payments |
| **Customization** | Branding, custom workflows, pricebook, schedule settings |
| **Data** | Dashboard analytics, data export (JSON/CSV), audit logging |
| **Support** | Help center, knowledge base, changelog, in-app contact form |

Whether you're a solo operator managing a few clients or a growing team with dozens of employees in the field, JobFlow scales with you — from the **Go** plan for getting started, through **Flow** for full team management, to **Max** for advanced operations and priority support.
