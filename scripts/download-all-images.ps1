param(
  [int]$WorkerCount = 4,
  [int]$WorkerId = 0
)

$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$OutputDir = Join-Path (Join-Path (Join-Path $ScriptDir "..") "public") "images" | Join-Path -ChildPath "weapons"
$OutputDir = Resolve-Path $OutputDir -ErrorAction Stop
$BaseDir = Join-Path (Join-Path $ScriptDir "..") "public" | Join-Path -ChildPath "data"
$BaseDir = Resolve-Path $BaseDir -ErrorAction Stop
$BaseUrl = "https://eldenring.wiki.fextralife.com"
$ManifestPath = Join-Path $OutputDir "manifest.json"

# Load weapon data
$baseWeapons = (Get-Content (Join-Path $BaseDir "armaments.json") -Raw | ConvertFrom-Json).PSObject.Properties.Value
$dlcWeapons = (Get-Content (Join-Path $BaseDir "dlc-armaments.json") -Raw | ConvertFrom-Json).PSObject.Properties.Value
$allWeapons = $baseWeapons + $dlcWeapons
New-Item -ItemType Directory -Path $OutputDir -Force | Out-Null

# Filter to this worker's share
$weapons = @()
for ($i = $WorkerId; $i -lt $allWeapons.Count; $i += $WorkerCount) {
  $weapons += $allWeapons[$i]
}

$total = $weapons.Count
$downloaded = 0
$skipped = 0
$failed = 0
$noOg = 0
$manifest = @{}
$startTime = Get-Date

Write-Host "[Worker $WorkerId] Processing $total weapons (total: $($allWeapons.Count))" -ForegroundColor Cyan

for ($i = 0; $i -lt $total; $i++) {
  $w = $weapons[$i]
  $engName = if ($w.name_en) { $w.name_en } else { $w.name }
  if (-not $engName) { continue }

  $destPath = Join-Path $OutputDir "$($w.id).png"
  $pct = [Math]::Round(($i + 1) / $total * 100, 1)
  $elapsed = [Math]::Round(((Get-Date) - $startTime).TotalMinutes, 1)

  if (Test-Path $destPath) {
    $skipped++
    $manifest[$engName] = "$($w.id).png"
    Write-Progress -Id $WorkerId -Activity "Worker $WorkerId - Downloading weapons ($elapsed min)" -Status "$engName (skipped, $pct%)" -PercentComplete ($pct)
    continue
  }

  Write-Progress -Id $WorkerId -Activity "Worker $WorkerId - Downloading weapons ($elapsed min)" -Status "$engName ($pct%)" -PercentComplete ($pct)

  # Fetch fextralife page
  $pageName = $engName -replace ' ', '+'
  $pageUrl = "$BaseUrl/$pageName"

  try {
    $resp = Invoke-WebRequest -Uri $pageUrl -TimeoutSec 20 -UseBasicParsing -ErrorAction Stop
    if ($resp.Content -match '<meta[^>]+property="og:image"[^>]+content="([^"]+)"') {
      $imgUrl = $Matches[1]
      try {
        Invoke-WebRequest -Uri $imgUrl -TimeoutSec 20 -UseBasicParsing -OutFile $destPath -ErrorAction Stop
        $downloaded++
        $manifest[$engName] = "$($w.id).png"
      } catch {
        $failed++
        Write-Warning "[Worker $WorkerId] Image download failed: $engName ($($w.id)) - $_"
      }
    } elseif ($resp.Content -match '<meta[^>]+property="og:image"[^>]+content="([^"]+)"') {
      # Handle non-standard og:image format
      $imgUrl = $Matches[1]
      try {
        Invoke-WebRequest -Uri $imgUrl -TimeoutSec 20 -UseBasicParsing -OutFile $destPath -ErrorAction Stop
        $downloaded++
        $manifest[$engName] = "$($w.id).png"
      } catch {
        $failed++
      }
    } else {
      $noOg++
      Write-Warning "[Worker $WorkerId] No og:image: $engName"
    }
  } catch {
    $failed++
    Write-Warning "[Worker $WorkerId] Page fetch failed: $engName - $_"
  }
}

Write-Progress -Id $WorkerId -Activity "Worker $WorkerId" -Completed

# Write manifest
$manifest | ConvertTo-Json | Set-Content -Path $ManifestPath -Encoding UTF8

Write-Host "[Worker $WorkerId] Done: +$downloaded downloaded, $skipped skipped, $failed failed, $noOg no-og"
