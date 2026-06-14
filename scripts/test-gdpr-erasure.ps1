$TenantId = "99999999-9999-9999-9999-999999999999"
$UserId = "99999999-0000-0000-0000-000000000001"

Write-Host "Starting GDPR erasure test..." -ForegroundColor Cyan

Write-Host "1. Seeding test tenant..." -ForegroundColor Yellow

docker exec -i sae_postgres psql -U postgres -d sae -c "INSERT INTO tenants (id, name, plan_tier, data_region) VALUES ('$TenantId', 'GDPR Test Tenant', 'starter', 'eu-west-1') ON CONFLICT DO NOTHING;"

docker exec -i sae_postgres psql -U postgres -d sae -c "INSERT INTO users (id, tenant_id, email_hash, password_hash, role) VALUES ('$UserId', '$TenantId', 'gdpr@test.com', 'hash', 'admin') ON CONFLICT DO NOTHING;"

docker exec -i sae_postgres psql -U postgres -d sae -c "INSERT INTO workflows (tenant_id, name, definition_json, status, created_by) VALUES ('$TenantId', 'GDPR Test Workflow', '{}', 'draft', '$UserId');"

Write-Host "2. Verifying seeded data exists..." -ForegroundColor Yellow

$BeforeCount = docker exec -i sae_postgres psql -U postgres -d sae -t -A -c "SELECT COUNT(*) FROM tenants WHERE id = '$TenantId';"

if ($BeforeCount.Trim() -ne "1") {
  Write-Host "FAIL: Test tenant was not created." -ForegroundColor Red
  exit 1
}

Write-Host "3. Running right_to_erasure..." -ForegroundColor Yellow

docker exec -i sae_postgres psql -U postgres -d sae -c "SELECT * FROM right_to_erasure('$TenantId');"

Write-Host "4. Verifying tenant data was deleted..." -ForegroundColor Yellow

$TenantCount = docker exec -i sae_postgres psql -U postgres -d sae -t -A -c "SELECT COUNT(*) FROM tenants WHERE id = '$TenantId';"

$UserCount = docker exec -i sae_postgres psql -U postgres -d sae -t -A -c "SELECT COUNT(*) FROM users WHERE tenant_id = '$TenantId';"

$WorkflowCount = docker exec -i sae_postgres psql -U postgres -d sae -t -A -c "SELECT COUNT(*) FROM workflows WHERE tenant_id = '$TenantId';"

if ($TenantCount.Trim() -eq "0" -and $UserCount.Trim() -eq "0" -and $WorkflowCount.Trim() -eq "0") {
  Write-Host "PASS: GDPR erasure completed successfully." -ForegroundColor Green
  exit 0
}

Write-Host "FAIL: GDPR erasure did not delete all tenant data." -ForegroundColor Red
Write-Host "Tenant count: $TenantCount"
Write-Host "User count: $UserCount"
Write-Host "Workflow count: $WorkflowCount"
exit 1