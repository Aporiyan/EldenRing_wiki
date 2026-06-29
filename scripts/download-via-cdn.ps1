$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Definition
$ProjectDir = Split-Path -Parent $ScriptDir
$OutputDir = Join-Path (Join-Path (Join-Path $ProjectDir "public") "images") "weapons"

if (-not (Test-Path $OutputDir)) {
  New-Item -ItemType Directory -Path $OutputDir -Force | Out-Null
}

$CdnBase = "https://eldenring.wiki.fextralife.com/file/Elden-Ring"
$ManifestPath = Join-Path $OutputDir "manifest.json"

Write-Host "Loading weapon list..." -ForegroundColor Cyan
$weapons = @()
node (Join-Path $ScriptDir "export-weapon-list.cjs") | ForEach-Object {
  $parts = $_ -split '\|'
  $weapons += [PSCustomObject]@{
    id = [int]$parts[0]
    name = $parts[1]
    category = $parts[2]
    is_dlc = $parts[3] -eq '1'
  }
}
Write-Host "Total: $($weapons.Count) weapons" -ForegroundColor Cyan

function Test-Url($url) {
  try {
    $req = [System.Net.HttpWebRequest]::Create($url)
    $req.Method = 'HEAD'
    $req.Timeout = 5000
    $resp = $req.GetResponse()
    $code = $resp.StatusCode -eq 200
    $resp.Close()
    return $code
  } catch { return $false }
}

function Remove-Diacritics($s) {
  $formD = $s.Normalize([System.Text.NormalizationForm]::FormD)
  $sb = New-Object System.Text.StringBuilder
  foreach ($c in $formD.ToCharArray()) {
    $cat = [System.Globalization.CharUnicodeInfo]::GetUnicodeCategory($c)
    if ($cat -ne [System.Globalization.UnicodeCategory]::NonSpacingMark) { $sb.Append($c) | Out-Null }
  }
  return $sb.ToString()
}

function Get-Url($name, $category, $isDlc) {
  $nameSlug = (Remove-Diacritics $name).ToLower() -replace "'", '' -replace '[^a-z0-9\s]', ' '
  $nameSlug = ($nameSlug.Trim() -replace '\s+', '_')
  $catSlug = (Remove-Diacritics $category).ToLower() -replace "'", '' -replace '[^a-z0-9\s]', ' '
  $catSlug = ($catSlug.Trim() -replace '\s+', '_')
  $catSlugS = $catSlug + 's'

  $patterns = @()
  if ($isDlc) {
    $patterns += "${nameSlug}_${catSlug}_elden_ring_shadow_of_the_erdtree_dlc_wiki_guide_200px.png"
    $patterns += "${nameSlug}_${catSlugS}_elden_ring_shadow_of_the_erdtree_dlc_wiki_guide_200px.png"
    $patterns += "${nameSlug}_elden_ring_shadow_of_the_erdtree_dlc_wiki_guide_200px.png"
  }
  $patterns += "${nameSlug}_${catSlug}_weapon_elden_ring_wiki_guide_200px.png"
  $patterns += "${nameSlug}_${catSlugS}_weapon_elden_ring_wiki_guide_200px.png"
  $patterns += "${nameSlug}_${catSlug}_elden_ring_wiki_guide_200px.png"
  $patterns += "${nameSlug}_${catSlugS}_elden_ring_wiki_guide_200px.png"
  $patterns += "${nameSlug}_weapon_elden_ring_wiki_guide_200px.png"
  $patterns += "${nameSlug}_elden_ring_wiki_guide_200px.png"
  return $patterns | ForEach-Object { "$CdnBase/$_" }
}

$total = $weapons.Count
$downloaded = 0
$skipped = 0
$failed = 0
$manifest = @{}

for ($i = 0; $i -lt $total; $i++) {
  $w = $weapons[$i]
  $destPath = Join-Path $OutputDir "$($w.id).png"
  $pct = [Math]::Round(($i + 1) / $total * 100, 1)

  Write-Progress -Activity "Downloading weapon images" -Status "$($w.name) ($pct%)" -PercentComplete $pct

  if (Test-Path $destPath) {
    $skipped++
    $manifest[$w.name] = "$($w.id).png"
    continue
  }

  $urls = Get-Url $w.name $w.category $w.is_dlc
  $found = $false

  for ($try = 1; $try -le 3; $try++) {
    foreach ($url in $urls) {
      if (Test-Url $url) {
        try {
          $wc = New-Object System.Net.WebClient
          $wc.DownloadFile($url, $destPath)
          $wc.Dispose()
          $downloaded++
          $found = $true
          $manifest[$w.name] = "$($w.id).png"
          break
        } catch {
          continue
        }
      }
    }
    if ($found) { break }
    Start-Sleep -Milliseconds 1000
  }

  if (-not $found) { $failed++ }
}

Write-Progress -Activity "Downloading weapon images" -Completed

Write-Host "`n--- Summary ---" -ForegroundColor Yellow
Write-Host "Downloaded: $downloaded" -ForegroundColor Green
Write-Host "Skipped: $skipped" -ForegroundColor Gray
Write-Host "Failed: $failed" -ForegroundColor Red

# Build manifest from all existing files
Get-ChildItem -Path $OutputDir -Filter "*.png" | ForEach-Object {
  $id = [int]($_.BaseName)
  $w = $weapons | Where-Object { $_.id -eq $id } | Select-Object -First 1
  if ($w -and -not $manifest.ContainsKey($w.name)) {
    $manifest[$w.name] = $_.Name
  }
}

$manifest | ConvertTo-Json | Set-Content -Path $ManifestPath -Encoding UTF8
Write-Host "Manifest: $ManifestPath ($($manifest.Count) entries)" -ForegroundColor Cyan
