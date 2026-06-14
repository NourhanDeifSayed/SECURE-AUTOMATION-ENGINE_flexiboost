# SECURE-AUTOMATION-ENGINE_flexiboost

Secure multi-tenant workflow automation platform designed with enterprise-grade security, compliance, monitoring, and operational controls.

---

## Overview

SECURE-AUTOMATION-ENGINE_flexiboost is a secure automation platform that enables organizations to execute workflows across external systems while maintaining strict tenant isolation, encrypted credential management, auditability, and regulatory compliance.

The platform provides:

* Multi-tenant workflow execution
* Secure credential storage and rotation
* OAuth integrations
* Connector framework
* BullMQ-based orchestration
* Comprehensive audit logging
* GDPR compliance controls
* Production monitoring
* Enterprise deployment support

---

## Architecture

### Core Components

* Web UI
* API Gateway
* PostgreSQL
* Redis
* BullMQ Task Orchestrator
* Credential Vault
* OAuth Connection Store
* Connector Framework
* Audit Logging Engine
* Prometheus Monitoring

### High-Level Data Flow

Operator → Web UI → API Gateway

API Gateway → PostgreSQL

API Gateway → Credential Vault

API Gateway → Redis → Task Orchestrator → External Connectors

API Gateway → Audit Log → WORM Archive

---

## Technology Stack

### Backend

* Node.js
* TypeScript
* Express
* PostgreSQL
* Redis
* BullMQ

### Frontend

* React
* Vite

### Infrastructure

* Docker
* Docker Compose
* Prometheus

---

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

Development:

```bash
docker compose up -d
```

Production:

```bash
docker-compose -f docker-compose.prod.yml up -d
```

Verify containers:

```bash
docker ps
```

---

## Database Setup

Apply migrations in sequence:

```bash
docker exec -i sae_postgres psql -U postgres -d sae < db/migrations/001_init.sql
docker exec -i sae_postgres psql -U postgres -d sae < db/migrations/002_rls.sql
docker exec -i sae_postgres psql -U postgres -d sae < db/migrations/003_roles.sql
docker exec -i sae_postgres psql -U postgres -d sae < db/migrations/004_indexes.sql
docker exec -i sae_postgres psql -U postgres -d sae < db/migrations/005_oauth.sql
docker exec -i sae_postgres psql -U postgres -d sae < db/migrations/006_oauth_refresh_iv.sql
docker exec -i sae_postgres psql -U postgres -d sae < db/migrations/007_tenant_settings.sql
docker exec -i sae_postgres psql -U postgres -d sae < db/migrations/008_gdpr_erasure.sql
docker exec -i sae_postgres psql -U postgres -d sae < db/migrations/009_ttl_pruning.sql
docker exec -i sae_postgres psql -U postgres -d sae < db/migrations/010_audit_hash_chain.sql
```

---

## Local Development

Start API Gateway:

```bash
npm run dev:api
```

Start Worker:

```bash
npm run dev:worker
```

Start Web UI:

```bash
npm run dev:web
```

---

## Health and Monitoring

Health Endpoint:

```http
GET /health
```

Metrics Endpoint:

```http
GET /metrics
```

Prometheus:

```
http://localhost:9090
```

Web UI:

```
http://localhost:5173
```

API Gateway:

```
http://localhost:3000
```

---

## Security Features

* Multi-Tenant Isolation
* PostgreSQL Row Level Security (RLS)
* JWT Authentication
* Tenant Context Middleware
* Restricted CORS Configuration
* Audit Logging
* Queue Isolation
* Credential Encryption at Rest
* AES-Based Secret Protection
* OAuth Token Encryption
* Access Token Refresh
* Refresh Token Rotation
* Credential Rotation
* Credential Rotation Audit Logging
* Webhook HMAC Verification
* Replay Attack Protection
* Security Penetration Testing

---

## Compliance Features

### GDPR Right to Erasure

Supports deletion of tenant-specific data across all relevant tables.

Verification script:

```bash
scripts/test-gdpr-erasure.ps1
```

---

### TTL Data Retention

Execution logs are automatically pruned after their retention period expires.

Verification script:

```bash
scripts/test-ttl-pruning.ps1
```

---

### Audit Hash Chaining

Audit records are cryptographically chained to detect tampering.

Backfill script:

```bash
scripts/backfill-audit-hashes.ps1
```

---

### WORM Audit Archival

Audit logs can be exported to immutable archive storage.

Archive script:

```bash
scripts/archive-audit-log.ps1
```

---

## Connectors

Implemented connectors include:

* Generic HTTP Connector
* Slack Connector
* Stripe Connector
* Google Workspace Connector

---

## OAuth Support

Supported providers:

* Slack
* Stripe
* Google

Capabilities:

* OAuth connection creation
* OAuth connection listing
* Access token refresh
* Refresh token rotation
* Encrypted token storage

---

## Administrative Features

* Tenant administration APIs
* Execution log APIs
* Credential management
* Workflow monitoring
* Audit visibility

---

## Testing and Verification

Security verification:

```bash
scripts/security-pen-test.ps1
```

GDPR verification:

```bash
scripts/test-gdpr-erasure.ps1
```

TTL verification:

```bash
scripts/test-ttl-pruning.ps1
```

---

## Project Status

### Phase 1 – Secure Core

Completed.

Implemented:

* Tenant isolation
* RLS enforcement
* JWT authentication
* BullMQ orchestration
* Audit logging
* Workflow execution logging

---

### Phase 2 – Credentials, OAuth, Webhooks, and Connectors

Completed.

Implemented:

* Credential Vault
* Credential Encryption
* Credential Rotation
* OAuth Integrations
* OAuth Token Refresh
* Connector Framework
* Replay Protection
* Webhook Verification

---

### Phase 3 – Operations and Administration

Completed.

Implemented:

* Administration APIs
* Execution APIs
* Web UI
* Monitoring Integration

---

### Phase 4 – Compliance, Monitoring, and Production Readiness

Completed.

Implemented:

* GDPR Erasure
* TTL Pruning
* Audit Hash Chaining
* WORM Archival
* Prometheus Metrics
* Security Penetration Tests
* Production Docker Deployment
* Operational Documentation

---

