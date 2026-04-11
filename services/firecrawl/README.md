# Firecrawl Service

Self-hosted Firecrawl instance for use with the auto-blog app.

## Setup in Dokploy

1. Create a new project in Dokploy: `firecrawl`
2. Link this `services/firecrawl/` directory as the repository
3. Set the build compose path: `services/firecrawl/docker-compose.yml`
4. Deploy — Dokploy will pull the images and start all 5 services

## Environment Variables

| Variable | Default | Description |
|---|---|---|
| `PORT` | `3002` | External port for the API |
| `POSTGRES_PASSWORD` | `firecrawl_secure_pass` | Change this to a strong secret |
| `BULL_AUTH_KEY` | `firecrawl_admin_change_me` | Change this to a strong secret |
| `OPENAI_API_KEY` | _(empty)_ | Optional — enables AI features |
| `ALLOW_LOCAL_WEBHOOKS` | `true` | Allow local webhooks |

## Endpoints

- **API**: `http://<server>:3002`
- **Scrape**: `POST http://<server>:3002/v1/scrape`
- **Crawl**: `POST http://<server>:3002/v1/crawl`
- **Search**: `POST http://<server>:3002/v1/search`
- **Queue Admin**: `http://<server>:3002/admin/<BULL_AUTH_KEY>/queues`

## Quick Test

```bash
curl -X POST http://localhost:3002/v1/scrape \
  -H 'Content-Type: application/json' \
  -d '{"url": "https://example.com"}'
```

## Auto-blog Integration

Once running, add the API URL to your auto-blog platform config:

- **URL**: `http://<your-firecrawl-server>:3002`
- No API key needed for self-hosted instances (SDK-compatible)
