$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Definition
$ProjectDir = Split-Path -Parent $ScriptDir
$OutputDir = Join-Path (Join-Path (Join-Path $ProjectDir "public") "images") "weapons"
if (-not (Test-Path $OutputDir)) { New-Item -ItemType Directory -Path $OutputDir -Force | Out-Null }
$BaseUrl = "https://eldenring.wiki.fextralife.com"

Write-Host "Loading weapon list..." -ForegroundColor Cyan
$weapons = @()
node (Join-Path $ScriptDir "export-weapon-list.cjs") | ForEach-Object {
  $parts = $_ -split '\|'
  $weapons += [PSCustomObject]@{ id=[int]$parts[0]; name=$parts[1]; category=$parts[2]; is_dlc=$parts[3]-eq'1' }
}

$missing = $weapons | Where-Object { -not (Test-Path (Join-Path $OutputDir "$($_.id).png")) }
Write-Host "Missing: $($missing.Count) weapons" -ForegroundColor Cyan

$downloaded = 0
$failed = 0

for ($i = 0; $i -lt $missing.Count; $i++) {
  $w = $missing[$i]
  $destPath = Join-Path $OutputDir "$($w.id).png"
  $pageName = $w.name -replace ' ', '+'
  $pageUrl = "$BaseUrl/$pageName"
  $pct = [Math]::Round(($i + 1) / $missing.Count * 100, 1)

  Write-Progress -Activity "Scraping fextralife pages" -Status "$($w.name) ($pct%)" -PercentComplete $pct

  try {
    $html = (Invoke-WebRequest -Uri $pageUrl -TimeoutSec 20 -UseBasicParsing).Content
    if ($html -match '<meta[^>]+property="og:image"[^>]+content="([^"]+)"') {
      $imgUrl = $Matches[1]
      try {
        $wc = New-Object System.Net.WebClient
        $wc.DownloadFile($imgUrl, $destPath)
        $wc.Dispose()
        $downloaded++
        Write-Host "  OK $($w.name)" -ForegroundColor Green
      } catch { $failed++; Write-Host "  FAIL DL $($w.name): $_" -ForegroundColor Red }
    } else { $failed++; Write-Host "  FAIL OG $($w.name)" -ForegroundColor DarkYellow }
  } catch {
    $failed++
    $errMsg = $_.Exception.InnerException.Message
    if ($errMsg -match '502') { Write-Host "  RATE_LIMIT $($w.name)" -ForegroundColor DarkYellow }
    else { Write-Host "  FAIL $($w.name): $_" -ForegroundColor Red }
  }

  # Delay to avoid rate limiting
  Start-Sleep -Milliseconds 1500
}

Write-Progress -Activity "Scraping fextralife pages" -Completed
Write-Host "Done: $downloaded downloaded, $failed failed" -ForegroundColor Yellow

# Rebuild manifest
$ManifestPath = Join-Path $OutputDir "manifest.json"
$manifest = @{}
node (Join-Path $ScriptDir "export-weapon-list.cjs") | ForEach-Object {
  $parts = $_ -split '\|'
  $id = [int]$parts[0]; $name = $parts[1]
  $f = Join-Path $OutputDir "$id.png"
  if (Test-Path $f) { $manifest[$name] = "$id.png" }
}
$manifest | ConvertTo-Json | Set-Content -Path $ManifestPath -Encoding UTF8
Write-Host "Manifest updated: $($manifest.Count) entries" -ForegroundColor Cyan
