# AI Changelog Generator

An AI-powered changelog generator built with Next.js, Supabase, GitHub OAuth, and OpenRouter.

The application connects to a GitHub repository, fetches new commits since the last synchronization, generates structured release notes using AI, and displays them as formatted Markdown.

---

## Features

- GitHub OAuth integration
- Connect GitHub repositories
- Fetch commits from GitHub
- Incremental synchronization using last synced commit SHA
- AI-generated changelogs
- Markdown rendering
- Repository dashboard
- Supabase Authentication
- Supabase PostgreSQL database

---

## Tech Stack

### Frontend

- Next.js 15
- React
- TypeScript
- Tailwind CSS
- React Markdown

### Backend

- Next.js Route Handlers
- Supabase
- PostgreSQL

### AI

- OpenRouter
- OpenAI SDK

### Authentication

- Supabase Authentication
- GitHub OAuth

---

## Project Architecture

```
User
 │
 ▼
Login (Supabase Auth)
 │
 ▼
Connect GitHub Account
 │
 ▼
Connect Repository
 │
 ▼
GitHub API
 │
 ▼
Fetch Commits
 │
 ▼
OpenRouter AI
 │
 ▼
Generate Markdown Changelog
 │
 ▼
Store in Supabase
 │
 ▼
Display on Dashboard
```

---

## Database Schema

### github_accounts

Stores the GitHub access token for each user.

| Column |
|---------|
| id |
| user_id |
| github_user_id |
| github_login |
| access_token |

---

### repos

Stores connected repositories.

| Column |
|---------|
| id |
| owner |
| name |
| full_name |
| last_synced_sha |

---

### changelogs

Stores generated changelogs.

| Column |
|---------|
| id |
| repo_id |
| version_label |
| content_md |
| published |
| created_at |

---

## How It Works

1. User signs in using Supabase Authentication.
2. User connects a GitHub account.
3. User connects a repository.
4. The application fetches commits from GitHub.
5. Only commits after `last_synced_sha` are considered.
6. Commit messages are sent to OpenRouter AI.
7. AI generates a categorized Markdown changelog.
8. The changelog is stored in Supabase.
9. The dashboard renders the Markdown.

---

## Example Output

```md
# Release v1.2.0

## Features

- Added GitHub OAuth support
- Added repository dashboard

## Fixes

- Fixed login redirect issue
- Fixed commit synchronization

## Improvements

- Improved API response time
- Optimized database queries
```

---

## Installation

```bash
git clone <repository-url>

cd ai-changelog-generator

npm install
```

Create a `.env.local` file.

```env
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=

GITHUB_CLIENT_ID=
GITHUB_CLIENT_SECRET=

OPENROUTER_API_KEY=
```

Run the application.

```bash
npm run dev
```

---

## Future Enhancements

- Publish GitHub Releases
- Generate release tags
- Changelog history
- Delete repositories
- Regenerate changelog
- Export Markdown
- Email/Slack notifications

---

## Author

Thanseer K A