CREATE INDEX idx_users_tenant_id ON users(tenant_id);
CREATE INDEX idx_workflows_tenant_id ON workflows(tenant_id);
CREATE INDEX idx_execution_logs_tenant_id ON execution_logs(tenant_id);
CREATE INDEX idx_credential_vault_tenant_id ON credential_vault(tenant_id);
CREATE INDEX idx_audit_log_tenant_id ON audit_log(tenant_id);
CREATE INDEX idx_webhook_endpoints_tenant_id ON webhook_endpoints(tenant_id);

CREATE INDEX idx_workflows_status ON workflows(tenant_id, status);
CREATE INDEX idx_execution_logs_workflow_id ON execution_logs(tenant_id, workflow_id);
CREATE INDEX idx_execution_logs_ttl ON execution_logs(ttl_delete_after);
CREATE INDEX idx_audit_log_occurred_at ON audit_log(tenant_id, occurred_at);