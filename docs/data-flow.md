# FlexiBoost Data Flow Architecture

## Purpose

This document describes the FlexiBoost data flow architecture for DPA review, client onboarding, security questionnaires, and production readiness documentation.

FlexiBoost is a secure multi-tenant workflow automation platform that allows operators to build workflows, manage encrypted credentials, execute automation jobs, and monitor execution history while enforcing tenant isolation and compliance controls.

---

## Actors

| Actor | Description 
|-------|-----------------------------------------------------------------------------------------
| Operator | Uses the Web UI to build workflows, configure nodes, and monitor execution history. |
| Tenant Admin | Manages tenant settings, TTL policies, team members, roles, and credentials. |
| External SaaS Providers | Third-party systems integrated through connectors such as Slack, Stripe, Google Sheets, and HTTP APIs. |
| Task Orchestrator Worker | Background worker responsible for processing queued workflow execution jobs. |
| Security / Compliance Reviewer | Reviews data flow, access controls, retention policies, and audit evidence. |

---

## High-Level Architecture

```mermaid
flowchart TD
    Operator[Operator / Tenant Admin] --> WebUI[React Web UI]

    WebUI -->|HTTPS + JWT| APIGateway[API Gateway]

    APIGateway -->|Tenant-scoped SQL| Postgres[(PostgreSQL)]
    APIGateway -->|Queue workflow execution| Redis[(Redis / BullMQ)]
    APIGateway -->|Encrypted credential operations| Vault[Credential Vault]
    APIGateway -->|Write audit events| AuditLog[Audit Log]

    Redis --> Worker[Task Orchestrator Worker]
    Worker -->|Read workflow definition| Postgres
    Worker -->|Write execution result| Postgres
    Worker -->|Invoke actions| Connectors[External Connectors]

    Connectors --> Slack[Slack]
    Connectors --> Stripe[Stripe]
    Connectors --> Google[Google Sheets]
    Connectors --> HTTP[HTTP APIs]

    AuditLog -->|Hash chained archive| WORM[WORM Archive]
    Postgres -->|TTL pruning| Pruning[TTL Pruning Job]
    Postgres -->|Right to erasure| GDPR[GDPR Erasure Utility]