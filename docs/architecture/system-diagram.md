# CareerPilot System Diagram

```mermaid
flowchart LR
    User["User"]
    Web["React Web App<br/>Vite + React Router + React Query"]
    Auth["Firebase Auth"]
    API["Express API<br/>/api/v1"]
    Storage["Cloudinary"]
    Mongo["MongoDB Atlas"]
    Vector["Atlas Vector Search"]
    OpenAI["OpenAI API"]
    Adzuna["Adzuna API"]

    User --> Web
    Web -->|Firebase login / ID token| Auth
    Web -->|Bearer token| API

    API -->|verify token| Auth
    API --> Mongo
    API --> Storage
    API --> OpenAI
    API --> Adzuna
    Mongo --> Vector

    subgraph Resume Pipeline
      Upload["Resume upload"]
      Extract["Text extraction"]
      Parse["Section parsing"]
      Chunk["Chunking"]
      Embed["Embeddings<br/>text-embedding-3-small"]
    end

    API --> Upload --> Storage
    Upload --> Extract --> Parse --> Mongo
    Parse --> Chunk --> Embed --> Mongo
    Mongo --> Vector

    subgraph Copilot Memory
      Profile["Parsed resume + profile"]
      Goals["Goals"]
      Apps["Applications"]
      Chat["Chat history"]
      Chunks["Relevant resume chunks"]
    end

    Mongo --> Profile
    Mongo --> Goals
    Mongo --> Apps
    Mongo --> Chat
    Vector --> Chunks
    Profile --> API
    Goals --> API
    Apps --> API
    Chat --> API
    Chunks --> API

    API -->|streaming responses| Web
```

## Reading The Diagram

- Firebase Auth is the identity authority.
- MongoDB Atlas is the product data authority.
- Cloudinary holds original resume files.
- OpenAI is used only on the backend for embeddings and Copilot generation.
- Atlas Vector Search powers retrieval over resume chunks.
- Adzuna provides external job search data.
