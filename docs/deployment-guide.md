# Deployment Guide

CareerPilot is designed for:

- Vercel frontend deployment
- Railway backend deployment

## Frontend Deployment (Vercel)

Project root for frontend:

`apps/web`

Recommended settings:

- Framework preset: Vite
- Build command: `npm run build:web`
- Output directory: `apps/web/dist`

Required frontend environment variables:

- `VITE_API_BASE_URL`
- `VITE_FIREBASE_API_KEY`
- `VITE_FIREBASE_AUTH_DOMAIN`
- `VITE_FIREBASE_PROJECT_ID`
- `VITE_FIREBASE_STORAGE_BUCKET`
- `VITE_FIREBASE_MESSAGING_SENDER_ID`
- `VITE_FIREBASE_APP_ID`

Set `VITE_API_BASE_URL` to the deployed Railway API base URL ending in `/api/v1`.

## Backend Deployment (Railway)

Project root for backend:

`apps/api`

Recommended settings:

- Build command: `npm run build:api`
- Start command: `npm run start --workspace apps/api`

Required backend environment variables:

- `NODE_ENV`
- `PORT`
- `CLIENT_URL`
- `CORS_ORIGIN`
- `MONGODB_URI`
- `MONGODB_DIRECT_URI`
- `MONGODB_DATABASE`
- `MONGODB_VECTOR_SEARCH_INDEX`
- `FIREBASE_PROJECT_ID`
- `FIREBASE_CLIENT_EMAIL`
- `FIREBASE_PRIVATE_KEY`
- `CLOUDINARY_URL` or the explicit Cloudinary credential variables
- `CLOUDINARY_CLOUD_NAME`
- `CLOUDINARY_API_KEY`
- `CLOUDINARY_API_SECRET`
- `CLOUDINARY_FOLDER`
- `OPENAI_API_KEY`
- `OPENAI_MODEL`
- `OPENAI_EMBEDDING_MODEL`
- `ADZUNA_APP_ID`
- `ADZUNA_APP_KEY`
- `ADZUNA_COUNTRY`
- `LOG_LEVEL`

## Production Checklist

- Create Firebase web app config for the frontend
- Create Firebase service account credentials for the backend
- Provision a Cloudinary product environment for resume uploads
- Provision MongoDB Atlas cluster and vector search index
- Provision OpenAI API key
- Provision Adzuna credentials
- Update frontend API base URL to the Railway backend
- Update backend CORS origin to the Vercel frontend

## Important Notes

- `FIREBASE_PRIVATE_KEY` must preserve line breaks correctly in Railway
- If SRV DNS resolution is unstable in your environment, set `MONGODB_DIRECT_URI` as a direct fallback
- Atlas Vector Search index must exist before RAG retrieval works in production
- OpenAI keys must never be exposed to the frontend
