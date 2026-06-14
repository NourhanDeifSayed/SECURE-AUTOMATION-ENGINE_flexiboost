$TenantId = "11111111-1111-1111-1111-111111111111"
$WorkflowId = "ee661912-df76-4f0d-90f9-ea85187c2862"

Write-Host "Starting TTL pruning test..." -ForegroundColor Cyan

Write-Host "1. Seeding expired execution log..." -ForegroundColor Yellow

docker exec -i sae_postgres psql -U postgres -d sae -c "INSERT INTO execution_logs (tenant_id, workflow_id, status, started_at, completed_at, ttl_delete_after) VALUES ('$TenantId', '$WorkflowId', 'success', now() - interval '10 days', now() - interval '10 days', now() - interval '1 day');"

Write-Host "2. Verifying expired log exists..." -ForegroundColor Yellow

$BeforeCount = docker exec -i sae_postgres psql -U postgres -d sae -t -A -c "SELECT COUNT(*) FROM execution_logs WHERE tenant_id = '$TenantId' AND workflow_id = '$WorkflowId' AND ttl_delete_after < now();"

if ([int]$BeforeCount.Trim() -lt 1) {
  Write-Host "FAIL: Expired execution log was not created." -ForegroundColor Red
  exit 1
}

Write-Host "3. Running pruning function..." -ForegroundColor Yellow

docker exec -i sae_postgres psql -U postgres -d sae -c "SELECT * FROM prune_expired_execution_logs();"

Write-Host "4. Verifying expired logs were deleted..." -ForegroundColor Yellow

$AfterCount = docker exec -i sae_postgres psql -U postgres -d sae -t -A -c "SELECT COUNT(*) FROM execution_logs WHERE tenant_id = '$TenantId' AND workflow_id = '$WorkflowId' AND ttl_delete_after < now();"

if ($AfterCount.Trim() -eq "0") {
  Write-Host "PASS: TTL pruning completed successfully." -ForegroundColor Green
  exit 0
}

Write-Host "FAIL: Expired execution logs were not deleted." -ForegroundColor Red
Write-Host "Remaining expired logs: $AfterCount"
exit 1