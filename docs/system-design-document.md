# CareerPilot System Design Document

## Purpose

This document is written for the Poridhi Codesprint bonus category that asks for a system design document covering:

- data flow
- how the system scales to 10,000 users
- estimated cost per user per month
- key bottlenecks

CareerPilot is an AI-powered career operating system that turns a user's CV into a grounded data layer for job discovery, fit scoring, AI assistance, and productivity tracking.

## 1. System Goals

CareerPilot is designed to support four core product pillars:

1. CV-grounded resume intelligence
2. Live job search and fit scoring
3. Context-aware AI assistant
4. Workflow execution through tracker, goals, tasks, and calendar

The most important architectural requirement is that the CV acts as the source of truth for downstream AI behavior. The system should never fabricate the user's background.

## 2. High-Level Architecture

Main components:

- React/Vite frontend in `apps/web`
- Express/TypeScript backend in `apps/api`
- Shared contracts in `packages/shared`
- MongoDB Atlas for application data
- Atlas Vector Search for semantic retrieval
- Firebase Auth for identity
- Cloudinary for original resume file storage
- OpenAI for embeddings and AI generation
- Adzuna API for live job search

## 3. End-to-End Data Flow

### 3.1 CV upload to retrieval

1. User signs in through Firebase Auth.
2. Frontend obtains a Firebase ID token.
3. User uploads PDF or DOCX CV from the workspace.
4. Frontend sends the file to `POST /api/v1/resumes/upload`.
5. Backend verifies the Firebase token.
6. Backend validates file type and size.
7. Original file is uploaded to Cloudinary.
8. Backend extracts raw text from the resume.
9. Resume parser splits content into:
   - skills
   - projects
   - experience
   - education
10. Structured resume data and editable profile are stored in MongoDB.
11. Resume content is chunked by section.
12. Each chunk is embedded with OpenAI `text-embedding-3-small`.
13. Chunks, vectors, and metadata are stored in MongoDB Atlas.
14. Atlas Vector Search index becomes available for retrieval.

### 3.2 Job-search flow

1. User searches for a role from the jobs page.
2. Frontend calls the backend jobs route.
3. Backend queries the Adzuna API.
4. Backend computes deterministic fit scores against the saved resume/profile.
5. Backend returns structured job cards with:
   - role
   - company
   - salary
   - location
   - fit score
   - matched skills
   - missing skills
   - score breakdown

### 3.3 AI assistant flow

1. User sends a chat request.
2. Frontend sends the message plus session context to the backend.
3. Backend verifies authentication.
4. Backend loads assistant memory context:
   - parsed resume/profile
   - goals
   - applications
   - prior chat history
   - relevant resume chunks from vector search
5. Backend builds a grounded system prompt.
6. Backend calls OpenAI.
7. Response is streamed back to the frontend.
8. Assistant reply is displayed and stored in chat history for session continuity.

### 3.4 Tracker flow

1. User adds or updates applications, goals, tasks, and calendar items.
2. Frontend calls workspace endpoints.
3. Backend stores user-owned tracker records in MongoDB.
4. Dashboard and workspace views read those records and compute live progress metrics.

## 4. Core Data Stores

### MongoDB Atlas

Used for:

- users
- profiles
- resume documents
- parsed resumes
- resume chunks and vectors
- applications
- goals
- tasks
- calendar events
- chat sessions
- chat messages

### Cloudinary

Used for:

- original uploaded CV files only

### Firebase Auth

Used for:

- authentication
- frontend identity session
- backend token verification

## 5. APIs And Service Boundaries

### Frontend responsibilities

- auth handoff
- UI state and interaction
- React Query server-state management
- rendering streamed assistant responses

### Backend responsibilities

- auth verification
- file validation and storage
- resume parsing
- embedding generation
- vector retrieval
- fit-score computation
- AI orchestration
- workspace persistence

### Third-party boundaries

- OpenAI: embeddings and assistant generation
- Adzuna: live job data
- Cloudinary: resume file storage
- Firebase: auth only

## 6. Scaling To 10,000 Users

CareerPilot is small enough to run cost-effectively for a hackathon demo, but it can scale to 10,000 users with a few deliberate practices.

### 6.1 Expected traffic pattern

Not every registered user is active at once. A realistic 10,000-user scenario usually means:

