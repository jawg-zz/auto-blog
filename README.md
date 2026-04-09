# AutoBlog - Advanced Auto Blogging System

A powerful auto blogging platform that aggregates, generates, schedules, and publishes content to multiple blog platforms automatically.

## Features

- **Multi-Source Content**: RSS feeds, manual input, and AI-generated content
- **AI Content Generation**: Integration with OpenAI and Anthropic for content creation
- **Smart Scheduling**: Cron-based scheduling for automatic publishing
- **Multi-Platform Publishing**: WordPress, Ghost, Medium, and custom APIs
- **Content Management**: Categories, tags, SEO metadata, featured images
- **Dashboard**: Real-time statistics and activity monitoring
- **Queue System**: Redis-backed job queue for reliable processing
- **Logging & Monitoring**: Track publishing history, failures, and retries

## Tech Stack

- **Backend**: Node.js, Express, Prisma ORM
- **Frontend**: React 18, Vite, TailwindCSS
- **Database**: PostgreSQL
- **Queue**: Redis with Bull
- **Scheduling**: node-cron

## Quick Start

### Prerequisites

- Node.js 18+
- PostgreSQL 15+
- Redis 7+

### Installation

```bash
# Clone the repository
cd autoblog

# Install dependencies
npm install

# Setup environment variables
cp server/.env.example server/.env
# Edit server/.env with your database and Redis credentials

# Setup database
cd server
npx prisma generate
npx prisma migrate dev
npx prisma db seed
cd ..

# Start development servers
npm run dev
```

The application will be available at:
- Frontend: http://localhost:5173
- Backend API: http://localhost:3001

### Default Login

```
Email: admin@autoblog.local
Password: password123
```

## Configuration

### Environment Variables

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
AI_PROVIDER=openai
```

## Project Structure

```
autoblog/
├── server/
│   ├── prisma/
│   │   └── schema.prisma    # Database schema
│   ├── src/
│   │   ├── routes/         # API routes
│   │   ├── services/       # Business logic
│   │   │   ├── sources/    # Content sources
│   │   │   ├── publishers/ # Platform publishers
│   │   │   └── ai/        # AI integration
│   │   ├── middleware/     # Express middleware
│   │   ├── utils/         # Utilities
│   │   └── workers/       # Queue workers
│   └── package.json
│
├── client/
│   ├── src/
│   │   ├── pages/         # React pages
│   │   ├── components/    # React components
│   │   └── api/           # API client
│   └── package.json
│
└── package.json            # Root workspace
```

## API Endpoints

### Sources
- `GET /api/sources` - List all sources
- `POST /api/sources` - Create source
- `PUT /api/sources/:id` - Update source
- `DELETE /api/sources/:id` - Delete source
- `POST /api/sources/:id/test` - Test connection

### Posts
- `GET /api/posts` - List posts
- `POST /api/posts` - Create post
- `PUT /api/posts/:id` - Update post
- `DELETE /api/posts/:id` - Delete post
- `POST /api/posts/:id/publish` - Publish to platforms

### Platforms
- `GET /api/platforms` - List platforms
- `POST /api/platforms` - Add platform
- `PUT /api/platforms/:id` - Update platform
- `DELETE /api/platforms/:id` - Delete platform
- `POST /api/platforms/:id/test` - Test connection

### Schedules
- `GET /api/schedules` - List schedules
- `POST /api/schedules` - Create schedule
- `PUT /api/schedules/:id` - Update schedule
- `DELETE /api/schedules/:id` - Delete schedule
- `POST /api/schedules/:id/trigger` - Run immediately

### AI
- `POST /api/ai/generate` - Generate content
- `POST /api/ai/summarize` - Summarize content
- `POST /api/ai/repurpose` - Repurpose for platform

## Content Sources

### RSS Feed
Configure RSS/Atom feeds to automatically import content.

### Manual Input
Create posts directly through the dashboard.

### AI Generation
Generate content automatically using AI models based on keywords and topics.

## Publishing Platforms

### WordPress
Requires XML-RPC enabled and an Application Password.

### Ghost
Uses the Admin Content API v5.

### Medium
Requires an Integration Token and User ID.

### Custom API
Generic REST API publisher for custom integrations.

## Queue System

Jobs are processed by Bull queues with:
- 3 retry attempts
- Exponential backoff
- 5 minute timeout

Job types:
- `publish-post` - Publish to platform
- `run-schedule` - Execute scheduled job
- `process-rss` - Fetch RSS feeds
- `generate-ai` - Create AI content

## License

MIT
