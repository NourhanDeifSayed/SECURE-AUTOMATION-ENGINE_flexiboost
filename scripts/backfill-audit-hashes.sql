DO $$
DECLARE
  r RECORD;
  last_hash TEXT := NULL;
  last_tenant UUID := NULL;
  computed_hash TEXT;
BEGIN
  FOR r IN
    SELECT *
    FROM audit_log
    ORDER BY tenant_id, occurred_at, id
  LOOP
    IF last_tenant IS NULL OR last_tenant <> r.tenant_id THEN
      last_hash := NULL;
      last_tenant := r.tenant_id;
    END IF;

    computed_hash := compute_audit_log_hash(
      last_hash,
      r.tenant_id,
      r.actor_user_id,
      r.action,
      r.resource_type,
      r.resource_id,
      r.occurred_at
    );

    UPDATE audit_log
    SET previous_hash = last_hash,
        current_hash = computed_hash
    WHERE tenant_id = r.tenant_id
      AND id = r.id;

    last_hash := computed_hash;
  END LOOP;
END $$;