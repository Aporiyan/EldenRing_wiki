param([int]$FextraDelayMs = 1000)

$ErrorActionPreference = 'Stop'
$ProgressPreference = 'SilentlyContinue'

$ProjectRoot = Split-Path -Parent (Split-Path -Parent $PSCommandPath)
$ApiBase = 'https://eldenring-api.vercel.app'
$FextraBase = 'https://eldenring.wiki.fextralife.com'
$OutDir = Join-Path $ProjectRoot 'public\images\weapons'
$ManifestPath = Join-Path $ProjectRoot 'public\data\weapon-images.json'
$ArmPath = Join-Path $ProjectRoot 'public\data\armaments.json'
$DlcArmPath = Join-Path $ProjectRoot 'public\data\dlc-armaments.json'

[Net.ServicePointManager]::SecurityProtocol = [Net.SecurityProtocolType]::Tls12

function Ensure-Dir($dir) {
  if (-not (Test-Path $dir)) { New-Item -ItemType Directory -Path $dir -Force | Out-Null }
}

function Fetch-Json($url) {
  Write-Verbose "GET $url"
  $r = Invoke-WebRequest -Uri $url -UseBasicParsing -TimeoutSec 60
  return ($r.Content | ConvertFrom-Json)
}

function Save-Binary($url, $dest) {
  if (Test-Path $dest) { return $false }
  Ensure-Dir (Split-Path -Parent $dest)
  Write-Verbose "DL $url -> $dest"
  Invoke-WebRequest -Uri $url -OutFile $dest -UseBasicParsing -TimeoutSec 120
  return $true
}

function Sanitize-FileName($name) {
  $s = $name -replace '[<>:""/\\|?*''’!.,&()]', '' -replace '\s+', '_' -replace '_+', '_'
  $s = $s.Trim('_')
  if ($s.Length -gt 200) { $s = $s.Substring(0, 200) }
  return $s
}

function Get-NameEn($item) {
  if ($item.name_en) { return $item.name_en.ToString().Trim() }
  if ($item.name) { return $item.name.ToString().Trim() }
  return ''
}

function Fetch-FextraImageUrl($weaponName) {
  $slug = $weaponName -replace '\s+', '+'
  $slug = $slug -replace "'", '%27'
  $url = "$FextraBase/$slug"
  try {
    $html = Invoke-WebRequest -Uri $url -UseBasicParsing -TimeoutSec 30
    $content = $html.Content
    $m1 = [regex]::Match($content, '<meta\s+property="og:image"\s+content="([^"]+)"', 'IgnoreCase')
    if ($m1.Success) { return $m1.Groups[1].Value }
    $m2 = [regex]::Match($content, '<meta\s+content="([^"]+)"\s+property="og:image"', 'IgnoreCase')
    if ($m2.Success) { return $m2.Groups[1].Value }
  } catch {
    # Silently fail
  }
  return $null
}

# ====== Step 1: Load local weapon data ======
Write-Host '=== Step 1: Load local weapon data ==='
$baseRaw = Get-Content -Raw $ArmPath -Encoding UTF8
try {
  $baseObj = $baseRaw | ConvertFrom-Json
  $baseWeps = @($baseObj.PSObject.Properties.Value)
} catch {
  $baseWeps = @()
  Write-Warning 'Failed to parse base armaments'
}
Write-Host "  Base weapons: $($baseWeps.Count)"

$dlcRaw = Get-Content -Raw $DlcArmPath -Encoding UTF8
try {
  $dlcObj = $dlcRaw | ConvertFrom-Json
  $dlcWeps = @($dlcObj.PSObject.Properties.Value)
} catch {
  $dlcWeps = @()
  Write-Warning 'Failed to parse DLC armaments'
}
Write-Host "  DLC weapons: $($dlcWeps.Count)"

$allWeps = $baseWeps + $dlcWeps
Write-Host "  Total: $($allWeps.Count)"

$localByName = @{}
foreach ($w in $allWeps) {
  $n = Get-NameEn $w
  if ($n) { $localByName[$n.ToLower()] = $w }
}

