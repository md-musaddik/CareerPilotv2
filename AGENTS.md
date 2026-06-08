# CareerPilot Agent Guide

AGENTS.md is the permanent architectural source of truth for CareerPilot. Future implementation prompts must follow this file before making product, code, schema, API, or UI decisions.

## Project Vision

CareerPilot is an AI-powered Career Operating System that helps users manage the full career search lifecycle from resume ingestion to applications, goals, interviews, and long-term growth.

The product should feel like a focused workspace, not a marketing site. It should help users understand where they stand, what to do next, and why a recommendation matters.

Core capabilities:

- Resume upload and storage
- Resume parsing
- Retrieval augmented generation over user career material
- Job search through Adzuna
- Job fit scoring
- AI career copilot
- Cover letter generation
- Career roadmap generation
- Interview coaching
- Application tracker
- Goals
- Calendar

## Stack

Frontend:

- React
- Vite
- TypeScript
- React Router
- Tailwind CSS
- shadcn/ui
- React Query

Backend:

- Node.js
- Express
- TypeScript

Database:

- MongoDB Atlas

Authentication:

- Firebase Auth

Storage:

- Cloudinary

AI:

- OpenAI

Jobs:

- Adzuna API

Deployment:

- Frontend: Vercel
- Backend: Railway

## Architecture Principles

- Keep frontend, backend, and shared contracts separated.
- Treat Firebase Auth as the identity authority and MongoDB as the product data authority.
- Keep AI orchestration on the backend. The frontend must not call OpenAI directly.
- Keep third-party API secrets on the backend only.
- Prefer explicit domain modules over broad utility dumping grounds.
- Favor stable, typed contracts between the frontend and backend.
- Design for user data privacy from the first implementation.
- Build features incrementally behind clear service boundaries.

## Folder Conventions

Repository layout:

```txt
apps/
  web/                 React/Vite frontend
  api/                 Express backend
packages/
  shared/              Shared TypeScript types, schemas, and constants
docs/
  architecture/        Architecture decisions and system diagrams
  api/                 API contract documentation
  database/            MongoDB data model documentation
scripts/               Project automation scripts
```

Frontend layout:

```txt
apps/web/src/
  app/                 App bootstrap, providers, global composition
  assets/              Static assets imported by the app
  components/          Shared non-domain components
  components/ui/       shadcn/ui components
  config/              Frontend runtime configuration
  features/            Domain feature modules
  hooks/               Shared React hooks
  layouts/             Route layouts and shells
  lib/                 Small frontend libraries and adapters
  pages/               Route-level page components
  routes/              React Router definitions
  services/            API clients and external frontend service wrappers
  styles/              Global CSS and Tailwind entry files
  types/               Frontend-only TypeScript types
```

Backend layout:

```txt
apps/api/src/
  app/                 Express app assembly and server bootstrap
  config/              Environment parsing and app configuration
  constants/           Backend constants
  controllers/         HTTP request handlers
  middleware/          Express middleware
  models/              MongoDB/Mongoose models
  repositories/        Database access logic
  routes/              Express route registration
  schemas/             Request validation schemas
  services/            Business logic and third-party integrations
  types/               Backend-only TypeScript types
  utils/               Small backend utilities
```

Shared package layout:

```txt
packages/shared/src/
  constants/           Cross-app constants
  schemas/             Shared validation schemas
  types/               Shared TypeScript types
  utils/               Shared pure utilities
```

## Naming Conventions

- Use `PascalCase` for React components, classes, and exported type aliases that model entities.
- Use `camelCase` for variables, functions, hooks, service methods, and object properties.
- Use `kebab-case` for file and folder names unless a framework convention requires otherwise.
- Use `useX` for React hooks.
- Use `XService` for business service modules.
- Use `XRepository` for database access modules.
- Use `XController` for HTTP controller modules.
- Use plural MongoDB collection names in lower camel case, such as `applications`, `careerGoals`, and `resumeDocuments`.
- Use `DTO` suffix only for transport-specific shapes that intentionally differ from domain models.

## API Conventions

- All backend routes are prefixed with `/api`.
- Version public API routes with `/api/v1` once implementation begins.
- Use resource-oriented REST naming where practical.
- Use JSON request and response bodies.
- Use Firebase ID tokens in the `Authorization: Bearer <token>` header.
- Verify Firebase Auth tokens in backend middleware before accessing protected routes.
- Do not trust user IDs sent from the client. Derive the authenticated user from the verified token.
- Use standard HTTP status codes:
  - `200` for successful reads and updates
  - `201` for successful creation
  - `204` for successful deletion with no body
  - `400` for invalid input
  - `401` for missing or invalid authentication
  - `403` for unauthorized access to an existing resource
  - `404` for missing resources
  - `409` for conflicts
  - `500` for unexpected server errors
