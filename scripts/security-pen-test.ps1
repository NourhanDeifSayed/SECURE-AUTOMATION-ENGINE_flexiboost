Write-Host "Starting Security Penetration Tests..." -ForegroundColor Cyan

$api = "http://localhost:3000"

Write-Host "`n[1] Health Check..."
try {
    Invoke-RestMethod "$api/health" | Out-Null
    Write-Host "PASS: Health endpoint reachable" -ForegroundColor Green
} catch {
    Write-Host "FAIL: Health endpoint unreachable" -ForegroundColor Red
}

Write-Host "`n[2] Unauthorized Workflow Access..."
try {
    Invoke-RestMethod "$api/workflows" -Method GET
    Write-Host "FAIL: Unauthorized access allowed" -ForegroundColor Red
} catch {
    Write-Host "PASS: Unauthorized requests blocked" -ForegroundColor Green
}

Write-Host "`n[3] SQL Injection Attempt..."
try {
    Invoke-RestMethod "$api/workflows?id=' OR 1=1--" -Method GET
    Write-Host "FAIL: Potential SQL injection exposure" -ForegroundColor Red
} catch {
    Write-Host "PASS: SQL injection attempt blocked" -ForegroundColor Green
}

Write-Host "`n[4] Metrics Endpoint..."
try {
    Invoke-RestMethod "$api/metrics" | Out-Null
    Write-Host "PASS: Metrics endpoint reachable" -ForegroundColor Green
} catch {
    Write-Host "FAIL: Metrics endpoint unavailable" -ForegroundColor Red
}

Write-Host "`n[5] CORS Verification..."
try {
    $response = Invoke-WebRequest "$api/health"
    $cors = $response.Headers["Access-Control-Allow-Origin"]

    if ($cors -eq "*") {
        Write-Host "WARNING: Wildcard CORS enabled" -ForegroundColor Yellow
    }
    else {
        Write-Host "PASS: Restricted CORS configuration" -ForegroundColor Green
    }
} catch {
    Write-Host "FAIL: Unable to verify CORS" -ForegroundColor Red
}

Write-Host "`nSecurity Penetration Tests Completed."
