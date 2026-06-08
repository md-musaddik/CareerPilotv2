# API Conventions

CareerPilot API implementation will begin in a later phase. This document records the intended contract style.

## Base Path

All routes should be mounted under:

```txt
/api/v1
```

## Authentication

Protected routes require a Firebase ID token:

```txt
Authorization: Bearer <firebase-id-token>
```

The backend must verify the token and derive `userId` from the verified Firebase UID.

## Response Shape

Successful responses should return JSON objects with stable, typed fields. List responses should include pagination metadata once pagination is implemented.

Errors should use:

```ts
{
  error: {
    code: string;
    message: string;
    details?: unknown;
  }
}
```

## Planned Route Groups

- `/auth` for session and identity-adjacent helpers
- `/resumes` for resume metadata and parsing results
- `/jobs` for job search and saved jobs
- `/fit-scores` for job fit analysis
- `/copilot` for AI career chat
- `/cover-letters` for generated cover letters
- `/roadmaps` for career plans
- `/interviews` for interview coaching
- `/applications` for application tracking
- `/goals` for user goals
- `/calendar` for calendar items

