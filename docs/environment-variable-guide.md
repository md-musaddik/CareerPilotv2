# Environment Variable Guide

This project uses one shared `.env` file for local development.

## App Runtime

| Variable | Purpose |
| --- | --- |
| `NODE_ENV` | Runtime mode for backend behavior |
| `PORT` | Backend API port |
| `CLIENT_URL` | Frontend origin used by the backend |
| `API_BASE_URL` | Local API base URL reference |
| `VITE_API_BASE_URL` | Frontend API base URL |
| `CORS_ORIGIN` | Allowed frontend origin for backend requests |
| `LOG_LEVEL` | Backend logging detail |

## MongoDB Atlas

| Variable | Purpose |
| --- | --- |
| `MONGODB_URI` | Atlas connection string |
| `MONGODB_DIRECT_URI` | Optional direct connection fallback when SRV DNS resolution fails |
| `MONGODB_DATABASE` | Database name |
| `MONGODB_VECTOR_SEARCH_INDEX` | Atlas Vector Search index name |

## Firebase Client

Used by the frontend only.

| Variable | Purpose |
| --- | --- |
| `VITE_FIREBASE_API_KEY` | Firebase web API key |
| `VITE_FIREBASE_AUTH_DOMAIN` | Firebase auth domain |
| `VITE_FIREBASE_PROJECT_ID` | Firebase project id |
| `VITE_FIREBASE_STORAGE_BUCKET` | Optional Firebase web config field; not used for resume storage |
| `VITE_FIREBASE_MESSAGING_SENDER_ID` | Firebase messaging sender id |
| `VITE_FIREBASE_APP_ID` | Firebase web app id |

## Firebase Admin

Used by the backend only.

| Variable | Purpose |
| --- | --- |
| `FIREBASE_PROJECT_ID` | Firebase project id |
| `FIREBASE_CLIENT_EMAIL` | Service account client email |
| `FIREBASE_PRIVATE_KEY` | Service account private key |

## Cloudinary

Used by the backend only for original resume file storage.

| Variable | Purpose |
| --- | --- |
| `CLOUDINARY_URL` | Optional single-string Cloudinary configuration |
| `CLOUDINARY_CLOUD_NAME` | Cloudinary cloud name when not using `CLOUDINARY_URL` |
| `CLOUDINARY_API_KEY` | Cloudinary API key when not using `CLOUDINARY_URL` |
| `CLOUDINARY_API_SECRET` | Cloudinary API secret when not using `CLOUDINARY_URL` |
| `CLOUDINARY_FOLDER` | Folder prefix for resume uploads, default `careerpilot/resumes` |

## OpenAI

| Variable | Purpose |
| --- | --- |
| `OPENAI_API_KEY` | Backend-only OpenAI key |
| `OPENAI_MODEL` | Chat/completions model for Copilot and explanations |
| `OPENAI_EMBEDDING_MODEL` | Embedding model for RAG, default `text-embedding-3-small` |

## Adzuna

| Variable | Purpose |
| --- | --- |
| `ADZUNA_APP_ID` | Adzuna app id |
| `ADZUNA_APP_KEY` | Adzuna app key |
| `ADZUNA_COUNTRY` | Country market, for example `us` |

## Jooble

| Variable | Purpose |
| --- | --- |
| `JOOBLE_API_KEY` | Backend-only Jooble REST API key used for broader international job coverage |

## Notes

- Never expose backend-only secrets to the frontend.
- Variables prefixed with `VITE_` are bundled into the frontend and must be safe for client exposure.
- `FIREBASE_PRIVATE_KEY` often needs newline escaping depending on the platform.
- `CORS_ORIGIN` may contain a comma-separated list of allowed frontend origins.
