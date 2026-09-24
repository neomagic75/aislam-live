$ErrorActionPreference = 'Stop'
$watch = [Diagnostics.Stopwatch]::StartNew()
Push-Location $PSScriptRoot
try {
    npm.cmd test
    if ($LASTEXITCODE -ne 0) { throw 'Authorization/adapter tests failed.' }
    npm.cmd run validate
    if ($LASTEXITCODE -ne 0) { throw 'App contract failed.' }
    npm.cmd run build
    if ($LASTEXITCODE -ne 0) { throw 'Production build failed.' }
    vercel.cmd deploy --prod --yes --project aislam-live --scope stevos-projects-876dfee2
    if ($LASTEXITCODE -ne 0) { throw 'Vercel deployment failed.' }
    $response = Invoke-WebRequest -UseBasicParsing -Uri 'https://aislam-live.vercel.app/'
    if ($response.StatusCode -ne 200) { throw 'Public HTTPS smoke failed.' }
    $status = Invoke-RestMethod -Uri 'https://aislam-live.vercel.app/api/status'
    if ($status.app -ne 'aislam-live' -or $status.mode -ne 'operator-rehearsal') { throw 'API routing smoke failed.' }
    [pscustomobject]@{ hostName = $env:COMPUTERNAME; url = 'https://aislam-live.vercel.app/'; seconds = [math]::Round($watch.Elapsed.TotalSeconds, 2); status = $response.StatusCode } | ConvertTo-Json
} finally { Pop-Location }
