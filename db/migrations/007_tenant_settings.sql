CREATE TABLE IF NOT EXISTS tenant_settings (
  tenant_id UUID PRIMARY KEY REFERENCES tenants(id),
  credential_ttl_days INT NOT NULL DEFAULT 90,
  execution_log_ttl_days INT NOT NULL DEFAULT 30,
  audit_log_ttl_days INT NOT NULL DEFAULT 365,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE ON tenant_settings TO app_user;