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

Run all migrations in order:

```bash
docker exec -i sae_postgres psql -U postgres -d sae < db/migrations/001_init.sql

docker exec -i sae_postgres psql -U postgres -d sae < db/migrations/002_rls.sql

docker exec -i sae_postgres psql -U postgres -d sae < db/migrations/003_roles.sql

docker exec -i sae_postgres psql -U postgres -d sae < db/migrations/004_indexes.sql

docker exec -i sae_postgres psql -U postgres -d sae < db/migrations/005_oauth.sql

docker exec -i sae_postgres psql -U postgres -d sae < db/migrations/006_oauth_refresh_iv.sql
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

# Components

* PostgreSQL
* Redis
* API Gateway
* BullMQ Worker
* Credential Vault
* OAuth Connection Store
* Slack Connector
* Stripe Connector
* Google Workspace Connector
* Generic HTTP Connector

---

# Security Features

* Multi-Tenant Isolation
* PostgreSQL Row Level Security
* JWT Authentication
* Tenant Context Middleware
* Audit Logging
* Queue Isolation
* Credential Encryption at Rest
* OAuth Token Encryption
* Access Token Refresh
* Refresh Token Rotation
* Webhook HMAC Verification
* Replay Attack Protection

---

# Phase 1 — Secure Core

## Status

Completed.

## Implemented

* PostgreSQL schema with tenant isolation
* Row Level Security policies
* JWT authentication
* Tenant context middleware
* Audit log protection
* BullMQ and Redis worker execution
* Tenant-scoped queue processing
* Workflow execution logging

---

# Phase 2 — Secure Credentials, OAuth, Webhooks, and Connectors

## Status

Completed.

---

## Completed Phase 2 Features

### 1. Credential Vault

The Credential Vault stores third-party secrets such as API keys.

Implemented:

* Create credential
* List credentials
* Retrieve credential
* Decrypt credential
* Delete credential

Endpoints:

```http
POST /vault
GET /vault
GET /vault/:id
DELETE /vault/:id
```

---

### 2. Credential Encryption at Rest

Secrets are encrypted before they are saved in PostgreSQL.

The database stores:

* encrypted_payload
* iv

The database does not store plaintext secrets.

---

### 3. Credential Rotation

Credential Rotation allows replacing an old secret with a new secret without deleting the credential record.

Endpoint:

```http
POST /vault/:id/rotate
```

The rotation process:

* Receives a new secret
* Encrypts the new secret
* Updates the encrypted payload
* Updates the IV
* Updates the rotated_at timestamp

---

### 4. Credential Rotation Audit Logging

Every credential rotation is logged.

Audit records include:

* credential_id
* tenant_id
* rotated_by
* rotated_at

Table:

```sql
credential_rotation_audit
```

---

### 5. Webhook HMAC Verification

Incoming webhooks are verified using HMAC-SHA256.

Endpoint:

```http
POST /webhooks/test
```

Validation rules:

* Missing signature is rejected
* Invalid signature is rejected
* Valid signature is accepted

Header:

```http
x-signature
```

---

### 6. Replay Attack Prevention

Replay protection prevents the same webhook from being processed more than once.

Implementation:

* Redis stores webhook IDs temporarily
* First request is accepted
* Duplicate request with the same ID is rejected

---

### 7. Generic HTTP Connector

The Generic HTTP Connector sends HTTP requests.

Endpoint:

```http
POST /connectors/http/test
```

Supported methods:

* GET
* POST
* PUT
* DELETE

---

### 8. OAuth2 Authorization Flow

OAuth connections can be created and stored per tenant.

Endpoint:

```http
POST /oauth/:provider/connect
```

Supported providers in Phase 2:

* slack
* stripe
* google

OAuth tokens are encrypted before storage.

---

### 9. OAuth Connection Listing

OAuth connections can be listed by provider.

Endpoint:

```http
GET /oauth/:provider/connections
```

---

### 10. Access Token Refresh

Stored OAuth connections support access token refresh.

Endpoint:

```http
POST /oauth/:connectionId/refresh
```

---

### 11. Refresh Token Rotation

When a token refresh occurs:

* A new access token is generated
* A new refresh token is generated
* The new tokens are encrypted
* The old encrypted tokens are replaced
* updated_at is updated
* expires_at is renewed

---

### 12. OAuth Audit Logging

OAuth actions are written to audit_log.

Logged actions:

```txt
oauth.connected
oauth.token_refreshed
```

---

### 13. Slack Connector

The Slack connector uses a stored Slack OAuth connection.

Endpoint:

```http
POST /connectors/slack/message
```

Implemented behavior:

* Retrieves Slack OAuth connection
* Decrypts Slack access token
* Validates message payload
* Preserves tenant isolation
* Simulates Slack message delivery

---

### 14. Stripe Connector

The Stripe connector uses a stored Stripe OAuth connection.

Endpoint:

```http
POST /connectors/stripe/customers
```

Implemented behavior:

* Retrieves Stripe OAuth connection
* Decrypts Stripe access token
* Validates customer payload
* Preserves tenant isolation
* Simulates Stripe customer creation

---

### 15. Google Workspace Connector

The Google Workspace connector uses a stored Google OAuth connection.

Endpoint:

```http
POST /connectors/google/sheets/append
```

Implemented behavior:

* Retrieves Google OAuth connection
* Decrypts Google access token
* Validates spreadsheet append payload
* Preserves tenant isolation
* Simulates Google Sheets row append

---

# Phase 2 Test Summary

Completed tests:

* Credential creation
* Encrypted credential storage
* Credential retrieval and decryption
* Credential rotation
* Credential rotation audit logging
* Webhook missing signature rejection
* Webhook invalid signature rejection
* Webhook valid signature acceptance
* Replay attack prevention
* Generic HTTP connector
* OAuth connection creation
* OAuth connection listing
* Access token refresh
* Refresh token rotation
* OAuth audit verification
* Slack connector message execution
* Stripe connector customer creation
* Google Sheets append execution

---

# Phase 2 Final Status

Completed:

* Credential Vault
* Credential Encryption
* Credential Retrieval and Decryption
* Credential Rotation
* Credential Rotation Audit Logging
* Webhook HMAC Verification
* Replay Attack Prevention
* Generic HTTP Connector
* OAuth2 Authorization Flow
* Access Token Refresh
* Refresh Token Rotation
* OAuth Audit Logging
* Slack Connector
* Stripe Connector
* Google Workspace Connector

Remaining:

```txt
None
```

Current status:

```txt
Phase 1 Secure Core Completed
Phase 2 OAuth and Connector Integrations Completed
```
