# Windows PowerShell Smoke-Test Script
# Tests all 6 Stoplight endpoints without bash continuation syntax

$ErrorActionPreference = "Stop"
$BaseUrl = if ($env:BASE_URL) { $env:BASE_URL } else { "http://localhost:3000" }

$Suffix = (Get-Date -Format "HHmmss")
$AliceUser = "alice_ps_$Suffix"
$BobUser = "bob_ps_$Suffix"

Write-Host "=================================================================" -ForegroundColor Cyan
Write-Host "Starting Crypto Wallet API Smoke Test on $BaseUrl" -ForegroundColor Cyan
Write-Host "Test Users: $AliceUser and $BobUser" -ForegroundColor Cyan
Write-Host "=================================================================" -ForegroundColor Cyan

# 1. REGISTER ALICE
Write-Host "[1/7] Registering Alice ($AliceUser)..." -NoNewline
$AliceRegBody = @{ username = $AliceUser } | ConvertTo-Json
$AliceRes = Invoke-RestMethod -Uri "$BaseUrl/user" -Method Post -Body $AliceRegBody -ContentType "application/json"
$AliceToken = $AliceRes.token
if (-not $AliceToken) { throw "Failed to obtain token for Alice" }
Write-Host " [PASS] Token: $($AliceToken.Substring(0, 15))..." -ForegroundColor Green

# 2. REGISTER BOB
Write-Host "[2/7] Registering Bob ($BobUser)..." -NoNewline
$BobRegBody = @{ username = $BobUser } | ConvertTo-Json
$BobRes = Invoke-RestMethod -Uri "$BaseUrl/user" -Method Post -Body $BobRegBody -ContentType "application/json"
$BobToken = $BobRes.token
if (-not $BobToken) { throw "Failed to obtain token for Bob" }
Write-Host " [PASS] Token: $($BobToken.Substring(0, 15))..." -ForegroundColor Green

# 3. TOPUP ALICE (100)
Write-Host "[3/7] Topping up Alice with 100..." -NoNewline
$TopupBody = @{ amount = 100 } | ConvertTo-Json
$TopupHeaders = @{ Authorization = $AliceToken }
$NullRes = Invoke-RestMethod -Uri "$BaseUrl/topup" -Method Post -Headers $TopupHeaders -Body $TopupBody -ContentType "application/json"
Write-Host " [PASS] HTTP 204 No Content" -ForegroundColor Green

# 4. VERIFY INITIAL BALANCE
Write-Host "[4/7] Checking Alice initial balance (expected 100)..." -NoNewline
$AliceBal = Invoke-RestMethod -Uri "$BaseUrl/balance" -Method Get -Headers @{ Authorization = $AliceToken; Accept = "application/json" }
if ($AliceBal.balance -ne 100) { throw "Expected balance 100, got $($AliceBal.balance)" }
Write-Host " [PASS] Alice Balance = $($AliceBal.balance)" -ForegroundColor Green

# 5. TRANSFER 25 FROM ALICE TO BOB
Write-Host "[5/7] Transferring 25 from Alice to Bob..." -NoNewline
$TransferBody = @{ to_username = $BobUser; amount = 25 } | ConvertTo-Json
$TransferRes = Invoke-RestMethod -Uri "$BaseUrl/transfer" -Method Post -Headers @{ Authorization = $AliceToken } -Body $TransferBody -ContentType "application/json"
Write-Host " [PASS] HTTP 204 No Content" -ForegroundColor Green

# VERIFY BOTH BALANCES
Write-Host "      Checking post-transfer balances..." -NoNewline
$AliceBalPost = Invoke-RestMethod -Uri "$BaseUrl/balance" -Method Get -Headers @{ Authorization = $AliceToken }
$BobBalPost = Invoke-RestMethod -Uri "$BaseUrl/balance" -Method Get -Headers @{ Authorization = $BobToken }
if ($AliceBalPost.balance -ne 75) { throw "Expected Alice balance 75, got $($AliceBalPost.balance)" }
if ($BobBalPost.balance -ne 25) { throw "Expected Bob balance 25, got $($BobBalPost.balance)" }
Write-Host " [PASS] Alice = $($AliceBalPost.balance), Bob = $($BobBalPost.balance)" -ForegroundColor Green

# 6. TOP TRANSACTIONS PER USER
Write-Host "[6/7] Checking /top_transactions_per_user..." -NoNewline
$AliceTxs = Invoke-RestMethod -Uri "$BaseUrl/top_transactions_per_user" -Method Get -Headers @{ Authorization = $AliceToken }
$BobTxs = Invoke-RestMethod -Uri "$BaseUrl/top_transactions_per_user" -Method Get -Headers @{ Authorization = $BobToken }

$AliceCounterparty = $AliceTxs | Where-Object { $_.username -eq $BobUser }
$BobCounterparty = $BobTxs | Where-Object { $_.username -eq $AliceUser }

if ($AliceCounterparty.amount -ne -25) { throw "Expected Alice transaction amount -25, got $($AliceCounterparty.amount)" }
if ($BobCounterparty.amount -ne 25) { throw "Expected Bob transaction amount 25, got $($BobCounterparty.amount)" }
Write-Host " [PASS] Alice: counterparty $BobUser (-25) | Bob: counterparty $AliceUser (25)" -ForegroundColor Green

# 7. TOP USERS
Write-Host "[7/7] Checking /top_users..." -NoNewline
$TopUsers = Invoke-RestMethod -Uri "$BaseUrl/top_users" -Method Get -Headers @{ Authorization = $AliceToken }
$AliceTop = $TopUsers | Where-Object { $_.username -eq $AliceUser }
$BobTop = $TopUsers | Where-Object { $_.username -eq $BobUser }

if (-not $AliceTop -or $AliceTop.transacted_value -ne 25) { throw "Expected Alice in top_users with transacted_value 25" }
if ($BobTop) { throw "Bob should be excluded from top_users as he had no outgoing transfers" }
Write-Host " [PASS] Alice transacted_value = $($AliceTop.transacted_value), Bob excluded" -ForegroundColor Green

Write-Host "=================================================================" -ForegroundColor Cyan
Write-Host "ALL SMOKE TEST CHECKS PASSED SUCCESSFULLY!" -ForegroundColor Green
Write-Host "=================================================================" -ForegroundColor Cyan
