$ErrorActionPreference = "Stop"

Write-Host "Starting TTL pruning job..." -ForegroundColor Cyan

try {
  docker exec -i sae_postgres psql -U postgres -d sae -c "SELECT * FROM prune_expired_execution_logs();"

  Write-Host "TTL pruning job completed successfully." -ForegroundColor Green
  exit 0
}
catch {
  Write-Host "ALERT: TTL pruning job failed." -ForegroundColor Red
  Write-Host $_.Exception.Message -ForegroundColor Red
  exit 1
}