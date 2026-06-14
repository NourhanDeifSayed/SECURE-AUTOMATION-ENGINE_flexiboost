$ErrorActionPreference = "Stop"

$ArchiveDir = "worm-archive/audit"
$Timestamp = Get-Date -Format "yyyyMMdd-HHmmss"
$ArchiveFile = "$ArchiveDir/audit-log-$Timestamp.jsonl"

Write-Host "Starting audit log archive..." -ForegroundColor Cyan

if (!(Test-Path $ArchiveDir)) {
  New-Item -ItemType Directory -Path $ArchiveDir | Out-Null
}

docker exec -i sae_postgres psql -U postgres -d sae -t -A -c "
SELECT jsonb_build_object(
  'id', id,
  'tenant_id', tenant_id,
  'actor_user_id', actor_user_id,
  'action', action,
  'resource_type', resource_type,
  'resource_id', resource_id,
  'occurred_at', occurred_at,
  'previous_hash', previous_hash,
  'current_hash', current_hash
)::text
FROM audit_log
WHERE archived_at IS NULL
ORDER BY occurred_at ASC;
" | Out-File -Encoding utf8 $ArchiveFile

$HashFile = "$ArchiveFile.sha256"
Get-FileHash $ArchiveFile -Algorithm SHA256 | ForEach-Object {
  $_.Hash | Out-File -Encoding utf8 $HashFile
}

docker exec -i sae_postgres psql -U postgres -d sae -c "
UPDATE audit_log
SET archived_at = now()
WHERE archived_at IS NULL;
"

Write-Host "Audit log archived successfully." -ForegroundColor Green
Write-Host "Archive file: $ArchiveFile"
Write-Host "Hash file: $HashFile"