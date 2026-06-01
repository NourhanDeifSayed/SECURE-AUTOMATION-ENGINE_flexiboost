# SECURE-AUTOMATION-ENGINE_flexiboost

## Requirements

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

## Clone Repository

```bash
git clone https://github.com/NourhanDeifSayed/SECURE-AUTOMATION-ENGINE_flexiboost.git

cd SECURE-AUTOMATION-ENGINE_flexiboost
```

---

## Install Dependencies

```bash
npm install
```

---

## Start Infrastructure

```bash
docker compose up -d
```

Verify containers:

```bash
docker ps
```

Expected:

```txt
sae_postgres
sae_redis
```

---

## Apply Database Migrations

```bash
docker exec -i sae_postgres psql -U postgres -d sae < db/migrations/001_init.sql

docker exec -i sae_postgres psql -U postgres -d sae < db/migrations/002_rls.sql

docker exec -i sae_postgres psql -U postgres -d sae < db/migrations/003_roles.sql

docker exec -i sae_postgres psql -U postgres -d sae < db/migrations/004_indexes.sql
```

---

## Configure Application User

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

## Verify Database Access

```bash
docker exec -e PGPASSWORD=app_password -it sae_postgres psql -U app_user -d sae -c "SELECT current_user;"
```

Expected output:

```txt
app_user
```

---

## Start API Gateway

Open a terminal:

```bash
npm run dev:api
```

Expected:

```txt
API Gateway running on http://localhost:3000
```

---

## Start Task Orchestrator

Open another terminal:

```bash
npm run dev:worker
```

Expected:

```txt
Task Orchestrator worker is running...
```

---

## Verify Services

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

## Components

* PostgreSQL
* Redis
* API Gateway
* BullMQ Worker

---

## Security Features

* Multi-Tenant Isolation
* PostgreSQL RLS
* JWT Authentication
* Tenant Context Middleware
* Audit Logging
* Queue Isolation

---

## Status

Phase 1 Secure Core Completed.


Phase 2 – Secure Integrations & Credential Management

Completed

Implemented Features:

Credential Vault
Credential Encryption at Rest
Credential Retrieval & Decryption
Credential Rotation
Credential Rotation Audit Logging
Webhook Signature Verification
Replay Attack Protection
Generic HTTP Connector
Requirements
Docker Desktop
Node.js 22+
npm 10+

Verify installation:

node -v
npm -v
docker -v
Clone Repository
git clone https://github.com/NourhanDeifSayed/SECURE-AUTOMATION-ENGINE_flexiboost.git

cd SECURE-AUTOMATION-ENGINE_flexiboost
Install Dependencies
npm install
Start Infrastructure
docker compose up -d

Verify containers:

docker ps

Expected:

sae_postgres
sae_redis
Apply Database Migrations
docker exec -i sae_postgres psql -U postgres -d sae < db/migrations/001_init.sql

docker exec -i sae_postgres psql -U postgres -d sae < db/migrations/002_rls.sql

docker exec -i sae_postgres psql -U postgres -d sae < db/migrations/003_roles.sql

docker exec -i sae_postgres psql -U postgres -d sae < db/migrations/004_indexes.sql
Configure Application User

Open PostgreSQL:

docker exec -it sae_postgres psql -U postgres -d sae

Run:

ALTER ROLE app_user
WITH LOGIN PASSWORD 'app_password';

Exit:

\q
Verify Database Access
docker exec -e PGPASSWORD=app_password -it sae_postgres psql -U app_user -d sae -c "SELECT current_user;"

Expected:

app_user
Start API Gateway
npm run dev:api

Expected:

API Gateway running on http://localhost:3000
Start Task Orchestrator
npm run dev:worker

Expected:

Task Orchestrator worker is running...
Verify API Gateway

Open:

http://localhost:3000/health

Expected Response:

{
  "status": "ok",
  "service": "api-gateway"
}
Architecture
User 
