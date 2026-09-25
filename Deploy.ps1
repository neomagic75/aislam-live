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
    foreach ($appHost in @('https://aislam-live.vercel.app', 'https://app.aislam.cc')) {
        $response = Invoke-WebRequest -UseBasicParsing -Uri "$appHost/"
        if ($response.StatusCode -ne 200 -or $response.Content -notmatch 'Kinderzeit') { throw 'Public HTTPS smoke failed.' }
        $status = Invoke-RestMethod -Uri "$appHost/api/status"
        if ($status.app -ne 'aislam-live' -or $status.mode -ne 'family-finder') { throw 'API routing smoke failed.' }
        $bundlePath = [regex]::Match($response.Content, 'src="(/assets/[^" ]+\.js)"').Groups[1].Value
        if (-not $bundlePath) { throw 'Production JavaScript bundle missing.' }
        $bundle = Invoke-WebRequest -UseBasicParsing -Uri "$appHost$bundlePath"
        if ($bundle.Content -notmatch 'Freizeitheim Döhren' -or $bundle.Content -notmatch 'Region Hannover') { throw 'Curated data bundle smoke failed.' }
        [pscustomobject]@{ url = "$appHost/"; seconds = [math]::Round($watch.Elapsed.TotalSeconds, 2); status = $response.StatusCode; release = $status.release } | ConvertTo-Json
    }
} finally { Pop-Location }
