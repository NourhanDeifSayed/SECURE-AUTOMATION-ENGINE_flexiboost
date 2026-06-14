# Disaster Recovery Runbook

## Purpose
Describe the objective of disaster recovery procedures.

## Recovery Objectives
- RPO: 15 minutes
- RTO: 1 hour

## Preconditions
- Docker installed
- Database backups available
- Secrets available

## Recovery Procedure
1. Stop affected services.
2. Restore PostgreSQL backup.
3. Restore Redis persistence if applicable.
4. Redeploy containers:
   docker-compose -f docker-compose.prod.yml up -d
5. Verify application health.

## Verification
- /health returns 200
- Prometheus targets are UP
- Workflows execute successfully

## Rollback
- Revert to previous backup snapshot.