- 500 to 1,500 monthly active users in an early-stage product
- 50 to 150 daily active users
- low concurrency except during demos or peak office hours

The heaviest operations are:

- CV upload and extraction
- embeddings during indexing
- AI assistant generation
- live job search bursts

### 6.2 Scaling strategy

#### Backend

- Run stateless API instances behind Railway or another container platform
- Scale horizontally by adding backend instances
- Keep request-specific state out of server memory

#### MongoDB Atlas

- Use indexes on `userId`, timestamps, and frequently filtered fields
- Keep vectors in a dedicated chunk collection
- Use Atlas Vector Search instead of loading full resume text into memory for every request

#### OpenAI usage

- Only embed new or changed resume chunks
- Reuse stored vectors unless a resume is edited
- Keep prompts grounded and compact to avoid unnecessary tokens

#### Job search

- Cache Adzuna responses briefly for identical searches when policy allows
- Defer refresh of low-priority searches

#### Frontend

- Use route-level code splitting
- Keep dashboards and workspace views query-driven
- Avoid large client-side global stores

## 7. Estimated Cost Per User Per Month

This is an estimate, not a billing quote.

### Assumptions

Per active user per month:

- 1 to 2 CV uploads or updates
- 10 to 20 assistant interactions
- 10 to 20 job searches
- 1 moderate-size resume indexed into chunks

### Cost drivers

1. OpenAI embeddings
2. OpenAI chat generation
3. MongoDB Atlas storage and vector search
4. Cloudinary file storage/bandwidth
5. Adzuna API usage limits
6. Hosting on Vercel and Railway

### Rough estimate

For a light-to-moderate active user:

- OpenAI embeddings: very low, typically near negligible after first indexing
- OpenAI assistant usage: moderate and dominant variable cost
- MongoDB + vector storage: low
- Cloudinary file storage: low
- Adzuna usage: low to moderate depending on plan
- Hosting share: low when spread across users

Estimated blended range:

- light active user: roughly `$0.10` to `$0.40` per month
- heavier active user with frequent assistant chat: roughly `$0.50` to `$2.00` per month

The biggest variable is AI chat frequency, not file storage.

## 8. Key Bottlenecks

### 8.1 OpenAI latency and cost

Why it matters:

- assistant responses and embeddings rely on OpenAI
- cost grows with conversation depth and usage frequency

Mitigation:

- use compact prompts
- stream responses
- reuse stored context instead of resending unnecessary text

### 8.2 Resume indexing path

Why it matters:

- extraction, parsing, chunking, and embedding happen in sequence

Mitigation:

- keep chunk sizes small and section-based
- embed only changed content after edits
- move indexing to background jobs if throughput grows

### 8.3 Vector search precision and collection growth

Why it matters:

- more chunks means more retrieval work and noisier results if chunking is poor

Mitigation:

- store chunk type metadata
- filter retrieval by user and chunk category
- refine chunking rules as corpus grows

### 8.4 Live third-party dependency risk

Why it matters:

- Adzuna, Firebase, OpenAI, Cloudinary, and MongoDB Atlas are all external dependencies

Mitigation:

- validate env at startup
- return clear error states
- isolate third-party logic inside services

### 8.5 Tracker aggregation at scale

Why it matters:

- dashboard metrics are derived from applications, tasks, goals, and calendar events

Mitigation:

- use indexed user-scoped reads
- precompute or cache high-cost aggregates if scale increases

## 9. Security And Privacy

- Firebase is the identity authority
- backend verifies ID tokens before all protected routes
- all user-owned MongoDB queries are scoped by `userId`
- original resumes are stored in Cloudinary, not the browser
- frontend never calls OpenAI directly
- secrets remain backend-only
- operational logs should avoid printing private resume content

## 10. Why This Design Fits The Hackathon Problem

This architecture matches the problem statement well because:

- the CV is the source of truth
- RAG is implemented over real resume data
- at least one live external tool call exists through Adzuna
- fit score is deterministic
- assistant memory exists within a session
- tracker functionality includes calendar, to-do, and kanban flows

## 11. Future Improvements

- background job queue for resume indexing
- cached fit-score snapshots for saved jobs
- richer session/history browsing for the AI assistant
- notification and proactive nudge scheduler
- evaluation suite with benchmark prompts and expected outcomes

