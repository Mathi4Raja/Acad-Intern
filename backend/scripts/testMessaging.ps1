#!/usr/bin/env pwsh

Write-Host "`n🚀 Testing AcadIntern Messaging Feature`n" -ForegroundColor Cyan
Write-Host "═══════════════════════════════════════════════════`n" -ForegroundColor Gray

# Check if backend server is running
Write-Host "🔍 Checking if backend server is running..." -ForegroundColor Yellow
$serverRunning = $false
try {
    $response = Invoke-WebRequest -Uri "http://localhost:5000/health" -Method GET -TimeoutSec 5 -ErrorAction Stop
    if ($response.StatusCode -eq 200) {
        $serverRunning = $true
        Write-Host "   ✅ Backend server is running" -ForegroundColor Green
    }
} catch {
    Write-Host "   ❌ Backend server is not running" -ForegroundColor Red
    Write-Host "   💡 Please start the backend server first: npm run dev" -ForegroundColor Yellow
    exit 1
}

Write-Host "`n📋 Running comprehensive messaging tests..." -ForegroundColor Yellow
Write-Host "This will test:" -ForegroundColor Cyan
Write-Host "  - Student to Company messaging" -ForegroundColor Cyan
Write-Host "  - Company to Student messaging" -ForegroundColor Cyan
Write-Host "  - Message status tracking (sent/delivered/seen)" -ForegroundColor Cyan
Write-Host "  - Typing indicators" -ForegroundColor Cyan
Write-Host "  - Real-time socket communication" -ForegroundColor Cyan
Write-Host ""

try {
    # Run the comprehensive messaging test
    npx ts-node scripts/testMessaging.ts
    Write-Host "`n✅ All messaging tests passed!" -ForegroundColor Green
} catch {
    Write-Host "`n❌ Messaging tests failed!" -ForegroundColor Red
    Write-Host $_.Exception.Message -ForegroundColor Red
    exit 1
}

Write-Host "`n═══════════════════════════════════════════════════" -ForegroundColor Gray
Write-Host "✅ Comprehensive messaging test completed successfully!" -ForegroundColor Green
Write-Host "═══════════════════════════════════════════════════`n" -ForegroundColor Gray

Write-Host '💡 You can also test manually by logging into http://localhost:3000' -ForegroundColor Cyan
Write-Host '   - Use the test credentials from TEST_CREDENTIALS.md' -ForegroundColor White
Write-Host ""
