ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE users FORCE ROW LEVEL SECURITY;

ALTER TABLE workflows ENABLE ROW LEVEL SECURITY;
ALTER TABLE workflows FORCE ROW LEVEL SECURITY;

ALTER TABLE execution_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE execution_logs FORCE ROW LEVEL SECURITY;

ALTER TABLE credential_vault ENABLE ROW LEVEL SECURITY;
ALTER TABLE credential_vault FORCE ROW LEVEL SECURITY;

ALTER TABLE audit_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_log FORCE ROW LEVEL SECURITY;

ALTER TABLE webhook_endpoints ENABLE ROW LEVEL SECURITY;
ALTER TABLE webhook_endpoints FORCE ROW LEVEL SECURITY;

CREATE POLICY users_tenant_policy ON users
USING (tenant_id = current_setting('app.current_tenant_id', true)::uuid)
WITH CHECK (tenant_id = current_setting('app.current_tenant_id', true)::uuid);

CREATE POLICY workflows_tenant_policy ON workflows
USING (tenant_id = current_setting('app.current_tenant_id', true)::uuid)
WITH CHECK (tenant_id = current_setting('app.current_tenant_id', true)::uuid);

CREATE POLICY execution_logs_tenant_policy ON execution_logs
USING (tenant_id = current_setting('app.current_tenant_id', true)::uuid)
WITH CHECK (tenant_id = current_setting('app.current_tenant_id', true)::uuid);

CREATE POLICY credential_vault_tenant_policy ON credential_vault
USING (tenant_id = current_setting('app.current_tenant_id', true)::uuid)
WITH CHECK (tenant_id = current_setting('app.current_tenant_id', true)::uuid);

CREATE POLICY audit_log_tenant_policy ON audit_log
USING (tenant_id = current_setting('app.current_tenant_id', true)::uuid)
WITH CHECK (tenant_id = current_setting('app.current_tenant_id', true)::uuid);

CREATE POLICY webhook_endpoints_tenant_policy ON webhook_endpoints
USING (tenant_id = current_setting('app.current_tenant_id', true)::uuid)
WITH CHECK (tenant_id = current_setting('app.current_tenant_id', true)::uuid);