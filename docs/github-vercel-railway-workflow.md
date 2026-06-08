# CareerPilot GitHub, Vercel, and Railway Workflow Guide

This guide is the practical deployment and release playbook for CareerPilot.

It covers:

- uploading the monorepo to GitHub
- creating a clean branching workflow
- deploying the frontend to Vercel
- deploying the backend to Railway
- connecting GitHub to both platforms
- pushing future changes safely
- common errors, warnings, and things to avoid

This guide is written for the current CareerPilot structure:

```txt
apps/
  web/        React + Vite frontend
  api/        Express + TypeScript backend
packages/
  shared/     shared contracts and types
```

## 1. What You Are Deploying

CareerPilot is a JavaScript monorepo:

- frontend: `apps/web`
- backend: `apps/api`
- shared package: `packages/shared`

Deployment target:

- frontend -> Vercel
- backend -> Railway
- database -> MongoDB Atlas
- auth -> Firebase Auth
- storage -> Cloudinary
- AI -> OpenAI
- jobs -> Adzuna

## 2. Before You Upload Anything

Do these checks first.

### 2.1 Confirm `.gitignore`

Your repo now has a project-level `.gitignore`.

Important things it ignores:

- `.env`
- `.env.*`
- `node_modules`
- `dist`
- `*.log`
- `.vercel`
- `.railway`

That prevents accidental secret leaks and noisy commits.

### 2.2 Rotate any exposed secrets

Do this before or immediately after pushing to GitHub if any live secrets were ever pasted into chat, logs, screenshots, or temporary files.

Rotate these if they were exposed:

- MongoDB Atlas user password
- Firebase Admin private key
- Cloudinary API secret
- OpenAI API key
- Adzuna API key

### 2.3 Run final local checks

From the repo root:

```bash
npm run typecheck
npm run build
```

Then manually confirm:

- auth works
- job search works
- resume upload works
- resume update works
- RAG retrieval works
- Copilot works

### 2.4 Decide your production branch

Recommended:

- `main` = production branch

For a hackathon, keep it simple:

- `main`
- feature branches as needed

You do not need a heavy enterprise branching model here.

## 3. Uploading the Project to GitHub

If this repo is not already a Git repository, use this flow.

### 3.1 Initialize Git

From the repo root:

```bash
git init
git add .
git commit -m "Initial CareerPilot commit"
git branch -M main
```

### 3.2 Create a GitHub repository

In GitHub:

1. Click `New repository`
2. Choose a name like `careerpilot`
3. Keep it private unless you intentionally want it public
4. Do not add a README, `.gitignore`, or license if your local repo already has them

### 3.3 Connect local repo to GitHub

Replace the URL with your real GitHub repository URL:

```bash
git remote add origin https://github.com/<your-username>/careerpilot.git
git push -u origin main
```

### 3.4 Verify GitHub contents

Check that GitHub does **not** contain:

- `.env`
- `.env.old`
- `node_modules`
- `dist`
- logs

If any secret file appears in GitHub, stop and rotate the secrets immediately.

## 4. Recommended Branching Strategy

For this project, use a simple and safe branching model.

### 4.1 Branch roles

- `main`
  - production-ready code
  - connected to Vercel production
  - connected to Railway production

- `feature/<name>`
  - design improvements
  - UI polish
  - bug fixes
  - experiments

Examples:

- `feature/dashboard-polish`
- `feature/copilot-ui-tuning`
- `feature/resume-score-visuals`

### 4.2 Daily workflow

Create a feature branch:

```bash
git checkout main
git pull origin main
git checkout -b feature/resume-ui-polish
```

Work normally, then commit:

```bash
git add .
git commit -m "Polish resume workspace UI"
git push -u origin feature/resume-ui-polish
```

### 4.3 Merge workflow

Recommended flow:

1. push feature branch
2. let Vercel build a preview deployment
3. test the preview
4. create a pull request
5. merge into `main`
6. Vercel production deploy triggers
7. Railway production deploy triggers if connected to `main`

## 5. Vercel Deployment Guide

Official references:

