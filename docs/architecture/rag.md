# CareerPilot RAG Architecture

CareerPilot RAG is scoped to authenticated user resume data. It does not generate final answers in Phase 4; it retrieves the most relevant resume chunks for future AI workflows.

## Pipeline

```txt
Resume upload or resume save
  -> Parsed resume sections
  -> Section-aware chunks
  -> OpenAI embeddings
  -> MongoDB resumeChunks with vectors
  -> Atlas Vector Search retrieval
```

## Source Data

The source of truth is the parsed resume stored in `parsedResumes`.

Indexed section types:

- `skills`
- `projects`
- `experience`
- `education`

Each chunk stores:

- `userId`
- `resumeDocumentId`
- `parsedResumeId`
- `chunkType`
- `chunkIndex`
- `text`
- `contentHash`
- `embeddingModel`
- `embedding`
- `metadata`
- `createdAt`
- `updatedAt`

## How Embeddings Are Created

`embeddingService` calls OpenAI embeddings from the backend only. The frontend never sees the OpenAI API key.

Model:

```txt
text-embedding-3-small
```

Upload flow:

1. The backend extracts text from the PDF or DOCX.
2. The backend parses the resume into skills, projects, experience, and education.
3. `resumeChunkService` creates section-aware chunks.
4. `embeddingService.createEmbeddings` sends chunk text to OpenAI in batch.
5. `vectorSearchService.replaceResumeChunkVectors` stores the vectors in MongoDB.

Save flow:

1. The user edits the parsed resume profile.
2. The backend saves the edited structured data.
3. Existing chunks for that parsed resume are deleted.
4. Fresh chunks and embeddings are created from the edited data.
5. New vectors replace the old retrieval index for that resume.

## How Chunking Works

Chunks are grouped by resume section type instead of arbitrary raw text windows. This keeps retrieval explainable because every result can say whether it came from skills, projects, experience, or education.

Long sections are split into groups of roughly 1,800 characters. Each chunk is formatted with a section heading and bullet-style items before embedding.

Example chunk text:

```txt
Experience
- Built a React dashboard for application tracking.
- Integrated Firebase authentication.
```

## How Vector Search Works

CareerPilot uses MongoDB Atlas Vector Search with the `$vectorSearch` aggregation stage.

Retrieval flow:

1. The user sends a retrieval query to `/api/v1/rag/retrieve`.
2. `ragService` embeds the query with `text-embedding-3-small`.
3. `vectorSearchService` runs `$vectorSearch` against `resumeChunks.embedding`.
4. Search is filtered by authenticated `userId`.
5. Optional `chunkTypes` filters narrow retrieval to specific resume sections.
6. Results are projected with `vectorSearchScore`.

## Atlas Vector Search Index

Create an Atlas Search index on the `resumeChunks` collection.

Suggested index name:

```txt
resume_chunks_vector_index
```

Suggested index definition:

```json
{
  "fields": [
    {
      "type": "vector",
      "path": "embedding",
      "numDimensions": 1536,
      "similarity": "cosine"
    },
    {
      "type": "filter",
      "path": "userId"
    },
    {
      "type": "filter",
      "path": "chunkType"
    },
    {
      "type": "filter",
      "path": "parsedResumeId"
    }
  ]
}
```

`text-embedding-3-small` returns 1,536-dimensional embeddings, so the index must use `numDimensions: 1536`.

## Retrieval Endpoint

Endpoint:

```txt
POST /api/v1/rag/retrieve
```

Authentication:

```txt
Authorization: Bearer <firebase-id-token>
```

Request:

```json
{
  "query": "React frontend experience",
  "limit": 5,
  "chunkTypes": ["experience", "projects"]
}
```

Response:

```json
{
  "query": "React frontend experience",
  "topRelevantChunks": [
    {
      "id": "...",
      "resumeDocumentId": "...",
      "parsedResumeId": "...",
      "chunkType": "experience",
      "chunkIndex": 2,
      "text": "Experience\n- Built React dashboards...",
      "score": 0.91
    }
  ]
}
```

## Security And Privacy

- Every vector document includes `userId`.
- Retrieval always filters by authenticated Firebase UID.
- OpenAI API calls happen only on the backend.
- Resume text and vectors are private user data.
- The retrieval endpoint returns chunks only for the authenticated user.

## Services

- `embeddingService`: Creates OpenAI embeddings.
- `resumeChunkService`: Converts parsed resume sections into chunk text.
- `vectorSearchService`: Stores vectors and runs Atlas Vector Search.
- `ragService`: Coordinates indexing and retrieval.

