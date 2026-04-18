---
name: instructions
description: "Apply these rules when working on JobFlow features, including API services, domain models, Angular components, and integrations (Stripe, Firebase, square, etc)."
---

## Backend (.NET 10)
- Use Repository + UnitOfWork pattern
- All services return Result<T>
- Use the same pattern for model errors and validation errors
- Use CQRS pattern for commands/queries
- Validate using FluentValidation

## Frontend (Angular 18)
- Use standalone components
- Use service-based state management
- Use PrimeNG components for UI

## Mobile (Flutter)
- Use Provider for state management
- Follow Flutter's best practices for performance and responsiveness
- Use Material Design components for UI consistency across platforms
- Use branding colors and styles to maintain JobFlow's visual identity found in the UI

## General
- Follow SOLID principles
- Avoid duplication (DRY)
- Write clean, readable code with proper naming conventions
- Start work with unit tests, then develop to make them pass green
- Write unit tests for critical logic
- Document public APIs and complex logic with comments
- Use GitHub issues for tracking tasks and bugs

## Integrations
- For Stripe, use the official Stripe .NET SDK and Angular library
- For Firebase, use the official Firebase Admin SDK for .NET and AngularFire for frontend
- For Square, use the official Square .NET SDK and Angular library
- Follow best practices for each integration, including secure handling of API keys and sensitive data
- Implement error handling and logging for all integrations
- Write integration tests to ensure proper functionality of external services
- Keep integration logic separate from core business logic to maintain modularity and testability
- Stay up to date with the latest versions of SDKs and libraries for each integration

## Project Paths
- UI: C:\Users\jphil\repos\JobFlow-UI
- API: C:\Users\jphil\repos\JobFlow-API
- Mobile: C:\Users\jphil\repos\JobFlow-Mobile

## Design Principles
- Prioritize user experience and performance in all features
- Modern, clean UI design with a focus on usability
- Responsive design to support various screen sizes and devices

### Branding Guidelines (JobFlow)

#### Brand Vision & Voice
- Align all UI/UX and messaging with JobFlow’s vision: simplifying workflows for trade professionals
- Maintain a tone that is:
  - Bold and professional
  - Trustworthy and modern
  - Clear, confident, and approachable
- Avoid overly casual or overly technical language in user-facing content
- Messaging should communicate efficiency, reliability, and clarity

#### Color System
- Use the defined primary palette consistently:
  - `#FAFBFF` (Light base)
  - `#8595D1` (Soft accent)
  - `#3F67DA` (Primary action color)
  - `#000000` (Primary text)

- Use grayscale palette for structure and hierarchy (backgrounds, borders, disabled states)

##### Semantic Colors (System States)
- Success: `#2D898B`
  - Use for: successful actions, confirmations, completed statuses
  - Examples: “Payment Successful”, “Job Completed”, success alerts

- Warning: `#FFA630`
  - Use for: caution states, pending actions, potential issues
  - Examples: “Payment Pending”, “Unsaved Changes”, reminders

- Error: `#E03616`
  - Use for: failures, validation errors, destructive actions
  - Examples: form validation errors, failed payments, system errors

##### Usage Rules
- Maintain strong contrast for accessibility (WCAG compliance)
- Do not overload screens with semantic colors—use sparingly for emphasis
- Always pair semantic colors with icons and/or text (never rely on color alone)
- Ensure consistency across:
  - Angular UI (PrimeNG components, alerts, forms)
  - Flutter mobile UI
  - Emails, PDFs (QuestPDF), and notifications

- Do not introduce arbitrary colors outside the system unless explicitly approved

#### Typography
- Primary font: **Manrope**
- Use consistent font weights for hierarchy:
  - Headlines: Semibold / Bold
  - Body: Regular
  - Supporting text: Light / Medium
- Ensure readability across all devices
- Maintain consistent spacing and alignment

#### Logo Usage
- Always preserve logo integrity:
  - Do not stretch, distort, or recolor
- Maintain required clearspace around logo at all times
- Use only approved color backgrounds for logo placement
- Prefer high contrast backgrounds for visibility

#### UI Consistency
- Ensure icons, typography, and components are visually cohesive
- Maintain consistent spacing, padding, and layout structure
- Reuse components instead of creating variations (enforce design system discipline)

#### Product Experience Alignment
- Every UI decision should reinforce:
  - Simplicity
  - Speed
  - Professionalism
- Avoid cluttered interfaces—prioritize clarity over density
- Design flows should reduce friction for core actions (jobs, scheduling, invoicing)

#### Cross-Platform Consistency
- Ensure branding is consistent across:
  - Angular web app
  - Flutter mobile app
  - Emails, PDFs (QuestPDF), and notifications
- Shared design tokens (colors, typography, spacing) should be centralized