- [Vercel Git deployments](https://vercel.com/docs/deployments/git)
- [Vercel deployment methods](https://vercel.com/docs/deployments/deployment-methods)
- [Vercel monorepos](https://vercel.com/docs/monorepos/)
- [Vercel project settings](https://vercel.com/docs/projects/project-configuration/project-settings)

### 5.1 What Vercel should host

Only the frontend:

- `apps/web`

### 5.2 Connect GitHub repo to Vercel

In Vercel:

1. Click `Add New -> Project`
2. Import your GitHub repository
3. Select the repo
4. Create a Vercel project for the frontend

### 5.3 Monorepo setup for Vercel

Recommended starting setup:

- Framework Preset: `Vite`
- Root Directory: `apps/web`

If Vercel resolves the monorepo correctly, that is the cleanest setup.

### 5.4 If the shared workspace causes build issues

Because this repo uses npm workspaces and `packages/shared`, monorepo resolution can sometimes be the part that bites.

If the `apps/web` root-directory setup fails to resolve shared workspace packages, use this fallback:

- Root Directory: repo root
- Build Command:

```bash
npm run build --workspace apps/web
```

- Output Directory:

```bash
apps/web/dist
```

This fallback is often the safest option for shared npm workspace repos.

### 5.5 Frontend environment variables in Vercel

Set these in Vercel Project Settings -> Environment Variables:

- `VITE_API_BASE_URL`
- `VITE_FIREBASE_API_KEY`
- `VITE_FIREBASE_AUTH_DOMAIN`
- `VITE_FIREBASE_PROJECT_ID`
- `VITE_FIREBASE_STORAGE_BUCKET`
- `VITE_FIREBASE_MESSAGING_SENDER_ID`
- `VITE_FIREBASE_APP_ID`

Important:

- `VITE_API_BASE_URL` must point to your Railway backend and end with `/api/v1`

Example:

```txt
https://careerpilot-api-production.up.railway.app/api/v1
```

### 5.6 Connect production branch

In Vercel project settings:

- keep `main` as the production branch

That means:

- pushes to `feature/*` -> preview deployments
- merges to `main` -> production deployment

### 5.7 What happens after each push

With Git integration enabled:

- pushing a feature branch creates a preview deployment
- merging to `main` creates a production deployment

This is one of the biggest reasons to deploy early.

## 6. Railway Deployment Guide

Official references:

- [Railway GitHub autodeploys](https://docs.railway.com/deployments/github-autodeploys)
- [Railway deployment actions](https://docs.railway.com/deployments/deployment-actions)
- [Railway monorepo guide](https://docs.railway.com/guides/monorepo)
- [Railway monorepo tutorial](https://docs.railway.com/tutorials/deploying-a-monorepo)

### 6.1 What Railway should host

Only the backend:

- `apps/api`

### 6.2 Create the Railway project

In Railway:

1. Create a new project
2. Connect GitHub
3. Select the CareerPilot repo
4. Create a service for the backend

### 6.3 Monorepo setup for Railway

CareerPilot is a shared JavaScript monorepo, so Railway needs explicit service settings.

Recommended setup:

- Root Directory: `apps/api`

If Railway detects the service correctly from the monorepo import, review the generated settings anyway.

### 6.4 Build and start commands

Recommended backend commands:

- Build Command:

```bash
npm run build --workspace apps/api
```

- Start Command:

```bash
npm run start --workspace apps/api
```

If Railway automatically generates working monorepo commands, you can keep them, but verify they point to the API workspace and not the web app.

### 6.5 Backend environment variables in Railway

Set these in Railway service variables:

- `NODE_ENV=production`
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
- `CLOUDINARY_URL` or:
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

### 6.6 Production branch behavior in Railway

Railway services linked to GitHub deploy from the configured trigger branch.

Recommended:

- use `main` as the production deploy branch

That means:

- feature branches do **not** automatically become production backend deploys
- merges to `main` trigger the production backend deploy

### 6.7 How to test backend branch changes on Railway

You have three safe options:

1. create a separate staging Railway service linked to a staging branch
2. temporarily change the trigger branch for the service
3. deploy manually through Railway for a non-production test

For hackathon speed, option 1 is the cleanest if you need repeated staging tests.

## 7. Full Demo Workflow: GitHub -> Vercel -> Railway

This is the full real-world flow.

### Step 1: Prepare local code

```bash
npm run typecheck
npm run build
```

### Step 2: Upload to GitHub

```bash
git init
git add .
git commit -m "Initial CareerPilot commit"
git branch -M main
git remote add origin https://github.com/<your-username>/careerpilot.git
git push -u origin main
```

### Step 3: Deploy frontend to Vercel

In Vercel:

1. import GitHub repo
2. configure project for `apps/web`
3. add frontend env vars
4. deploy

Expected result:

- frontend gets a live URL

### Step 4: Deploy backend to Railway

In Railway:

1. create backend service from GitHub repo
2. set root directory to `apps/api` if needed
3. set build/start commands
4. add backend env vars
5. deploy

Expected result:

- backend gets a public URL

### Step 5: Wire frontend to backend

Update in Vercel:

- `VITE_API_BASE_URL=https://<railway-backend>/api/v1`

Then redeploy frontend.

### Step 6: Test live app

Check:

- homepage loads
- login/signup works
- dashboard loads
- job search works
- Copilot works
- resume upload works
- resume save works

## 8. Ongoing Workflow After Deployment

### 8.1 Design or UX improvement branch

```bash
git checkout main
git pull origin main
git checkout -b feature/dashboard-redesign
```

Make changes, then:

```bash
git add .
git commit -m "Improve dashboard layout and spacing"
git push -u origin feature/dashboard-redesign
```

### 8.2 What happens next

- Vercel creates a preview deployment for that branch
- Railway usually does nothing unless that branch is configured as a deploy trigger

### 8.3 Merge to production

After review:

```bash
git checkout main
git pull origin main
git merge feature/dashboard-redesign
git push origin main
```

Then:

- Vercel deploys production frontend
- Railway deploys production backend if backend code changed and autodeploy is enabled on `main`

## 9. How To Push Changes Safely

### 9.1 Frontend-only change

Examples:

- layout polish
- typography
- spacing
- dashboard visuals
- button states

Flow:

1. commit to feature branch
2. push branch
3. review Vercel preview
4. merge to `main`

### 9.2 Backend-only change

Examples:

- API fixes
- middleware updates
- model changes
- scoring logic
- Copilot service updates

Flow:

1. push branch to GitHub
2. test locally first
3. optionally test in staging Railway service
4. merge to `main`
5. Railway deploys from `main`

### 9.3 Shared package change

Examples:

- changes in `packages/shared`

Important:

- shared changes can affect both frontend and backend
- always run:

```bash
npm run typecheck
npm run build
```

before pushing

## 10. Common Errors You May Face

### 10.1 Vercel cannot resolve `@careerpilot/shared`

Symptoms:

- build fails
- shared package import errors

Cause:

- monorepo root/build settings are wrong

Fix:

- try repo-root build settings
- use:

```bash
npm run build --workspace apps/web
```

and output directory:

```txt
apps/web/dist
```

### 10.2 Railway builds the wrong directory

Symptoms:

- backend service fails to build
- Railway behaves as if it is building the whole repo incorrectly

Fix:

- check Root Directory
- confirm it points to `apps/api`
- confirm build/start commands target the API workspace

### 10.3 MongoDB Atlas connection fails in production

Symptoms:

- backend crashes on startup
- health route unavailable

Common causes:

- Atlas IP access list issue
- invalid credentials
- `MONGODB_DIRECT_URI` missing
- wrong database user permissions

Fix:

- verify Atlas network rules
- verify credentials
- keep `MONGODB_DIRECT_URI` available as fallback

### 10.4 Firebase private key breaks on Railway

Symptoms:

- auth middleware fails
- backend startup errors involving Firebase Admin

Cause:

- private key formatting or newline escaping

Fix:

- paste it exactly as a single env value
- preserve newline escapes if required by the platform

### 10.5 CORS errors between Vercel and Railway

Symptoms:

- browser shows fetch failure
- backend may still be healthy

Cause:

- `CLIENT_URL` or `CORS_ORIGIN` does not match deployed frontend domain

Fix:

- add the exact Vercel frontend origin to:
  - `CLIENT_URL`
  - `CORS_ORIGIN`

### 10.6 Resume upload fails in production

Symptoms:

- file upload returns error

Common causes:

- Cloudinary credentials missing
- Cloudinary folder misconfigured
- file size/type validation blocks file

Fix:

- verify Cloudinary env vars
- confirm PDF/DOCX support
- confirm 8 MB limit is respected

### 10.7 Copilot works locally but fails in production

Common causes:

- wrong OpenAI model name
- model parameter mismatch
- missing API key

Fix:

- verify `OPENAI_MODEL`
- avoid unsupported parameters for the selected model

## 11. Things To Avoid

Do not do these.

### 11.1 Do not commit `.env`

Never push live secrets into GitHub.

### 11.2 Do not develop directly on `main`

Use feature branches, even for small UI changes.

### 11.3 Do not make Vercel and Railway both deploy every experimental branch into production

That gets chaotic fast.

### 11.4 Do not change production environment variables casually

A good deploy can break instantly from a bad env edit.

### 11.5 Do not assume frontend-only changes are always harmless

Some UI changes depend on response shape, auth state, or env config.

### 11.6 Do not ignore shared package changes

Anything in `packages/shared` can break both apps at once.

## 12. Recommended Release Rhythm

For your current stage, this is a healthy rhythm:

1. keep `main` deployable
2. do active work in `feature/*` branches
3. let Vercel previews validate UI changes
4. keep Railway production tied to `main`
5. use a staging Railway backend only if backend changes become frequent

## 13. Suggested Practical Setup For You

Given your current project stage, I recommend:

- GitHub repo: create now
- Vercel production deployment: create now
- Railway production deployment: create now
- Vercel preview deployments: use on every feature branch
- Railway staging: optional, only if backend changes become frequent

This gives you:

- a live demo URL
- repeatable update flow
- safer UI iteration
- cleaner hackathon judging story

## 14. Copy-Paste Command Cheat Sheet

### Initial GitHub upload

```bash
git init
git add .
git commit -m "Initial CareerPilot commit"
git branch -M main
git remote add origin https://github.com/<your-username>/careerpilot.git
git push -u origin main
```

### New feature branch

```bash
git checkout main
git pull origin main
git checkout -b feature/my-change
```

### Push branch

```bash
git add .
git commit -m "Describe the change"
git push -u origin feature/my-change
```

### Merge to main locally

```bash
git checkout main
git pull origin main
git merge feature/my-change
git push origin main
```

### Pre-push checks

```bash
npm run typecheck
npm run build
```

## 15. Final Advice

Deploy now, but treat the first deploy as infrastructure setup, not as a declaration that the product is frozen.

That is the sweet spot for your current stage:

- stable enough to demo
- flexible enough to keep improving
- safe enough to ship changes without confusion

Once GitHub, Vercel, and Railway are connected properly, your future workflow becomes much easier:

- push branch
- inspect preview
- merge to `main`
- production updates automatically
