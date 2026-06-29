param([switch]$Force)

$ErrorActionPreference = 'Continue'
$ProgressPreference = 'SilentlyContinue'
[Net.ServicePointManager]::SecurityProtocol = [Net.SecurityProtocolType]::Tls12
Add-Type -AssemblyName System.Security

# Accent stripping
function Remove-Accents($s) {
    $norm = $s.Normalize([System.Text.NormalizationForm]::FormD)
    $sb = New-Object System.Text.StringBuilder
    foreach ($c in $norm.ToCharArray()) {
        if ([System.Globalization.CharUnicodeInfo]::GetUnicodeCategory($c) -ne [System.Globalization.UnicodeCategory]::NonSpacingMark) {
            $null = $sb.Append($c)
        }
    }
    return $sb.ToString().Normalize([System.Text.NormalizationForm]::FormC)
}

function Get-FandomUrl($fn) {
    $bytes = [System.Text.Encoding]::UTF8.GetBytes($fn)
    $hash = [System.Security.Cryptography.MD5]::Create().ComputeHash($bytes)
    $hex = [BitConverter]::ToString($hash) -replace '-', ''
    $p = [string]::Concat($hex.Substring(0,1).ToLower(), '/', $hex.Substring(0,2).ToLower())
    return "https://static.wikia.nocookie.net/eldenring/images/$p/$fn/revision/latest?format=original"
}

$Root = Split-Path -Parent (Split-Path -Parent $PSCommandPath)
$OutDir = Join-Path $Root 'public\images\weapons'

# Load weapon names
$items = @{}
$baseRaw = Get-Content -Raw (Join-Path $Root 'public\data\armaments.json') -Encoding UTF8 | ConvertFrom-Json
$dlcRaw = Get-Content -Raw (Join-Path $Root 'public\data\dlc-armaments.json') -Encoding UTF8 | ConvertFrom-Json
$baseRaw.PSObject.Properties | ForEach-Object { $items[$_.Name] = $_.Value }
$dlcRaw.PSObject.Properties | ForEach-Object { $items[$_.Name] = $_.Value }

$names = @()
foreach ($w in $items.Values) {
    $n = if ($w.name_en) { $w.name_en.ToString().Trim() } elseif ($w.name) { $w.name.ToString().Trim() } else { '' }
    if ($n) { $names += $n }
}
$names = $names | Sort-Object -Unique

$smallFiles = Get-ChildItem $OutDir -Filter *.png | Where-Object { -not $Force -and $_.Length -le 20000 } | ForEach-Object { $_.Name }
$smallMap = @{}
foreach ($f in $smallFiles) { $smallMap[$f] = $true }
Write-Host "Small files needing replacement: $($smallMap.Count)"

$ok = 0; $fail = 0; $skipNotSmall = 0

foreach ($name in $names) {
    # Compute sanitized filename locally (matches the existing file)
    $sanitized = $name -replace '[<>:""/\\|?*''’!.,&()]', '' -replace '\s+', '_' -replace '_+', '_'
    $sanitized = $sanitized.Trim('_')
    $localFile = "$sanitized.png"

    if (-not $smallMap.ContainsKey($localFile)) {
        $skipNotSmall++
        continue
    }

    $dest = Join-Path $OutDir $localFile

    # Remove accents for Fandom URL construction
    $nameClean = Remove-Accents $name
    $namePart = $nameClean -replace '[.()]', '' -replace ' ', '_'

    # Try patterns
    $downloaded = $false
    $prefixes = @('ER_Icon_weapon', 'ER_Icon_Weapon', 'ER_Icon_shield')
    foreach ($prefix in $prefixes) {
        $fn = "${prefix}_$namePart.png"
        $url = Get-FandomUrl $fn
        try {
            Invoke-WebRequest -Uri $url -OutFile $dest -UseBasicParsing -TimeoutSec 15
            if ((Get-Item $dest).Length -gt 20000) {
                Write-Host "OK: $name"
                $ok++
                $downloaded = $true
                break
            } else {
                Remove-Item $dest -Force -ErrorAction SilentlyContinue
            }
        } catch { continue }
    }

    if (-not $downloaded) {
        Write-Host "NOT FOUND: $name"
        $fail++
    }
}

Write-Host "`n=== Result ==="
Write-Host "  Downloaded: $ok | Skipped(already large): $skipNotSmall | Not found: $fail | Total: $($names.Count)"
