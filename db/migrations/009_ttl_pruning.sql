CREATE OR REPLACE FUNCTION prune_expired_execution_logs()
RETURNS TABLE (
  table_name TEXT,
  deleted_count BIGINT
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  WITH deleted_logs AS (
    DELETE FROM execution_logs
    WHERE ttl_delete_after IS NOT NULL
      AND ttl_delete_after < now()
    RETURNING 1
  )
  SELECT 'execution_logs', COUNT(*) FROM deleted_logs;
END;
$$;

REVOKE ALL ON FUNCTION prune_expired_execution_logs() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION prune_expired_execution_logs() TO postgres;