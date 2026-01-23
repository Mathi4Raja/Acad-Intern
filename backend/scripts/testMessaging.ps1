#!/usr/bin/env pwsh

Write-Host "`n🚀 Testing AcadIntern Messaging Feature`n" -ForegroundColor Cyan
Write-Host "═══════════════════════════════════════════════════`n" -ForegroundColor Gray

# Step 1: Login as Student
Write-Host "📝 Step 1: Logging in as Student..." -ForegroundColor Yellow
$loginBody1 = @{email="student@test.com";password="password123"} | ConvertTo-Json
$studentLogin = Invoke-RestMethod -Uri "http://localhost:5000/api/auth/login" `
    -Method POST `
    -ContentType "application/json" `
    -Body $loginBody1 `
    -SessionVariable studentSession

Write-Host "   ✅ Student logged in: $($studentLogin.data.user.name)" -ForegroundColor Green

# Step 2: Login as Company
WloginBody2 = @{email="company@test.com";password="password123"} | ConvertTo-Json
$companyLogin = Invoke-RestMethod -Uri "http://localhost:5000/api/auth/login" `
    -Method POST `
    -ContentType "application/json" `
    -Body $loginBody2
    -Body '{"email":"company@test.com","password":"password123"}' `
    -SessionVariable companySession

Write-Host "   ✅ Company logged in: $($companyLogin.data.user.name)" -ForegroundColor Green

# Step 3: Get Student's Conversations
Write-Host "`n📝 Step 3: Getting student's conversations..." -ForegroundColor Yellow
$conversations = Invoke-RestMethod -Uri "http://localhost:5000/api/messages/conversations" `
    -Method GET `
    -WebSession $studentSession

Write-Host "   ✅ Found $($conversations.data.Count) conversation(s)" -ForegroundColor Green

if ($conversations.data.Count -eq 0) {
    Write-Host "   ⚠️  No conversations found. Run populate script first." -ForegroundColor Yellow
    exit 0
}

$applicationId = $conversations.data[0].application._id
$internshipTitle = $conversations.data[0].application.internshipId.title
Write-Host "   📋 Testing with: $internshipTitle" -ForegroundColor Cyan
Write-Host "   📋 Application ID: $applicationId" -ForegroundColor Cyan

# Step 4: Student sends a message
Write-Host "`n📝 Step 4: Student sending message..." -ForegroundColor Yellow
$body1 = @{content="Hi! I have a question about the internship position."} | ConvertTo-Json
$message1 = Invoke-RestMethod -Uri "http://localhost:5000/api/messages/application/$applicationId" `
    -Method POST `
    -ContentType "application/json" `
    -Body $body1 `
    -WebSession $studentSession

Write-Host "   ✅ Message sent: $($message1.data.content)" -ForegroundColor Green
Write-Host "   📊 Status: $($message1.data.status)" -ForegroundColor Cyan

# Step 5: Get messages (as Company)
Write-Host "`n📝 Step 5: Company fetching messages..." -ForegroundColor Yellow
$messages = Invoke-RestMethod -Uri "http://localhost:5000/api/messages/application/$applicationId" `
    -Method GET `
    -WebSession $companySession

Write-Host "   ✅ Found $($messages.data.Count) message(s)" -ForegroundColor Green
foreach ($msg in $messages.data) {
    $sender = $msg.senderId.name
    $content = $msg.content
    $status = $msg.status
    Write-Host "   💬 $sender : $content [$status]" -ForegroundColor White
}

# Step 6: Company replies
Write-Host "`n📝 Step 6: Company sending reply..." -ForegroundColor Yellow
$body2 = @{content="Hello! Sure, feel free to ask any questions."} | ConvertTo-Json
$message2 = Invoke-RestMethod -Uri "http://localhost:5000/api/messages/application/$applicationId" `
    -Method POST `
    -ContentType "application/json" `
    -Body $body2 `
    -WebSession $companySession

Write-Host "   ✅ Message sent: $($message2.data.content)" -ForegroundColor Green
Write-Host "   📊 Status: $($message2.data.status)" -ForegroundColor Cyan

# Step 7: Mark messages as seen (Student)
Write-Host "`n📝 Step 7: Student marking messages as seen..." -ForegroundColor Yellow
$seen = Invoke-RestMethod -Uri "http://localhost:5000/api/messages/application/$applicationId/seen" `
    -Method PATCH `
    -WebSession $studentSession

Write-Host "   ✅ Messages marked as seen" -ForegroundColor Green

# Step 8: Get unread count
Write-Host "`n📝 Step 8: Checking unread message count..." -ForegroundColor Yellow
$unreadStudent = Invoke-RestMethod -Uri "http://localhost:5000/api/messages/unread-count" `
    -Method GET `
    -WebSession $studentSession

$unreadCompany = Invoke-RestMethod -Uri "http://localhost:5000/api/messages/unread-count" `
    -Method GET `
    -WebSession $companySession

Write-Host "   📊 Student unread: $($unreadStudent.data.unreadCount)" -ForegroundColor Cyan
Write-Host "   📊 Company unread: $($unreadCompany.data.unreadCount)" -ForegroundColor Cyan

# Step 9: Final message list
Write-Host "`n📝 Step 9: Final conversation state..." -ForegroundColor Yellow
$finalMessages = Invoke-RestMethod -Uri "http://localhost:5000/api/messages/application/$applicationId" `
    -Method GET `
    -WebSession $studentSession

Write-Host "   ✅ Total messages: $($finalMessages.data.Count)" -ForegroundColor Green
foreach ($msg in $finalMessages.data) {
    $sender = $msg.senderId.name
    $content = $msg.content
    $status = $msg.status
    $time = [DateTime]$msg.createdAt
    Write-Host "   [$($time.ToString('HH:mm:ss'))] $sender : $content [$status]" -ForegroundColor White
}

Write-Host "`n═══════════════════════════════════════════════════" -ForegroundColor Gray
Write-Host "✅ REST API Test completed successfully!" -ForegroundColor Green
Write-Host "═══════════════════════════════════════════════════`n" -ForegroundColor Gray

Write-Host '💡 Next: Test Socket.io by logging into http://localhost:3000' -ForegroundColor Cyan
Write-Host '   - Student: student@test.com / password123' -ForegroundColor White
Write-Host '   - Company: company@test.com / password123' -ForegroundColor White
Write-Host ""
