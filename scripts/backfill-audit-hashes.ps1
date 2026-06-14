$ErrorActionPreference = "Stop"

Write-Host "Starting audit hash backfill..." -ForegroundColor Cyan

Get-Content .\scripts\backfill-audit-hashes.sql | docker exec -i sae_postgres psql -U postgres -d sae

if ($LASTEXITCODE -ne 0) {
  Write-Host "FAIL: Audit hash backfill failed." -ForegroundColor Red
  exit 1
}

Write-Host "Audit hash backfill completed successfully." -ForegroundColor Green
exit 0