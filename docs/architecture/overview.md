# CareerPilot Architecture Overview

CareerPilot is organized as a small monorepo with separate frontend, backend, and shared contract packages.

## System Context

```txt
User
  -> React/Vite frontend on Vercel
  -> Express API on Railway
  -> Firebase Auth for identity
  -> Cloudinary for resume files
  -> MongoDB Atlas for product data
  -> OpenAI for AI workflows
  -> Adzuna for job search
```

## Frontend Responsibilities

- Render the authenticated career workspace.
- Manage routing with React Router.
- Manage server state with React Query.
- Use Firebase Auth client SDK for sign-in and token retrieval.
- Upload files through approved backend/Cloudinary flows.
- Present AI outputs for user review.

The frontend must not:

- Call OpenAI directly.
- Call Adzuna directly.
- Store provider secrets.
- Trust client-provided user identity for protected data access.

## Backend Responsibilities

- Verify Firebase Auth ID tokens.
- Own API validation and authorization.
- Read and write MongoDB product data.
- Coordinate OpenAI workflows.
- Coordinate Adzuna job search workflows.
- Produce stable response shapes for the frontend.
- Keep provider-specific details behind service boundaries.

## Shared Package Responsibilities

- Shared TypeScript types.
- Shared validation schemas when useful.
- Cross-app constants.
- Pure utilities that are safe for frontend and backend use.

## Data Flow Examples

Resume upload:

```txt
Frontend selects resume
  -> authenticated upload flow
  -> Cloudinary stores file
  -> Backend stores resume metadata in MongoDB
  -> Backend parses resume and stores structured profile data
```

Job search:

```txt
Frontend sends search criteria
  -> Backend verifies auth
  -> Backend calls Adzuna
  -> Backend normalizes jobs
  -> Frontend displays results
```

AI copilot:

```txt
Frontend sends user message
  -> Backend verifies auth
  -> Backend loads scoped user context
  -> Backend calls OpenAI
  -> Backend returns answer and metadata
```

## Deployment

- `apps/web` deploys to Vercel.
- `apps/api` deploys to Railway.
- MongoDB Atlas, Firebase, OpenAI, and Adzuna are configured through environment variables.

## Documentation Index

- Main source of truth: `AGENTS.md`
- Database design: `docs/database/design.md`
- API conventions: `docs/api/conventions.md`
