# SECURE-AUTOMATION-ENGINE_flexiboost
# SAE - Local Setup

## Requirements

Install the following:

* Docker Desktop
* Node.js 22+
* npm 10+

Verify installation:

```bash
node -v
npm -v
docker -v
```

---

# Clone Repository

```bash
git clone https://github.com/YOUR_USERNAME/sae.git

cd sae
```

---

# Install Dependencies

```bash
npm install
```

---

# Start Infrastructure

Start PostgreSQL and Redis:

```bash
docker compose up -d
```

Verify containers:

```bash
docker ps
```

Expected containers:

```txt
sae_postgres
sae_redis
```

---

# Apply Database Migrations

Run migrations in order:

```bash
docker exec -i sae_postgres psql -U postgres -d sae < db/migrations/001_init.sql

docker exec -i sae_postgres psql -U postgres -d sae < db/migrations/002_rls.sql

docker exec -i sae_postgres psql -U postgres -d sae < db/migrations/003_roles.sql

docker exec -i sae_postgres psql -U postgres -d sae < db/migrations/004_indexes.sql
```

---

# Configure Application User

Open PostgreSQL:

```bash
docker exec -it sae_postgres psql -U postgres -d sae
```

Run:

```sql
ALTER ROLE app_user
WITH LOGIN PASSWORD 'app_password';
```

Exit:

```sql
\q
```

---

# Verify Database Access

```bash
docker exec -e PGPASSWORD=app_password \
-it sae_postgres \
psql -U app_user -d sae \
-c "SELECT current_user;"
```

Expected output:

```txt
app_user
```

---

# Start API Gateway

Open a terminal:

```bash
npm run dev:api
```

Expected:

```txt
API Gateway running on http://localhost:3000
```

---

# Start Task Orchestrator

Open another terminal:

```bash
npm run dev:worker
```

Expected:

```txt
Task Orchestrator worker is running...
```

---

# Verify Services

Open:

```txt
http://localhost:3000/health
```

Expected response:

```json
{
  "status": "ok",
  "service": "api-gateway"
}
```

---

# Architecture Components

The project starts the following services:

* PostgreSQL
* Redis
* API Gateway
* BullMQ Worker

Security features enabled:

* Multi-Tenant Isolation
* PostgreSQL Row Level Security (RLS)
* JWT Authentication
* Tenant Context Middleware
* Audit Logging
* Queue Isolation

---

# Current Status

```txt
Phase 1 Secure Core Completed
```
