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
- JobFlow branding and visual identity should be consistent across all features and components
