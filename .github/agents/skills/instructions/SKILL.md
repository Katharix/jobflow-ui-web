---
name: instructions
description: Core coding standards and conventions for JobFlow features. Apply when working on API services, domain models, Angular components, or integrations (Stripe, Firebase, Square). Defines patterns for backend, frontend, mobile, and cross-cutting concerns.
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

## Security Standards

JobFlow targets **OWASP ASVS 5.0 Level 1** compliance as the minimum for all new code. Authentication, authorization, session management, cryptography, and payment flows target **Level 2**.

Key non-negotiables:
- All API endpoints are protected by `[Authorize]` or explicitly annotated `[AllowAnonymous]`
- All data access is scoped to the authenticated user's `orgId` — never trust org identifiers from clients
- No secrets, API keys, or connection strings in source code or `appsettings.json`
- Return only required fields from API responses; use explicit DTOs
- No authorization logic in Angular — enforcement is server-side only
- Clear auth state (tokens, user data) from browser storage on logout
- All database queries use EF Core parameterized queries — no raw SQL with user input

Run the `security-analyst` skill monthly and after any significant auth, payment, or authorization change.

## Design Principles
- Prioritize user experience and performance in all features
- Modern, clean UI design with a focus on usability
- Responsive design to support various screen sizes and devices

See the `branding` skill for full brand guidelines including color system, typography, and logo usage.