- Return errors in this shape:

```ts
{
  error: {
    code: string;
    message: string;
    details?: unknown;
  }
}
```

- Validate all request bodies, params, and query strings before business logic.
- Backend controllers should stay thin: validate input, call services, return responses.
- Third-party integrations belong in services, not controllers.
- Avoid leaking provider-specific response shapes to the frontend.

## Database Conventions

- MongoDB documents must include `createdAt` and `updatedAt`.
- User-owned documents must include `userId`, derived from Firebase Auth UID.
- Use indexes for common access patterns, especially `{ userId: 1, createdAt: -1 }`.
- Store provider identifiers explicitly when syncing external data.
- Do not store raw OpenAI prompts or completions unless required for product history and clearly documented.
- Store resume files in Cloudinary; store metadata, parsed sections, and references in MongoDB.
- Store vector/RAG metadata separately from raw documents once embeddings are introduced.
- Use soft deletes only where history matters, such as applications and generated artifacts.
- Keep PII fields explicit in schema docs.
- Never store Firebase private keys in the database.

## UI Conventions

- The UI should feel like a professional career command center: calm, organized, actionable, and fast to scan.
- Use shadcn/ui as the base component system.
- Use Tailwind utility classes for layout and styling.
- Use cards for repeated records, modals, and focused panels; do not nest cards inside cards.
- Prefer dense, readable workflows over oversized landing-page sections.
- Use icons in toolbars and command buttons when an established icon exists.
- Keep dashboards information-rich but restrained.
- Every async workflow must show loading, empty, success, and error states.
- User-facing AI output must be reviewable before it is used externally.
- Any destructive action must require confirmation.
- Avoid decorative UI that does not clarify user progress or decisions.
- Support responsive layouts from mobile to desktop.

## Design System

Visual direction:

- Professional, clear, and modern.
- Use a balanced palette with neutral surfaces and distinct accent colors for state and priority.
- Avoid a one-note palette dominated by a single hue.
- Use strong hierarchy, compact spacing, and accessible contrast.

Core semantic colors:

- Background: app shell and page canvas
- Surface: panels, tables, lists, and forms
- Primary: main action and navigation highlight
- Secondary: supporting actions
- Success: positive fit, completed goals, accepted states
- Warning: attention needed, deadlines, incomplete requirements
- Danger: destructive actions or high-risk issues
- Muted: secondary text and low-priority metadata

Typography:

- Use readable sans-serif typography.
- Reserve large display text for true page-level headings.
- Keep dashboard and tool headings compact.
- Do not use negative letter spacing.
- Do not scale font size directly with viewport width.

Interaction:

- Buttons must communicate clear actions.
- Forms must validate close to the input.
- Tables and lists must support scanning.
- AI actions should show what input is being used and what output was generated.

## Performance Rules

- Use React Query for server state, caching, request status, and invalidation.
- Keep client state local unless it must be shared.
- Avoid unnecessary global stores.
- Use route-level code splitting when feature size warrants it.
- Avoid large third-party packages unless the feature clearly needs them.
- Keep AI and job search calls on the backend to reduce frontend payload and protect secrets.
- Paginate or cursor large lists.
- Index MongoDB collections according to query patterns.
- Avoid loading full resume text into every request; fetch it only where needed.
- Cache external job search responses when practical and compliant with provider terms.

## Coding Standards

- TypeScript is required for frontend, backend, and shared packages.
- Prefer explicit types at module boundaries.
- Avoid `any`; use `unknown` and narrow it when necessary.
- Keep functions small and intention-revealing.
- Keep business logic out of React components and Express controllers.
- Use environment variable validation during app startup.
- Keep secrets out of source control.
- Use shared schemas/types for cross-app contracts.
- Prefer pure utilities in `packages/shared`.
- Write tests for parsing, scoring, AI orchestration boundaries, and database access logic once features are implemented.
- Do not introduce feature code during foundation-only phases.

## Security And Privacy Rules

- Never expose OpenAI, Adzuna, Firebase Admin, MongoDB, or Railway secrets to the frontend.
- Enforce authentication on all user data routes.
- Scope every user-owned query by authenticated `userId`.
- Validate file type and size before resume uploads.
- Treat resumes, generated letters, notes, goals, and application history as private user data.
- Sanitize any model output before rendering as HTML.
- Log operational metadata, not private resume content.

## Feature Boundary Guidance

Future feature modules should map to product domains:

- `resume`
- `rag`
- `jobs`
- `fit-score`
- `copilot`
- `cover-letter`
- `roadmap`
- `interview-coach`
- `applications`
- `goals`
- `calendar`

Each domain should own its UI, services, types, and tests where practical, while shared primitives remain in shared folders.
