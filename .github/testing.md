# Running Tests (JobFlow)

## UI (JobFlow-UI)
- Path: C:\Users\jphil\repos\JobFlow-UI
- Tool: VS Code task (run_task)
- Task ID: npm: 1
- Command: npm run test

## API (JobFlow-API)
- Path: C:\Users\jphil\repos\JobFlow-API
- Tool: run_in_terminal (PowerShell)
- Command:
  dotnet test .\JobFlow.API\JobFlow.API.sln

## Mobile (JobFlow-Mobile)
- Path: C:\Users\jphil\repos\JobFlow-Mobile
- Tool: run_in_terminal (PowerShell)
- Command:
  flutter test
