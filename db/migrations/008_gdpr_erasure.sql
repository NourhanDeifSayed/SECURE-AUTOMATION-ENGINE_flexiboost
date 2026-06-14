CREATE OR REPLACE FUNCTION right_to_erasure(target_tenant_id UUID)
RETURNS TABLE (
  table_name TEXT,
  deleted_count BIGINT
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  WITH deleted_oauth AS (
    DELETE FROM oauth_connections
    WHERE tenant_id = target_tenant_id
    RETURNING 1
  )
  SELECT 'oauth_connections', COUNT(*) FROM deleted_oauth;

  RETURN QUERY
  WITH deleted_settings AS (
    DELETE FROM tenant_settings
    WHERE tenant_id = target_tenant_id
    RETURNING 1
  )
  SELECT 'tenant_settings', COUNT(*) FROM deleted_settings;

  RETURN QUERY
  WITH deleted_rotation_audit AS (
    DELETE FROM credential_rotation_audit
    WHERE tenant_id = target_tenant_id
    RETURNING 1
  )
  SELECT 'credential_rotation_audit', COUNT(*) FROM deleted_rotation_audit;

  RETURN QUERY
  WITH deleted_credentials AS (
    DELETE FROM credential_vault
    WHERE tenant_id = target_tenant_id
    RETURNING 1
  )
  SELECT 'credential_vault', COUNT(*) FROM deleted_credentials;

  RETURN QUERY
  WITH deleted_executions AS (
    DELETE FROM execution_logs
    WHERE tenant_id = target_tenant_id
    RETURNING 1
  )
  SELECT 'execution_logs', COUNT(*) FROM deleted_executions;

  RETURN QUERY
  WITH deleted_webhooks AS (
    DELETE FROM webhook_endpoints
    WHERE tenant_id = target_tenant_id
    RETURNING 1
  )
  SELECT 'webhook_endpoints', COUNT(*) FROM deleted_webhooks;

  RETURN QUERY
  WITH deleted_audit AS (
    DELETE FROM audit_log
    WHERE tenant_id = target_tenant_id
    RETURNING 1
  )
  SELECT 'audit_log', COUNT(*) FROM deleted_audit;

  RETURN QUERY
  WITH deleted_workflows AS (
    DELETE FROM workflows
    WHERE tenant_id = target_tenant_id
    RETURNING 1
  )
  SELECT 'workflows', COUNT(*) FROM deleted_workflows;

  RETURN QUERY
  WITH deleted_users AS (
    DELETE FROM users
    WHERE tenant_id = target_tenant_id
    RETURNING 1
  )
  SELECT 'users', COUNT(*) FROM deleted_users;

  RETURN QUERY
  WITH deleted_tenant AS (
    DELETE FROM tenants
    WHERE id = target_tenant_id
    RETURNING 1
  )
  SELECT 'tenants', COUNT(*) FROM deleted_tenant;
END;
$$;

REVOKE ALL ON FUNCTION right_to_erasure(UUID) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION right_to_erasure(UUID) TO postgres;