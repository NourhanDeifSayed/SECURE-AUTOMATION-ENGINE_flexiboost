CREATE EXTENSION IF NOT EXISTS pgcrypto;

ALTER TABLE audit_log
ADD COLUMN IF NOT EXISTS previous_hash TEXT,
ADD COLUMN IF NOT EXISTS current_hash TEXT,
ADD COLUMN IF NOT EXISTS archived_at TIMESTAMPTZ;

CREATE OR REPLACE FUNCTION compute_audit_log_hash(
  previous_hash_input TEXT,
  tenant_id_input UUID,
  actor_user_id_input UUID,
  action_input TEXT,
  resource_type_input TEXT,
  resource_id_input UUID,
  occurred_at_input TIMESTAMPTZ
)
RETURNS TEXT
LANGUAGE sql
AS $$
  SELECT encode(
    digest(
      coalesce(previous_hash_input, '') ||
      tenant_id_input::TEXT ||
      coalesce(actor_user_id_input::TEXT, '') ||
      action_input ||
      resource_type_input ||
      coalesce(resource_id_input::TEXT, '') ||
      occurred_at_input::TEXT,
      'sha256'
    ),
    'hex'
  );
$$;

CREATE OR REPLACE FUNCTION set_audit_log_hash()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
DECLARE
  last_hash TEXT;
BEGIN
  SELECT current_hash
  INTO last_hash
  FROM audit_log
  WHERE tenant_id = NEW.tenant_id
  ORDER BY occurred_at DESC
  LIMIT 1;

  NEW.previous_hash := last_hash;

  NEW.current_hash := compute_audit_log_hash(
    NEW.previous_hash,
    NEW.tenant_id,
    NEW.actor_user_id,
    NEW.action,
    NEW.resource_type,
    NEW.resource_id,
    NEW.occurred_at
  );

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_set_audit_log_hash ON audit_log;

CREATE TRIGGER trg_set_audit_log_hash
BEFORE INSERT ON audit_log
FOR EACH ROW
EXECUTE FUNCTION set_audit_log_hash();

CREATE INDEX IF NOT EXISTS idx_audit_log_current_hash
ON audit_log (tenant_id, current_hash);

CREATE INDEX IF NOT EXISTS idx_audit_log_archived_at
ON audit_log (archived_at);