CREATE ROLE app_user LOGIN PASSWORD 'app_password';
CREATE ROLE migration_user LOGIN PASSWORD 'migration_password';
CREATE ROLE readonly_user LOGIN PASSWORD 'readonly_password';

GRANT CONNECT ON DATABASE sae TO app_user, migration_user, readonly_user;

GRANT USAGE ON SCHEMA public TO app_user, migration_user, readonly_user;

GRANT SELECT, INSERT, UPDATE, DELETE
ON tenants, users, workflows, execution_logs, credential_vault, webhook_endpoints
TO app_user;

GRANT INSERT
ON audit_log
TO app_user;

GRANT SELECT
ON tenants, users, workflows, execution_logs, credential_vault, webhook_endpoints, audit_log
TO readonly_user;

GRANT ALL PRIVILEGES
ON ALL TABLES IN SCHEMA public
TO migration_user;