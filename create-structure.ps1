$folders = @(
"db/migrations",
"db/seeds",
"db/scripts",

"services/api-gateway/src/controllers",
"services/api-gateway/src/routes",
"services/api-gateway/src/middleware",
"services/api-gateway/src/services",
"services/api-gateway/src/repositories",

"services/task-orchestrator/src/workers",
"services/task-orchestrator/src/executors",
"services/task-orchestrator/src/queues",

"services/webhook-listener/src/middleware",
"services/webhook-listener/src/validators",

"services/credential-vault/src/crypto",
"services/credential-vault/src/kms",

"services/audit-service/src/hash-chain",

"services/scheduler/src/jobs",

"services/shared/src/logger",
"services/shared/src/database",
"services/shared/src/auth",
"services/shared/src/redis",
"services/shared/src/types",
"services/shared/src/constants",

"apps/web-ui/src/pages",
"apps/web-ui/src/components",
"apps/web-ui/src/layouts",
"apps/web-ui/src/features/auth",
"apps/web-ui/src/features/workflows",
"apps/web-ui/src/features/audit",
"apps/web-ui/src/features/credentials",
"apps/web-ui/src/features/admin",
"apps/web-ui/src/services",

"packages/auth",
"packages/database",
"packages/logger",
"packages/types",
"packages/validation",

"packages/connectors/generic-http",
"packages/connectors/slack",
"packages/connectors/stripe",
"packages/connectors/google",
"packages/connectors/microsoft",

"tests/unit",
"tests/integration",
"tests/security",
"tests/e2e",

"infra/nginx",
"infra/prometheus",
"infra/grafana",
"infra/docker",
"infra/secrets",

"docs",
"scripts"
)

$files = @(
"docker-compose.yml",
"package.json",
"pnpm-workspace.yaml",
"tsconfig.base.json",
".env.example",
"README.md",

"db/migrations/001_init.sql",
"db/migrations/002_rls.sql",
"db/migrations/003_roles.sql",
"db/migrations/004_indexes.sql",

"services/api-gateway/src/main.ts",
"services/task-orchestrator/src/main.ts",
"services/webhook-listener/src/main.ts",
"services/credential-vault/src/main.ts",
"services/audit-service/src/main.ts",
"services/scheduler/src/main.ts",

"apps/web-ui/src/main.tsx",

"tests/security/tenant-isolation.test.ts",
"tests/security/rls.test.ts",
"tests/security/audit-log.test.ts",
"tests/security/webhook-security.test.ts",

"docs/architecture.md",
"docs/gdpr.md",
"docs/dpa.md",
"docs/rls-runbook.md",
"docs/secret-rotation.md",
"docs/disaster-recovery.md",
"docs/data-flow-diagram.md",

"scripts/bootstrap.ps1",
"scripts/backup.ps1",
"scripts/restore.ps1",
"scripts/rotate-secrets.ps1"
)

foreach ($folder in $folders) {
    New-Item -ItemType Directory -Path $folder -Force | Out-Null
}

foreach ($file in $files) {
    New-Item -ItemType File -Path $file -Force | Out-Null
}

Write-Host "SAE project structure created successfully."