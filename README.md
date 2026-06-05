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




# Phase 2 README – Secure Automation Engine

## Phase 2 Scope

Phase 2 focuses on secure credential management, webhook security, replay protection, and connector integration.

This README explains:

1. What Phase 2 features were implemented.
2. How to run the project after Phase 2 updates.
3. How to test each Phase 2 feature step by step.

---

# Completed Phase 2 Features

## 1. Credential Vault

The Credential Vault is used to store third-party secrets such as API keys.

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

## 2. Credential Encryption at Rest

Secrets are encrypted before they are saved in PostgreSQL.

The database stores:

* encrypted_payload
* iv

The database does not store the original plaintext secret.

---

## 3. Credential Retrieval and Decryption

Stored credentials can be retrieved by ID.

The system:

1. Reads the encrypted credential from PostgreSQL.
2. Decrypts the secret.
3. Returns the secret only to an authorized request.

Endpoint:

```http
GET /vault/:id
```

---

## 4. Credential Rotation

Credential Rotation allows replacing an old secret with a new secret without deleting the credential record.

Endpoint:

```http
POST /vault/:id/rotate
```

The rotation process:

1. Receives a new secret.
2. Encrypts the new secret.
3. Updates the encrypted payload.
4. Updates the IV.
5. Updates the rotated_at timestamp.

---

## 5. Credential Rotation Audit Logging

Every credential rotation is logged in a dedicated audit table.

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

## 6. Webhook HMAC Verification

Incoming webhooks are verified using HMAC-SHA256.

Endpoint:

```http
POST /webhooks/test
```

Validation rules:

* Missing signature is rejected.
* Invalid signature is rejected.
* Valid signature is accepted.

Header used:

```http
x-signature
```

---

## 7. Replay Attack Prevention

Replay protection prevents the same webhook from being processed more than once.

Implementation:

* Redis stores webhook IDs temporarily.
* First request is accepted.
* Duplicate request with the same ID is rejected.

---

## 8. Generic HTTP Connector

A Generic HTTP Connector was implemented to send HTTP requests.

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

# Requirements

Install:

* Docker Desktop
* Node.js 22+
* npm 10+

Check versions:

```bash
node -v
npm -v
docker -v
```

---

# Step 1 – Install Dependencies

From the project root:

```bash
npm install
```

---

# Step 2 – Start Docker Services

Start PostgreSQL and Redis:

```bash
docker compose up -d
```

Check containers:

```bash
docker ps
```

Expected containers:

```text
sae_postgres
sae_redis
```

---

# Step 3 – Check Docker PostgreSQL Port

After Phase 2 fixes, PostgreSQL should run on host port:

```text
15432
```

Check:

```bash
docker ps
```

Expected:

```text
0.0.0.0:15432->5432/tcp
```

If PostgreSQL still uses port 5432 and conflicts with local Windows PostgreSQL, update docker-compose.yml:

```yaml
ports:
  - "15432:5432"
```

Then restart:

```bash
docker compose down
docker compose up -d
```

---

# Step 4 – Apply Database Migrations

Run migrations:

```bash
docker exec -i sae_postgres psql -U postgres -d sae < db/migrations/001_init.sql

docker exec -i sae_postgres psql -U postgres -d sae < db/migrations/002_rls.sql

docker exec -i sae_postgres psql -U postgres -d sae < db/migrations/003_roles.sql

docker exec -i sae_postgres psql -U postgres -d sae < db/migrations/004_indexes.sql
```

---

# Step 5 – Configure app_user Password

Run:

```bash
docker exec -it sae_postgres psql -U postgres -d sae
```

Inside PostgreSQL:

```sql
ALTER ROLE app_user WITH LOGIN PASSWORD 'app_password';
```

Exit:

```sql
\q
```

---

# Step 6 – Create Test Tenant

Run:

```bash
docker exec -it sae_postgres psql -U postgres -d sae -c "INSERT INTO tenants (id, name, plan_tier, data_region) VALUES ('22222222-2222-2222-2222-222222222222', 'Test Tenant', 'starter', 'eu-west-1') ON CONFLICT (id) DO NOTHING;"
```

---

# Step 7 – Create Credential Rotation Audit Table

Run:

