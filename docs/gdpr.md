# Tenant Erasure Runbook

## Purpose
Execute GDPR Right to Erasure.

## Preconditions
- Admin approval documented.

## Procedure
1. Verify tenant identifier.
2. Execute:
   SELECT * FROM right_to_erasure('<tenant-id>');
3. Record deletion evidence.

## Verification
- Tenant count = 0
- User count = 0
- Workflow count = 0

## Rollback
Not applicable after approved deletion.