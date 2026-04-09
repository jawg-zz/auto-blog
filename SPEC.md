# Auto Blogging System - Technical Specification

## Overview

An advanced auto blogging system that aggregates, generates, schedules, and publishes content to multiple blog platforms automatically.

## Architecture

```
┌─────────────────────────────────────────────────────────────────────┐
│                         React Dashboard                              │
│                    (Content Management UI)                          │
└─────────────────────────────────────────────────────────────────────┘
                                 │ REST API
┌─────────────────────────────────────────────────────────────────────┐
│                        Express API Server                            │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────────────┐   │
│  │  Routes  │  │ Services │  │  Queue   │  │   Scheduler      │   │
│  │          │  │          │  │ (Bull)   │  │   (node-cron)    │   │
│  └──────────┘  └──────────┘  └──────────┘  └──────────────────┘   │
└─────────────────────────────────────────────────────────────────────┘
         │                │                │                │
    ┌────┴────┐     ┌────┴────┐     ┌────┴────┐     ┌────┴────┐
    │PostgreSQL│    │  Redis  │     │ Content │     │ Platform│
    │  (Data)  │    │ (Queue) │     │ Sources │     │Publishers│
    └─────────┘     └─────────┘     └─────────┘     └─────────┘
```

## Tech Stack

- **Backend**: Node.js 18+, Express 4.x
- **Frontend**: React 18, Vite, TailwindCSS
- **Database**: PostgreSQL 15+
- **Queue**: Redis 7+ with Bull
- **Scheduling**: node-cron
- **ORM**: Prisma
- **API**: REST

## Database Schema

### Tables

#### 1. `sources`
Content sources configuration.
```sql
- id: UUID PRIMARY KEY
- name: VARCHAR(255) NOT NULL
- type: ENUM('rss', 'manual', 'ai_generation')
- config: JSONB NOT NULL
- enabled: BOOLEAN DEFAULT true
- created_at: TIMESTAMP
- updated_at: TIMESTAMP
```

#### 2. `posts`
Generated/published posts.
```sql
- id: UUID PRIMARY KEY
- title: VARCHAR(500)
- content: TEXT
- excerpt: TEXT
- status: ENUM('draft', 'scheduled', 'published', 'failed')
- source_id: UUID REFERENCES sources(id)
- category_id: UUID REFERENCES categories(id)
- featured_image: VARCHAR(1000)
- seo_title: VARCHAR(500)
- seo_description: TEXT
- published_at: TIMESTAMP
- created_at: TIMESTAMP
- updated_at: TIMESTAMP
```

#### 3. `categories`
Content categories.
```sql
- id: UUID PRIMARY KEY
- name: VARCHAR(255) NOT NULL
- slug: VARCHAR(255) UNIQUE NOT NULL
- description: TEXT
- created_at: TIMESTAMP
```

#### 4. `tags`
Content tags.
```sql
- id: UUID PRIMARY KEY
- name: VARCHAR(255) NOT NULL
- slug: VARCHAR(255) UNIQUE NOT NULL
- created_at: TIMESTAMP
```

#### 5. `post_tags` (junction table)
```sql
- post_id: UUID REFERENCES posts(id)
- tag_id: UUID REFERENCES tags(id)
- PRIMARY KEY (post_id, tag_id)
```

#### 6. `platforms`
Publishing platform configurations.
```sql
- id: UUID PRIMARY KEY
- name: VARCHAR(255) NOT NULL
- type: ENUM('wordpress', 'ghost', 'medium', 'custom_api')
- credentials: JSONB NOT NULL
- enabled: BOOLEAN DEFAULT true
- created_at: TIMESTAMP
- updated_at: TIMESTAMP
```

#### 7. `publishing_logs`
Log of all publishing attempts.
```sql
- id: UUID PRIMARY KEY
- post_id: UUID REFERENCES posts(id)
- platform_id: UUID REFERENCES platforms(id)
- status: ENUM('success', 'failed', 'retrying')
- response: JSONB
- error_message: TEXT
- attempts: INTEGER DEFAULT 1
- published_url: VARCHAR(1000)
- created_at: TIMESTAMP
```

#### 8. `schedules`
Cron job configurations.
```sql
- id: UUID PRIMARY KEY
- name: VARCHAR(255) NOT NULL
- source_id: UUID REFERENCES sources(id)
- platform_ids: UUID[]
- cron_expression: VARCHAR(100) NOT NULL
- enabled: BOOLEAN DEFAULT true
- last_run: TIMESTAMP
- next_run: TIMESTAMP
- created_at: TIMESTAMP
```

#### 9. `settings`
Application settings.
```sql
- key: VARCHAR(255) PRIMARY KEY
- value: JSONB NOT NULL
- updated_at: TIMESTAMP
```

## API Endpoints

### Sources
- `GET /api/sources` - List all sources
- `GET /api/sources/:id` - Get source details
- `POST /api/sources` - Create new source
- `PUT /api/sources/:id` - Update source
- `DELETE /api/sources/:id` - Delete source
- `POST /api/sources/:id/test` - Test source connection

### Posts
- `GET /api/posts` - List posts (with filters)
- `GET /api/posts/:id` - Get post details
- `POST /api/posts` - Create/edit post
- `PUT /api/posts/:id` - Update post
- `DELETE /api/posts/:id` - Delete post
- `POST /api/posts/:id/publish` - Publish to platform(s)
- `POST /api/posts/:id/retry` - Retry failed publish

### Categories
- `GET /api/categories` - List categories
- `POST /api/categories` - Create category
- `PUT /api/categories/:id` - Update category
- `DELETE /api/categories/:id` - Delete category

