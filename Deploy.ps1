$ErrorActionPreference = 'Stop'
$watch = [Diagnostics.Stopwatch]::StartNew()
Push-Location $PSScriptRoot
try {
    node --check app.js
    if ($LASTEXITCODE -ne 0) { throw 'JavaScript check failed.' }
    cmd /c vercel deploy --prod --yes --project aislam-live --scope stevos-projects-876dfee2
    if ($LASTEXITCODE -ne 0) { throw 'Vercel deployment failed.' }
    $response = Invoke-WebRequest -UseBasicParsing -Uri 'https://aislam-live.vercel.app/'
    if ($response.StatusCode -ne 200) { throw 'Public HTTPS smoke failed.' }
    [pscustomobject]@{ hostName = $env:COMPUTERNAME; url = 'https://aislam-live.vercel.app/'; seconds = [math]::Round($watch.Elapsed.TotalSeconds, 2); status = $response.StatusCode } | ConvertTo-Json
} finally { Pop-Location }