```bash
docker exec -it sae_postgres psql -U postgres -d sae -c "CREATE TABLE IF NOT EXISTS credential_rotation_audit (id UUID PRIMARY KEY DEFAULT gen_random_uuid(), credential_id UUID NOT NULL, tenant_id UUID NOT NULL, rotated_by UUID, rotated_at TIMESTAMPTZ NOT NULL DEFAULT NOW());"
```

Grant permissions:

```bash
docker exec -it sae_postgres psql -U postgres -d sae -c "GRANT INSERT, SELECT ON credential_rotation_audit TO app_user;"
```

---

# Step 8 – Verify app_user Database Access

Run:

```bash
docker exec -e PGPASSWORD=app_password -it sae_postgres psql -U app_user -d sae -c "SELECT current_user;"
```

Expected:

```text
app_user
```

---

# Step 9 – Start API Gateway

In terminal 1:

```bash
npm run dev:api
```

Expected:

```text
API Gateway running on http://localhost:3000
```

Keep this terminal open.

---

# Step 10 – Verify API Health

In terminal 2:

```powershell
Invoke-RestMethod http://localhost:3000/health
```

Expected:

```json
{
  "status": "ok",
  "service": "api-gateway"
}
```

---

# Step 11 – Generate JWT Token

Run in terminal 2:

```powershell
$loginBody = @{
  userId = "11111111-1111-1111-1111-111111111111"
  tenantId = "22222222-2222-2222-2222-222222222222"
  role = "admin"
} | ConvertTo-Json

$response = Invoke-RestMethod `
  -Method POST `
  -Uri http://localhost:3000/auth/dev-login `
  -ContentType "application/json" `
  -Body $loginBody

$token = $response.accessToken
$token
```

Use the generated token in the next requests.

---

# Step 12 – Test Credential Creation

Run:

```powershell
$vaultBody = @{
  service_name = "test-service"
  secret = "my-secret-api-key-123"
  tenant_id = "22222222-2222-2222-2222-222222222222"
} | ConvertTo-Json

Invoke-RestMethod `
  -Method POST `
  -Uri http://localhost:3000/vault `
  -ContentType "application/json" `
  -Headers @{ Authorization = "Bearer $token" } `
  -Body $vaultBody
```

Expected:

```text
id
tenant_id
service_name
created_at
```

Save the returned credential id for later tests.

---

# Step 13 – Verify Encrypted Storage in Database

Run:

```bash
docker exec -it sae_postgres psql -U postgres -d sae -c "SELECT service_name, encrypted_payload, iv FROM credential_vault;"
```

Expected:

* encrypted_payload should contain unreadable encrypted text.
* iv should contain a generated value.
* The plaintext secret should not appear.

---

# Step 14 – Test Tenant Isolation

Run as app_user without tenant context:

```bash
docker exec -it sae_postgres psql -U app_user -d sae -c "SELECT service_name, encrypted_payload, iv FROM credential_vault;"
```

Expected:

```text
0 rows
```

Run with tenant context:

```bash
docker exec -it sae_postgres psql -U app_user -d sae -c "SET app.current_tenant_id = '22222222-2222-2222-2222-222222222222'; SELECT service_name, encrypted_payload, iv FROM credential_vault;"
```

Expected:

* The credential should appear.

---

# Step 15 – Test Credential Listing

Run:

```powershell
Invoke-RestMethod `
  -Method GET `
  -Uri "http://localhost:3000/vault?tenant_id=22222222-2222-2222-2222-222222222222" `
  -Headers @{ Authorization = "Bearer $token" }
```

Expected:

* Credential metadata should be returned.

---

# Step 16 – Test Credential Retrieval and Decryption

Replace CREDENTIAL_ID with the real id returned from credential creation.

```powershell
Invoke-RestMethod `
  -Method GET `
  -Uri "http://localhost:3000/vault/CREDENTIAL_ID?tenant_id=22222222-2222-2222-2222-222222222222" `
  -Headers @{ Authorization = "Bearer $token" }
```

Expected:

```text
secret = my-secret-api-key-123
```

---

# Step 17 – Test Credential Rotation

Replace CREDENTIAL_ID with the real credential id.

```powershell
$rotateBody = @{
  tenant_id = "22222222-2222-2222-2222-222222222222"
  user_id = "11111111-1111-1111-1111-111111111111"
  new_secret = "rotated-secret-456"
} | ConvertTo-Json

