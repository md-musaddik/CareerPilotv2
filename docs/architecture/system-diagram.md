# CareerPilot Architecture Diagram

This diagram is tailored to the hackathon repository requirement: it shows the data flow from CV upload through retrieval and into the final AI assistant response.

```mermaid
flowchart TD
    User["User"]
    Web["React Web App"]
    Firebase["Firebase Auth"]
    API["Express API (/api/v1)"]
    Cloudinary["Cloudinary"]
    Extract["Resume Text Extraction"]
    Parse["Resume Section Parsing"]
    MongoResume["MongoDB Atlas<br/>resumeDocuments + parsedResumes + profiles"]
    Chunk["Chunking by section<br/>skills / projects / experience / education"]
    Embed["OpenAI Embeddings<br/>text-embedding-3-small"]
    MongoChunks["MongoDB Atlas<br/>resumeChunks"]
    Vector["Atlas Vector Search"]
    Adzuna["Adzuna API"]
    Jooble["Jooble API"]
    Intent["Natural-language query parser"]
    Filter["Provider merge + filter + dedupe"]
    Fit["Deterministic Fit Score Engine"]
    Memory["Assistant Memory Builder<br/>resume + goals + applications + chat + retrieved chunks"]
    OpenAI["OpenAI Chat Model"]
    Stream["Streaming AI Response"]
    Workspace["Applications / Goals / Tasks / Calendar"]

    User -->|login| Web
    Web -->|ID token| Firebase
    Web -->|Bearer token + requests| API
    API -->|verify token| Firebase

    User -->|upload PDF/DOCX CV| Web
    Web -->|multipart upload| API
    API -->|store original CV| Cloudinary
    API --> Extract --> Parse --> MongoResume
    Parse --> Chunk --> Embed --> MongoChunks
    MongoChunks --> Vector

    User -->|search jobs in natural language| Web
    Web --> API
    API --> Intent
    Intent --> Adzuna
    Intent --> Jooble
    Adzuna --> Filter
    Jooble --> Filter
    API -->|load saved profile/resume| MongoResume
    Filter --> Fit
    MongoResume --> Fit
    Fit -->|job cards + fit explanation| Web

    User -->|ask AI Assistant| Web
    Web -->|chat request| API
    API -->|load tracker state| Workspace
    API -->|load resume/profile| MongoResume
    API -->|retrieve relevant chunks| Vector
    Workspace --> Memory
    MongoResume --> Memory
    Vector --> Memory
    Memory --> OpenAI
    OpenAI --> Stream --> Web
```

## Reading The Flow

### CV upload path

1. The user uploads a PDF or DOCX CV.
2. The backend stores the original file in Cloudinary.
3. The backend extracts text and parses resume sections.
4. Parsed profile and resume metadata are stored in MongoDB.
5. Resume sections are chunked and embedded.
6. Resume vectors are stored in MongoDB Atlas for retrieval.

### Job-search path

1. The frontend sends one natural-language query.
2. The backend parses intent into role terms, location, date window, and job type.
3. The backend queries Adzuna and Jooble using best-effort provider-specific mapping.
4. Provider results are merged, filtered, deduped, and optionally remote-fallback is applied.
5. The fit-score engine compares those jobs against the saved CV/profile.
6. The frontend receives structured job cards ranked by deterministic fit score.

### AI assistant path

1. The user asks a question.
2. The backend assembles memory from resume data, tracker data, chat history, and relevant retrieved chunks.
3. The backend calls OpenAI with grounded context.
4. The response is streamed back to the frontend.

## Why This Matters For Judging

This diagram highlights the core judging expectations:

- the CV is the source of truth
- RAG is based on actual user data
- job search uses external providers/API calls
- fit score is computed programmatically
- the assistant response is grounded, not generic
