# CareerPilot AI Copilot Architecture

The AI Copilot is a backend-orchestrated OpenAI workflow. The frontend never calls OpenAI directly and never receives provider secrets.

## Features

Supported action types:

- Resume Review
- Skill Gap Analysis
- Career Roadmap
- Cover Letter Generator
- Interview Coach
- Career Chat

## Services

- `chatService`: Creates chat sessions, builds model messages, calls OpenAI, streams responses, and persists user/assistant messages.
- `copilotMemoryService`: Loads memory context for the authenticated user.
- `roadmapService`: Supplies roadmap-specific instructions.
- `coverLetterService`: Supplies cover-letter-specific instructions.
- `interviewCoachService`: Supplies interview-coach-specific instructions.

## Memory Context

The Copilot builds context from:

- Latest parsed resume profile
- Goals
- Applications
- Current chat history
- Relevant resume chunks from RAG retrieval

The memory context is assembled on the backend after Firebase authentication. All database queries are scoped by authenticated `userId`.

## Relevant Resume Chunks

For every Copilot request, `copilotMemoryService` tries to retrieve relevant resume chunks through the Phase 4 RAG service.

If vector retrieval is unavailable, the Copilot still works with resume/profile, goals, applications, and chat history. The skipped retrieval is logged as operational metadata without logging private resume content.

## Streaming

Streaming uses a protected POST endpoint:

```txt
POST /api/v1/copilot/chat/stream
```

The frontend uses `fetch` with a Firebase bearer token and reads the response stream. This is used instead of browser `EventSource` because `EventSource` cannot reliably send custom authorization headers.

The backend sends server-sent event frames:

```txt
event: delta
data: {"delta":"text"}

event: done
data: {"sessionId":"...","message":{"role":"assistant","content":"..."}}
```

## Persistence

The user message and assistant response are saved in `chatMessages`.

Chat sessions are saved in `chatSessions` with a session type:

- `copilot`
- `interview_coach`
- `roadmap`
- `cover_letter`

System prompts are not stored as chat messages.

This storage is an intentional product-history exception to the general rule against storing raw model prompts and completions. CareerPilot keeps only the user-authored chat message and the final assistant response needed for session continuity, follow-up context, and user review. Internal system prompts, provider secrets, and hidden orchestration instructions are not persisted.

Because chat content can include resume details, goals, applications, and other private career information, `chatMessages` and `chatSessions` are treated as private user data and are always scoped by authenticated `userId`.
