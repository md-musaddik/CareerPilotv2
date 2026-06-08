# CareerPilot

CareerPilot is an AI-powered Career Operating System for the full job-search lifecycle: resume ingestion, resume intelligence, fit scoring, AI coaching, applications, goals, and calendar planning.

The product is built as a focused workspace instead of a marketing site. Every major surface is designed to help a user answer three questions quickly:

- Where do I stand?
- What should I do next?
- Why does this recommendation matter?

## What It Does

- Resume upload with PDF and DOCX support
- Resume parsing into skills, projects, experience, and education
- Cloudinary for original resume files
- MongoDB storage for structured resume data and profile state
- OpenAI embeddings with MongoDB Atlas Vector Search for RAG
- Adzuna job search integration
- Deterministic fit scoring with score breakdowns
- AI Copilot for resume review, skill gap analysis, career roadmap, cover letters, interview coaching, and career chat
- Workspace hub for resume, applications, goals, calendar, and settings
- Dashboard analytics, AI insight cards, and resume strength scoring

## Stack

- Frontend: React, Vite, TypeScript, React Router, Tailwind CSS, shadcn/ui, React Query
- Backend: Node.js, Express, TypeScript
- Database: MongoDB Atlas
- Auth: Firebase Auth
- Storage: Cloudinary
- AI: OpenAI
- Jobs: Adzuna API
- Deployment: Vercel for frontend, Railway for backend

## Architecture

The permanent source of truth is [AGENTS.md](</D:/CodeSprint 2026/CareerPilot v2/AGENTS.md>).

Useful architecture docs:

- [System overview](</D:/CodeSprint 2026/CareerPilot v2/docs/architecture/overview.md>)
- [System diagram](</D:/CodeSprint 2026/CareerPilot v2/docs/architecture/system-diagram.md>)
- [RAG architecture](</D:/CodeSprint 2026/CareerPilot v2/docs/architecture/rag.md>)
- [Fit score architecture](</D:/CodeSprint 2026/CareerPilot v2/docs/architecture/fit-score.md>)
- [AI Copilot architecture](</D:/CodeSprint 2026/CareerPilot v2/docs/architecture/ai-copilot.md>)
- [Technical documentation](</D:/CodeSprint 2026/CareerPilot v2/docs/technical-documentation.md>)
- [Database design](</D:/CodeSprint 2026/CareerPilot v2/docs/database/design.md>)

## Repository Structure

```txt
apps/
  web/                 React/Vite frontend
  api/                 Express backend
packages/
  shared/              Shared TypeScript contracts
docs/
  architecture/        Architecture documentation
  api/                 API documentation
  database/            Database documentation
scripts/               Automation scripts
```

## Quick Start

1. Install dependencies:

```bash
npm install
```

2. Copy `.env.example` to `.env` and fill in required values.

3. Start the frontend:

```bash
npm run dev:web
```

4. Start the backend:

```bash
npm run dev:api
```

5. Open the app:

- Frontend: `http://localhost:5173`
- API health: `http://localhost:4000/api/v1/health`

For fuller setup details, see:

- [Local setup guide](</D:/CodeSprint 2026/CareerPilot v2/docs/local-setup-guide.md>)
- [Environment variable guide](</D:/CodeSprint 2026/CareerPilot v2/docs/environment-variable-guide.md>)

## Key Product Surfaces

- `/` - auth entry and product handoff
- `/dashboard` - analytics, AI insight cards, and next actions
- `/dashboard/jobs` - Adzuna search plus deterministic fit scoring
- `/dashboard/copilot` - streaming AI Copilot with interview coach improvements
- `/dashboard/workspace` - resume, applications, goals, calendar, and settings

## Hackathon Notes

CareerPilot is optimized for judging around:

- Clear end-to-end architecture
- Practical AI usage with retrieval grounding
- Deterministic scoring where explainability matters
- Strong demo flow and visible user value
- Clean setup and deployment guidance

Judge-facing materials:

- [Judge demo script](</D:/CodeSprint 2026/CareerPilot v2/docs/judge-demo-script.md>)
- [Deployment guide](</D:/CodeSprint 2026/CareerPilot v2/docs/deployment-guide.md>)

## Status

Implemented through Phase 8:

- Auth and core layout
- Backend foundation
- Resume system
- RAG system
- Job search and fit score
- AI Copilot
- Workspace hub
- Polish, analytics, docs, and hackathon prep
