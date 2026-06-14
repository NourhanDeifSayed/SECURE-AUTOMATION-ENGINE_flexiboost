# RLS Verification Runbook

## Purpose
Validate tenant isolation.

## Procedure
1. Set tenant context:
   SELECT set_config('app.current_tenant_id', '<tenant-id>', true);

2. Query protected tables.

3. Attempt cross-tenant access.

## Verification
- Only current tenant data visible.
- Cross-tenant access denied.

## Rollback
Clear session context.