Invoke-RestMethod `
  -Method POST `
  -Uri "http://localhost:3000/vault/CREDENTIAL_ID/rotate" `
  -ContentType "application/json" `
  -Headers @{ Authorization = "Bearer $token" } `
  -Body $rotateBody
```

Expected:

```text
Credential rotated successfully
```

---

# Step 18 – Verify Rotation Audit Log

Run:

```bash
docker exec -it sae_postgres psql -U postgres -d sae -c "SELECT credential_id, tenant_id, rotated_by, rotated_at FROM credential_rotation_audit ORDER BY rotated_at DESC;"
```

Expected:

* A row should appear for the rotation event.

---

# Step 19 – Test Webhook Missing Signature

Run:

```powershell
$payloadRaw = '{"event":"credential.created","id":"missing-signature-test"}'

Invoke-RestMethod `
  -Method POST `
  -Uri http://localhost:3000/webhooks/test `
  -ContentType "application/json" `
  -Body $payloadRaw
```

Expected:

```json
{
  "error": "Missing signature"
}
```

---

# Step 20 – Test Webhook Invalid Signature

Run:

```powershell
Invoke-RestMethod `
  -Method POST `
  -Uri http://localhost:3000/webhooks/test `
  -ContentType "application/json" `
  -Headers @{ "x-signature" = "wrong-signature" } `
  -Body $payloadRaw
```

Expected:

```json
{
  "error": "Invalid signature"
}
```

---

# Step 21 – Test Webhook Valid Signature

Run:

```powershell
$payloadRaw = '{"event":"credential.created","id":"valid-signature-test"}'

$hmac = New-Object System.Security.Cryptography.HMACSHA256
$hmac.Key = [Text.Encoding]::UTF8.GetBytes("phase2-webhook-secret")
$hash = $hmac.ComputeHash([Text.Encoding]::UTF8.GetBytes($payloadRaw))
$signature = ($hash | ForEach-Object { $_.ToString("x2") }) -join ""

Invoke-RestMethod `
  -Method POST `
  -Uri http://localhost:3000/webhooks/test `
  -ContentType "application/json" `
  -Headers @{ "x-signature" = $signature } `
  -Body $payloadRaw
```

Expected:

```text
status = accepted
verified = True
```

---

# Step 22 – Test Replay Attack Protection

Run the same signed request twice using the same id.

```powershell
$payloadRaw = '{"event":"credential.created","id":"replay-test-001"}'

$hmac = New-Object System.Security.Cryptography.HMACSHA256
$hmac.Key = [Text.Encoding]::UTF8.GetBytes("phase2-webhook-secret")
$hash = $hmac.ComputeHash([Text.Encoding]::UTF8.GetBytes($payloadRaw))
$signature = ($hash | ForEach-Object { $_.ToString("x2") }) -join ""

Invoke-RestMethod `
  -Method POST `
  -Uri http://localhost:3000/webhooks/test `
  -ContentType "application/json" `
  -Headers @{ "x-signature" = $signature } `
  -Body $payloadRaw
```

Expected first response:

```text
status = accepted
verified = True
replayProtected = True
```

Run the same request again:

```powershell
Invoke-RestMethod `
  -Method POST `
  -Uri http://localhost:3000/webhooks/test `
  -ContentType "application/json" `
  -Headers @{ "x-signature" = $signature } `
  -Body $payloadRaw
```

Expected second response:

```json
{
  "error": "Duplicate webhook rejected"
}
```

---

# Step 23 – Test Generic HTTP Connector

Run:

```powershell
$body = @{
  method = "GET"
  url = "http://localhost:3000/health"
} | ConvertTo-Json

Invoke-RestMethod `
  -Method POST `
  -Uri http://localhost:3000/connectors/http/test `
  -ContentType "application/json" `
  -Headers @{ Authorization = "Bearer $token" } `
  -Body $body
```

Expected:

```text
success = True
status = 200
statusText = OK
responseBody = {"status":"ok","service":"api-gateway"}
```

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

Remaining:

* OAuth2 Authorization Flow
* Access Token Refresh
* Refresh Token Rotation
* Slack Connector
* Stripe Connector
* Google Workspace Connector

Estimated Phase 2 completion:

```text
80% - 85%
```