# ====== Step 2: Fetch API ======
Write-Host "`n=== Step 2: Fetch API weapon images ==="
$apiAll = @()
$offset = 0
$limit = 100
do {
  $url = "$ApiBase/api/weapons?limit=$limit&offset=$offset"
  $resp = Fetch-Json $url
  if (-not $resp.success -or $null -eq $resp.data -or $resp.data.Count -eq 0) { break }
  $apiAll += $resp.data
  Write-Host "  Fetched $($resp.data.Count) weapons (offset=$offset)"
  $offset += $limit
} while ($offset -lt $resp.total)
Write-Host "  Total API weapons: $($apiAll.Count)"

$imageMap = @{}
$apiDl = 0; $apiMatched = 0; $apiFailed = 0; $apiSkipped = 0

foreach ($aw in $apiAll) {
  if (-not $aw.name_en -or -not $aw.image) { continue }
  $enName = $aw.name_en.ToString().Trim()
  $key = $enName.ToLower()
  if (-not $localByName.ContainsKey($key)) { $apiSkipped++; continue }
  $apiMatched++

  $fname = (Sanitize-FileName $enName) + '.png'
  $dest = Join-Path $OutDir $fname
  try {
    $isNew = Save-Binary $aw.image $dest
    if ($isNew) { $apiDl++ }
    $imageMap[$enName] = $fname
    if ($apiMatched % 25 -eq 0) { Write-Host "  Progress: $apiMatched / $($apiAll.Count)" }
  } catch {
    $apiFailed++
    Write-Warning "FAILED: $enName"
  }
}
Write-Host "  Matched: $apiMatched | Downloaded: $apiDl | Failed: $apiFailed | Skipped(no match): $apiSkipped"

# ====== Step 3: Unmatched weapons ======
$apiNameSet = @{}
foreach ($aw in $apiAll) {
  if (-not $aw.name_en) { continue }
  $n = $aw.name_en.ToString().Trim().ToLower()
  if ($n) { $apiNameSet[$n] = $true }
}
$unmatched = @()
foreach ($w in $allWeps) {
  $n = Get-NameEn $w
  if ($n -and -not $apiNameSet.ContainsKey($n.ToLower())) { $unmatched += $w }
}
Write-Host "`n=== Step 3: Unmatched weapons: $($unmatched.Count) ==="

$fexDl = 0; $fexFailed = 0; $fexSkipped = 0
$i = 0
foreach ($w in $unmatched) {
  $i++
  $enName = Get-NameEn $w
  if (-not $enName -or $imageMap.ContainsKey($enName)) { continue }

  Write-Host "  [$i/$($unmatched.Count)] Scraping: $enName"
  Start-Sleep -Milliseconds $FextraDelayMs
  $imgUrl = Fetch-FextraImageUrl $enName
  if ($imgUrl) {
    $fname = (Sanitize-FileName $enName) + '.png'
    $dest = Join-Path $OutDir $fname
    try {
      Save-Binary $imgUrl $dest | Out-Null
      $imageMap[$enName] = $fname
      $fexDl++
      Write-Host '    OK'
    } catch {
      $fexFailed++
      Write-Warning '    FAILED(download)'
    }
  } else {
    $fexSkipped++
    Write-Warning '    NOT FOUND'
  }
}
Write-Host "  Fextralife: $fexDl downloaded | $fexFailed failed | $fexSkipped not found"

# ====== Step 4: Manifest ======
Write-Host "`n=== Step 4: Generate manifest ==="
$manifestJson = $imageMap | ConvertTo-Json -Compress
[System.IO.File]::WriteAllText($ManifestPath, $manifestJson, [System.Text.UTF8Encoding]::new($false))
Write-Host "  Manifest written to $ManifestPath"
Write-Host "  Total weapons with images: $($imageMap.Count) / $($allWeps.Count)"

Write-Host "`n=== Summary ==="
Write-Host "  API source: $($apiMatched - $apiFailed) images"
Write-Host "  Fextralife source: $fexDl images"
Write-Host "  Total: $($imageMap.Count) / $($allWeps.Count)"
Write-Host "  Without images: $($allWeps.Count - $imageMap.Count)"
