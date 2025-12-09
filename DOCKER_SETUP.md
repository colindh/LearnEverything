# Docker PostgreSQL Setup for LearnEverything

This project includes a dockerized PostgreSQL database setup for local development.

## Quick Start

### 1. Prerequisites
- Docker and Docker Compose installed
- Clone/navigate to the project directory

### 2. Start the Database

```bash
# Start PostgreSQL and Adminer containers in the background
docker-compose up -d

# View logs
docker-compose logs -f postgres
```

### 3. Verify the Database is Running

```bash
# Check container status
docker-compose ps

# Test the connection
docker-compose exec postgres pg_isready
```

### 4. Access the Database

**Using the Adminer Web UI:**
- Open http://localhost:8080 in your browser
- Server: `postgres`
- Username: `postgres`
- Password: `postgres`
- Database: `learn_everything`

**Using psql CLI:**
```bash
docker-compose exec postgres psql -U postgres -d learn_everything
```

**From your application:**
- The `DATABASE_URL` is already set in `.env.local`
- Your app can connect directly during development

### 5. Run Database Migrations

```bash
# Push schema changes to the database
npm run db:push

# This uses the DATABASE_URL from .env.local
```

### 6. Seed the Database (Optional)

Add seed data by running SQL scripts:
```bash
# Copy a SQL file into the container and execute it
docker-compose exec postgres psql -U postgres -d learn_everything < path/to/seed.sql
```

## Environment Variables

The setup uses environment variables from `.env.local`:

- `DB_USER` - PostgreSQL username (default: postgres)
- `DB_PASSWORD` - PostgreSQL password (default: postgres)
- `DB_NAME` - Database name (default: learn_everything)
- `DB_PORT` - PostgreSQL port (default: 5432)
- `DATABASE_URL` - Full connection string for the application

## Common Commands

### Start containers
```bash
docker-compose up -d
```

### Stop containers
```bash
docker-compose down
```

### Stop containers and remove data
```bash
docker-compose down -v
```

### View logs
```bash
docker-compose logs -f postgres
docker-compose logs -f adminer
```

### Access PostgreSQL shell
```bash
docker-compose exec postgres psql -U postgres -d learn_everything
```

### Reset the database (remove all data)
```bash
docker-compose down -v
docker-compose up -d
```

## Development Workflow

1. **First time setup:**
   ```bash
   docker-compose up -d
   npm install
   npm run db:push
   npm run dev
   ```

2. **Daily development:**
   ```bash
   npm run dev
   # Database is already running from previous session
   ```

3. **Make schema changes:**
   - Edit `shared/schema.ts`
   - Run `npm run db:push`
   - Restart the dev server if needed

## Troubleshooting

### Database won't start
```bash
# Check logs
docker-compose logs postgres

# Remove and recreate
docker-compose down -v
docker-compose up -d
```

### Connection refused
- Wait 10 seconds after starting (health check passes)
- Verify DATABASE_URL in `.env.local` is correct
- Check if port 5432 is not in use: `lsof -i :5432`

### Password authentication failed
- Verify `DB_USER`, `DB_PASSWORD`, and `DATABASE_URL` match in `.env.local`
- Ensure you've copied `.env.example` to `.env.local`

### Adminer access issues
- Adminer runs on port 8080
- Check if port is available: `lsof -i :8080`

## Production Considerations

For production:
1. Use strong passwords (not "postgres")
2. Consider managed database services (AWS RDS, Google Cloud SQL, etc.)
3. Set up proper backups
4. Use environment-specific configuration
5. Implement proper security groups/firewall rules
6. Use connection pooling for multiple replicas

## Useful Resources

- [PostgreSQL Docker Image](https://hub.docker.com/_/postgres)
- [Docker Compose Documentation](https://docs.docker.com/compose/)
- [Adminer Documentation](https://www.adminer.org/)
- [Drizzle ORM Documentation](https://orm.drizzle.team/)
