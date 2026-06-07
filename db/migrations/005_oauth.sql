CREATE TABLE IF NOT EXISTS oauth_connections (
  id UUID DEFAULT uuid_generate_v4(),
  tenant_id UUID NOT NULL REFERENCES tenants(id),
  provider TEXT NOT NULL,
  external_account_id TEXT,
  access_token_encrypted TEXT NOT NULL,
  refresh_token_encrypted TEXT,
  token_iv TEXT NOT NULL,
  expires_at TIMESTAMPTZ,
  scopes TEXT[],
  created_by UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (tenant_id, id)
);

ALTER TABLE oauth_connections ENABLE ROW LEVEL SECURITY;
ALTER TABLE oauth_connections FORCE ROW LEVEL SECURITY;

CREATE POLICY oauth_connections_tenant_policy
ON oauth_connections
USING (tenant_id = current_setting('app.current_tenant_id', true)::uuid)
WITH CHECK (tenant_id = current_setting('app.current_tenant_id', true)::uuid);

GRANT SELECT, INSERT, UPDATE, DELETE
ON oauth_connections
TO app_user;

CREATE INDEX idx_oauth_connections_tenant_provider
ON oauth_connections(tenant_id, provider);