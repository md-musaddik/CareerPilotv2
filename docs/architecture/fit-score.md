# CareerPilot Fit Score Architecture

CareerPilot fit scores are deterministic. GPT is not used to calculate, adjust, rank, or infer the score.

## Inputs

Candidate data comes from the saved editable profile generated from the resume system:

- Skills
- Projects
- Experience
- Education
- Location

Job data comes from normalized Adzuna search results:

- Title
- Description
- Company
- Location
- Salary metadata

## Criteria And Weights

The score is a weighted total out of 100:

```txt
Skill Match        40%
Experience Match   25%
Education Match    15%
Project Relevance  15%
Location Match      5%
```

## Deterministic Scoring

Skill Match:

- Extracts known technical skills from the job title and description.
- Compares extracted job skills with saved candidate skills.
- Returns matched and missing skills.

Experience Match:

- Extracts required years from job text such as `3 years` or `5+ yrs`.
- Estimates candidate years from explicit resume text when present.
- Falls back to experience entry count when explicit years are unavailable.

Education Match:

- Detects bachelor and master degree requirements in the job text.
- Compares against education entries from the saved profile.

Project Relevance:

- Builds deterministic keywords from saved projects.
- Scores overlap with the job description.

Location Match:

- Gives full credit for remote jobs.
- Otherwise compares normalized profile location terms with job location.

## OpenAI Usage

OpenAI is allowed only for optional explanation text. The explanation service receives the already-computed score and breakdown and is instructed not to change the score.

The score returned by the API is always computed before any OpenAI explanation request.

## API

Endpoint:

```txt
GET /api/v1/jobs/search
```

Query parameters:

```txt
what=frontend developer
where=remote
page=1
resultsPerPage=10
explain=false
```

Response includes:

- Score
- Matched skills
- Missing skills
- Score breakdown
- Optional explanation

