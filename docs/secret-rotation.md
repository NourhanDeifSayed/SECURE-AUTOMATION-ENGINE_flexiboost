# Secret Rotation Runbook

## Purpose
Rotate application secrets without service disruption.

## Scope
- JWT Secret
- Encryption Key
- Database Passwords

## Procedure
1. Generate new secret.
2. Update files under ./secrets.
3. Restart affected services:
   docker-compose -f docker-compose.prod.yml up -d
4. Verify authentication.

## Verification
- Login succeeds.
- Existing workflows execute.

## Rollback
Restore previous secret files and restart services.