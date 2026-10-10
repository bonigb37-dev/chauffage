param([switch]$CheckDeployment, [switch]$RemoveRevokedSnapshot)
$ErrorActionPreference = 'Stop'
Add-Type -AssemblyName System.Security
$rotationStatePath = Join-Path $PSScriptRoot '..\.env.security-rotation-state'
$rotationConfigPath = Join-Path $PSScriptRoot '..\.env.local'
$rotationConfig = @{}
foreach ($rotationLine in Get-Content -LiteralPath $rotationConfigPath) {
  if ($rotationLine -match '^([A-Z_]+)=(.*)$') { $rotationConfig[$matches[1]] = $matches[2].Trim().Trim('"').Trim("'") }
}
$rotationKey = $rotationConfig['SUPABASE_SERVICE_ROLE_KEY']
$rotationProject = $rotationConfig['NEXT_PUBLIC_SUPABASE_URL'].TrimEnd('/')
$rotationUri = [Uri]$rotationProject
if ($rotationUri.Scheme -ne 'https' -or $rotationUri.Host -notmatch '^[a-z0-9]+\.supabase\.co$') { throw 'Unexpected Supabase host; no credentials sent.' }
if (-not $rotationKey.StartsWith('sb_secret_')) { throw 'Expected a server secret key, not a public key.' }
function Get-ReadOnlyKeyStatus([string]$keyToCheck) {
  try {
    return [int](Invoke-WebRequest -Uri "$rotationProject/rest/v1/product_overrides?select=product_id&limit=0" -Headers @{ apikey = $keyToCheck; Authorization = "Bearer $keyToCheck" } -UserAgent 'Bren-nholz-SecurityCheck/1.0' -UseBasicParsing -MaximumRedirection 0 -TimeoutSec 10).StatusCode
  } catch {
    if ($_.Exception.Response) { return [int]$_.Exception.Response.StatusCode }
    return 0
  }
}
$rotationCurrentStatus = Get-ReadOnlyKeyStatus $rotationKey
$rotationResults = @{ serverKeyType = 'sb_secret'; currentKeyReadStatus = $rotationCurrentStatus; currentKeyWorks = ($rotationCurrentStatus -eq 200) }
$rotationOldRevoked = $false
if (Test-Path -LiteralPath $rotationStatePath) {
  $rotationState = Get-Content -LiteralPath $rotationStatePath -Raw | ConvertFrom-Json
  if ($rotationState.projectUrl.TrimEnd('/') -ne $rotationProject) { throw 'Rotation snapshot belongs to another project.' }
  $rotationOldBytes = [Security.Cryptography.ProtectedData]::Unprotect([Convert]::FromBase64String($rotationState.protectedKey), $null, [Security.Cryptography.DataProtectionScope]::CurrentUser)
  $rotationOldKey = [Text.Encoding]::UTF8.GetString($rotationOldBytes)
  $rotationChanged = $rotationKey -cne $rotationOldKey
  $rotationResults['localKeyChanged'] = $rotationChanged
  if ($rotationChanged) {
    $rotationOldStatus = Get-ReadOnlyKeyStatus $rotationOldKey
    $rotationOldRevoked = $rotationOldStatus -in @(401,403)
    $rotationResults['oldKeyReadStatus'] = $rotationOldStatus
    $rotationResults['oldKeyRevoked'] = $rotationOldRevoked
  }
}
$rotationDeploymentWorks = $false
if ($CheckDeployment) {
  $rotationTimestamp = [DateTimeOffset]::UtcNow.ToUnixTimeSeconds().ToString()
  $rotationNonce = [Guid]::NewGuid().ToString('N')
  $rotationHmac = New-Object Security.Cryptography.HMACSHA256
  $rotationHmac.Key = [Text.Encoding]::UTF8.GetBytes($rotationKey)
  $rotationSignature = ([BitConverter]::ToString($rotationHmac.ComputeHash([Text.Encoding]::UTF8.GetBytes("GET:/api/security-check:${rotationTimestamp}:${rotationNonce}")))).Replace('-','').ToLowerInvariant()
  try {
    $rotationResponse = Invoke-WebRequest -Uri "https://bois-de-chauffage-de.vercel.app/api/security-check?timestamp=$rotationTimestamp&nonce=$rotationNonce" -Headers @{ 'x-security-check-signature' = $rotationSignature } -UseBasicParsing -MaximumRedirection 0 -TimeoutSec 10
    $rotationBody = $rotationResponse.Content | ConvertFrom-Json
    $rotationDeploymentWorks = [int]$rotationResponse.StatusCode -eq 200 -and $rotationBody.deploymentKeyMatches -eq $true -and $rotationBody.backendReadVerified -eq $true
    $rotationResults['deploymentReadStatus'] = [int]$rotationResponse.StatusCode
  } catch {
    $rotationResults['deploymentReadStatus'] = if ($_.Exception.Response) { [int]$_.Exception.Response.StatusCode } else { 0 }
  }
  $rotationHmac.Dispose()
  $rotationResults['deploymentUsesCurrentKey'] = $rotationDeploymentWorks
}
if ($RemoveRevokedSnapshot) {
  if (-not ($rotationOldRevoked -and $rotationCurrentStatus -eq 200 -and $rotationDeploymentWorks)) { throw 'Refuse cleanup before new deployment works and old key is revoked.' }
  Remove-Item -LiteralPath $rotationStatePath
  $rotationResults['encryptedSnapshotRemoved'] = $true
}
$rotationResults | ConvertTo-Json