### Tags
- `GET /api/tags` - List tags
- `POST /api/tags` - Create tag
- `PUT /api/tags/:id` - Update tag
- `DELETE /api/tags/:id` - Delete tag

### Platforms
- `GET /api/platforms` - List platforms
- `GET /api/platforms/:id` - Get platform details
- `POST /api/platforms` - Create platform
- `PUT /api/platforms/:id` - Update platform
- `DELETE /api/platforms/:id` - Delete platform
- `POST /api/platforms/:id/test` - Test platform connection

### Schedules
- `GET /api/schedules` - List schedules
- `POST /api/schedules` - Create schedule
- `PUT /api/schedules/:id` - Update schedule
- `DELETE /api/schedules/:id` - Delete schedule
- `POST /api/schedules/:id/trigger` - Manually trigger schedule

### Dashboard
- `GET /api/dashboard/stats` - Get dashboard statistics
- `GET /api/logs` - Get publishing logs
- `GET /api/health` - Health check

### AI Generation
- `POST /api/ai/generate` - Generate content
- `POST /api/ai/summarize` - Summarize content
- `POST /api/ai/repurpose` - Repurpose content

## Content Sources

### RSS Feed
- Fetch from RSS/Atom feeds
- Parse title, content, date, categories
- Config: `{ url: string, refreshInterval: number, maxItems: number }`

### Manual Input
- Direct content entry via API
- Config: `{ defaultCategory: string, defaultTags: string[] }`

### AI Generation
- Generate content from keywords/prompts
- Config: `{ apiProvider: string, apiKey: string, model: string, defaultLength: string }`

## Platform Publishers

### WordPress
- XML-RPC or REST API
- Credentials: `{ siteUrl, username, appPassword }`

### Ghost
- Content API v5
- Credentials: `{ adminUrl, apiKey }`

### Medium
- Integration API
- Credentials: `{ accessToken, userId }`

### Custom API
- Generic REST API publisher
- Credentials: `{ baseUrl, apiKey, headers }`

## Queue System

### Jobs
- `process-rss-feed` - Fetch and process RSS feeds
- `generate-ai-content` - Generate AI content
- `publish-post` - Publish post to platform
- `retry-failed` - Retry failed publishing
- `cleanup-logs` - Periodic log cleanup

### Job Options
- Attempts: 3
- Backoff: exponential (1000ms base)
- Remove on complete: false
- Job timeout: 5 minutes

## Scheduler

### Cron Jobs
- RSS feeds: Configurable intervals (default: every hour)
- AI generation: Based on schedule config
- Log cleanup: Daily at midnight
- Health check: Every 5 minutes

## Frontend Pages

1. **Dashboard** - Overview stats, recent activity, quick actions
2. **Posts** - List/filter/create/edit posts
3. **Sources** - Manage content sources
4. **Platforms** - Manage publishing platforms
5. **Schedules** - View/configure schedules
6. **Categories & Tags** - Content taxonomy
7. **Logs** - Publishing history and errors
8. **Settings** - AI config, app settings

## Security

- API authentication via JWT
- Platform credentials encrypted at rest
- Input sanitization
- Rate limiting
- CORS configuration

## File Structure

```
/data/workspace/opencode/
├── SPEC.md
├── README.md
├── package.json
├── server/
│   ├── package.json
│   ├── prisma/
│   │   └── schema.prisma
│   ├── src/
│   │   ├── index.js
│   │   ├── app.js
│   │   ├── config/
│   │   │   └── index.js
│   │   ├── routes/
│   │   │   ├── index.js
│   │   │   ├── sources.js
│   │   │   ├── posts.js
│   │   │   ├── categories.js
│   │   │   ├── tags.js
│   │   │   ├── platforms.js
│   │   │   ├── schedules.js
│   │   │   ├── dashboard.js
│   │   │   └── ai.js
│   │   ├── services/
│   │   │   ├── queue.js
│   │   │   ├── scheduler.js
│   │   │   ├── sources/
│   │   │   │   ├── index.js
│   │   │   │   ├── rss.js
│   │   │   │   ├── manual.js
│   │   │   │   └── ai.js
│   │   │   ├── publishers/
│   │   │   │   ├── index.js
│   │   │   │   ├── wordpress.js
│   │   │   │   ├── ghost.js
│   │   │   │   ├── medium.js
│   │   │   │   └── custom.js
│   │   │   └── ai/
│   │   │       └── index.js
│   │   ├── middleware/
│   │   │   ├── auth.js
│   │   │   ├── errorHandler.js
│   │   │   └── validate.js
│   │   └── utils/
│   │       ├── logger.js
│   │       └── helpers.js
│   └── workers/
│       └── index.js
└── client/
    ├── package.json
    ├── vite.config.js
    ├── index.html
    ├── tailwind.config.js
    ├── postcss.config.js
    └── src/
        ├── main.jsx
        ├── App.jsx
        ├── index.css
        ├── api/
        │   └── index.js
        ├── components/
        │   ├── Layout.jsx
        │   ├── Sidebar.jsx
        │   └── ...
        └── pages/
            ├── Dashboard.jsx
            ├── Posts.jsx
            ├── Sources.jsx
            ├── Platforms.jsx
            ├── Schedules.jsx
            ├── Categories.jsx
            ├── Tags.jsx
            ├── Logs.jsx
            └── Settings.jsx
```

## Environment Variables

```env
# Database
DATABASE_URL=postgresql://user:pass@localhost:5432/autoblog

# Redis
REDIS_URL=redis://localhost:6379

# App
PORT=3001
NODE_ENV=development
JWT_SECRET=your-secret-key

# AI Providers (optional)
OPENAI_API_KEY=sk-...
ANTHROPIC_API_KEY=sk-ant-...
```
