# Docker Setup

## Quick Start

Build and run the API server:

```bash
docker-compose up --build -d
```

The API will be available at `http://localhost:3001`

## API Endpoints

- `GET /api/health` - Health check
- `GET /api/versions` - List available Bible versions
- `GET /api/books` - List available books
- `GET /api/verses?reference=Matthew+1:1&version=ACF` - Get verses
- `GET /api/search?q=love&version=ACF` - Search verses

## Available Versions

- `ACF` - Almeida Corrigida Fiel (Portuguese)
- `BYZ` - Byzantine Text
- `EMTV` - English Majority Text Version
- `WPNT` - Word Pictures New Testament
- `ITARIVE` - Italian Riveduta
- `FREMRTN` - French Martin
- `ISV` - International Standard Version

## Building Manually

```bash
# Build image
docker build -t bible-api .

# Run container
docker run -d -p 3001:3001 --name bible-api bible-api
```

## Running the Discord Bot

To run the Discord bot instead of the API server:

```bash
docker run -d \
  -e DISCORD_TOKEN=your_token_here \
  -e NODE_ENV=production \
  bible-api \
  node index.js
```

Or use docker-compose with command override:

```yaml
services:
  bible-bot:
    build: .
    command: node index.js
    environment:
      - DISCORD_TOKEN=your_token_here
```

## Logs

```bash
# View logs
docker-compose logs -f

# View specific service logs
docker logs bible-api -f
```

## Stopping

```bash
docker-compose down
```

## Troubleshooting

If you encounter SQLite database errors:
- Ensure database files exist in `db/*/` directories
- Check file permissions are correct (755)
- The databases are bundled in the image for production use
