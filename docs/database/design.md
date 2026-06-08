# CareerPilot Database Design

CareerPilot uses MongoDB Atlas for product data. Firebase Auth is the identity authority, and user-owned MongoDB documents are scoped by Firebase UID.

## Global Rules

- Every user-owned document includes `userId`.
- Every document includes `createdAt` and `updatedAt`.
- Prefer explicit fields over unstructured blobs for product-critical data.
- Keep private user data scoped and queryable.
- Add indexes based on actual access patterns.

## Planned Collections

### users

Stores CareerPilot profile metadata linked to Firebase Auth.

Fields:

- `_id`
- `userId`
- `email`
- `displayName`
- `photoUrl`
- `careerTarget`
- `location`
- `preferences`
- `createdAt`
- `updatedAt`

Indexes:

- Unique `{ userId: 1 }`
- `{ email: 1 }`

PII:

- Email
- Name
- Location

### resumeDocuments

Stores resume file metadata and parsing status. The file itself lives in Cloudinary.

Fields:

- `_id`
- `userId`
- `storage.provider`
- `storage.reference`
- `storage.publicId`
- `storage.resourceType`
- `storage.secureUrl`
- `fileName`
- `mimeType`
- `sizeBytes`
- `status`
- `parsedResumeId`
- `createdAt`
- `updatedAt`

Indexes:

- `{ userId: 1, createdAt: -1 }`
- `{ userId: 1, status: 1 }`

PII:

- File name may contain private information.

### parsedResumes

Stores structured resume extraction results.

Fields:

- `_id`
- `userId`
- `resumeDocumentId`
- `contact`
- `summary`
- `skills`
- `experience`
- `education`
- `projects`
- `certifications`
- `rawTextRef`
- `createdAt`
- `updatedAt`

Indexes:

- `{ userId: 1, resumeDocumentId: 1 }`
- `{ userId: 1, createdAt: -1 }`

PII:

- Contact data
- Work history
- Education history
- Resume text

### ragSources

Stores retrievable source metadata for AI workflows.

Fields:

- `_id`
- `userId`
- `sourceType`
- `sourceId`
- `title`
- `contentHash`
- `metadata`
- `createdAt`
- `updatedAt`

Indexes:

- `{ userId: 1, sourceType: 1 }`
- `{ userId: 1, sourceId: 1 }`

### ragChunks

Stores chunk metadata and future embedding references.

Fields:

- `_id`
- `userId`
- `ragSourceId`
- `chunkIndex`
- `text`
- `embeddingModel`
- `embedding`
- `metadata`
- `createdAt`
- `updatedAt`

Indexes:

- `{ userId: 1, ragSourceId: 1, chunkIndex: 1 }`

PII:

- Chunk text may contain resume and career data.

### savedJobs

Stores normalized job records saved or viewed by the user.

Fields:

- `_id`
- `userId`
- `provider`
- `providerJobId`
- `title`
- `company`
- `location`
- `description`
- `url`
- `salaryMin`
- `salaryMax`
- `currency`
- `metadata`
- `createdAt`
- `updatedAt`

Indexes:

- `{ userId: 1, createdAt: -1 }`
- `{ userId: 1, provider: 1, providerJobId: 1 }`

### fitScores

Stores fit analysis between a resume/profile and a job.

Fields:

- `_id`
- `userId`
- `jobId`
- `resumeDocumentId`
- `score`
- `strengths`
- `gaps`
- `recommendations`
- `model`
- `createdAt`
- `updatedAt`

Indexes:

- `{ userId: 1, jobId: 1 }`
- `{ userId: 1, createdAt: -1 }`

### coverLetters

Stores generated cover letter drafts.

Fields:

- `_id`
- `userId`
- `jobId`
- `resumeDocumentId`
- `title`
- `content`
- `status`
- `model`
- `createdAt`
- `updatedAt`

Indexes:

- `{ userId: 1, createdAt: -1 }`
- `{ userId: 1, jobId: 1 }`

PII:

- Generated content may contain private career data.

### chatSessions

Stores persisted AI Copilot session metadata for continuity across career chat, roadmap, interview coach, and cover letter workflows.

Fields:

- `_id`
- `userId`
- `title`
- `sessionType`
- `status`
- `createdAt`
- `updatedAt`

Indexes:

- `{ userId: 1, createdAt: -1 }`
- `{ userId: 1, status: 1 }`

PII:

- Session titles may reference private career context.

### chatMessages

Stores the user-authored message and final assistant response shown in the AI Copilot UI.

This is an intentional, documented exception to the rule against storing raw model prompts and completions. The stored content is limited to product history needed for session continuity, retrieval of prior conversation context, and user review. Hidden system prompts and backend orchestration instructions are not stored.

Fields:

- `_id`
- `userId`
- `chatSessionId`
- `role`
- `actionType`
- `content`
- `model`
- `createdAt`
- `updatedAt`

Indexes:

- `{ userId: 1, chatSessionId: 1, createdAt: 1 }`
- `{ userId: 1, createdAt: -1 }`

PII:

- Message content can include resume data, goals, applications, and other private career information.

### applications

Tracks job applications.

Fields:

- `_id`
- `userId`
- `jobId`
- `company`
- `role`
- `status`
- `source`
- `appliedAt`
- `nextActionAt`
- `notes`
- `createdAt`
- `updatedAt`

Indexes:

- `{ userId: 1, status: 1 }`
- `{ userId: 1, nextActionAt: 1 }`
- `{ userId: 1, createdAt: -1 }`

### goals

Tracks user career goals.

Fields:

- `_id`
- `userId`
- `title`
- `description`
- `status`
- `priority`
- `targetDate`
- `milestones`
- `createdAt`
- `updatedAt`

Indexes:

- `{ userId: 1, status: 1 }`
- `{ userId: 1, targetDate: 1 }`

### calendarEvents

Stores user career-related calendar items.

Fields:

- `_id`
- `userId`
- `title`
- `type`
- `startsAt`
- `endsAt`
- `relatedEntityType`
- `relatedEntityId`
- `notes`
- `createdAt`
- `updatedAt`

Indexes:

- `{ userId: 1, startsAt: 1 }`
- `{ userId: 1, relatedEntityType: 1, relatedEntityId: 1 }`

### interviewSessions

Stores interview coach sessions.

Fields:

- `_id`
- `userId`
- `jobId`
- `mode`
- `questions`
- `answers`
- `feedback`
- `model`
- `createdAt`
- `updatedAt`

Indexes:

- `{ userId: 1, createdAt: -1 }`
- `{ userId: 1, jobId: 1 }`

### roadmaps

Stores AI-assisted career roadmaps.

Fields:

- `_id`
- `userId`
- `title`
- `targetRole`
- `currentLevel`
- `steps`
- `status`
- `model`
- `createdAt`
- `updatedAt`

Indexes:

- `{ userId: 1, createdAt: -1 }`
- `{ userId: 1, status: 1 }`

## Initial Status Enums

Resume document status:

- `uploaded`
- `parsing`
- `parsed`
- `failed`

Application status:

- `saved`
- `applied`
- `interviewing`
- `offer`
- `rejected`
- `withdrawn`

Goal status:

- `not_started`
- `in_progress`
- `completed`
- `paused`

Generated artifact status:

- `draft`
- `reviewed`
- `archived`
