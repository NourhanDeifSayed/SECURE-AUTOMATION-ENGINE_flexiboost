-- SAE Phase 1 - RLS Test Script

-- Test 1: Tenant B cannot read Tenant A data
BEGIN;
SET LOCAL app.current_tenant_id = '22222222-2222-2222-2222-222222222222';
SELECT * FROM workflows;
COMMIT;

-- Expected result:
-- 0 rows


-- Test 2: Tenant B cannot insert data as Tenant A
BEGIN;
SET LOCAL app.current_tenant_id = '22222222-2222-2222-2222-222222222222';

INSERT INTO workflows (
  tenant_id,
  name,
  definition_json,
  status,
  created_by
)
VALUES (
  '11111111-1111-1111-1111-111111111111',
  'Malicious Insert',
  '{}',
  'draft',
  'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb'
);

COMMIT;

-- Expected result:
-- ERROR: new row violates row-level security policy


-- Test 3: Tenant B cannot update Tenant A workflow
BEGIN;
SET LOCAL app.current_tenant_id = '22222222-2222-2222-2222-222222222222';

UPDATE workflows
SET name = 'Hacked By Tenant B'
WHERE tenant_id = '11111111-1111-1111-1111-111111111111';

COMMIT;

-- Expected result:
-- UPDATE 0


-- Test 4: Tenant B cannot delete Tenant A workflow
BEGIN;
SET LOCAL app.current_tenant_id = '22222222-2222-2222-2222-222222222222';

DELETE FROM workflows
WHERE tenant_id = '11111111-1111-1111-1111-111111111111';

COMMIT;

-- Expected result:
-- DELETE 0


-- Test 5: app_user cannot update audit_log
UPDATE audit_log
SET action = 'hacked';

-- Expected result:
-- ERROR: permission denied for table audit_log


-- Test 6: app_user cannot delete audit_log
DELETE FROM audit_log;

-- Expected result:
-- ERROR: permission denied for table audit_log