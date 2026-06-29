param([switch]$Force)

$ErrorActionPreference = 'Continue'
$ProgressPreference = 'SilentlyContinue'
[Net.ServicePointManager]::SecurityProtocol = [Net.SecurityProtocolType]::Tls12
Add-Type -AssemblyName System.Security

function Test-FandomFile($fn) {
    $bytes = [System.Text.Encoding]::UTF8.GetBytes($fn)
    $hash = [System.Security.Cryptography.MD5]::Create().ComputeHash($bytes)
    $hex = [BitConverter]::ToString($hash) -replace '-', ''
    $p = [string]::Concat($hex.Substring(0,1).ToLower(), '/', $hex.Substring(0,2).ToLower())
    $url = "https://static.wikia.nocookie.net/eldenring/images/$p/$fn/revision/latest?format=original"
    try {
        $r = Invoke-WebRequest -Uri $url -UseBasicParsing -TimeoutSec 10 -Method Head
        return ($r.StatusCode -eq 200)
    } catch { return $false }
}

function Get-FandomUrl($fn) {
    $bytes = [System.Text.Encoding]::UTF8.GetBytes($fn)
    $hash = [System.Security.Cryptography.MD5]::Create().ComputeHash($bytes)
    $hex = [BitConverter]::ToString($hash) -replace '-', ''
    $p = [string]::Concat($hex.Substring(0,1).ToLower(), '/', $hex.Substring(0,2).ToLower())
    return "https://static.wikia.nocookie.net/eldenring/images/$p/$fn/revision/latest?format=original"
}

$root = Split-Path -Parent (Split-Path -Parent $PSCommandPath)
$outDir = Join-Path $root 'public\images\weapons'

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

# Map: sanitized local filename -> original weapon name
$items = @{}
$baseRaw = Get-Content -Raw (Join-Path $root 'public\data\armaments.json') -Encoding UTF8 | ConvertFrom-Json
$dlcRaw = Get-Content -Raw (Join-Path $root 'public\data\dlc-armaments.json') -Encoding UTF8 | ConvertFrom-Json
$baseRaw.PSObject.Properties | ForEach-Object { $items[$_.Name] = $_.Value }
$dlcRaw.PSObject.Properties | ForEach-Object { $items[$_.Name] = $_.Value }

# Build map: local filename -> name_en
$localToName = @{}
foreach ($w in $items.Values) {
    $n = if ($w.name_en) { $w.name_en.ToString().Trim() } elseif ($w.name) { $w.name.ToString().Trim() } else { '' }
    if ($n) {
        $sanitized = $n -replace '[<>:""/\\|?*''''!.,&()]', '' -replace '\s+', '_' -replace '_+', '_'
        $sanitized = $sanitized.Trim('_')
        $localToName["$sanitized.png"] = $n
    }
}

# Weapons that still need fixing
$fixWeapons = @(
    "Bonny Butchering Knife"
    "Deadly Poison Perfume Bottle"
    "Greatsword of Radahn (Light)"
    "Moonrithyll's Knight Sword"
    "Serpent Crest Shield"
    "St. Trina's Torch"
    "Verdigris Greatshield"
    "Wolf Crest Shield"
)

$needDl = @()
foreach ($w in $fixWeapons) {
    $sanitized = $w -replace '[<>:""/\\|?*''''!.,&()]', '' -replace '\s+', '_' -replace '_+', '_'
    $sanitized = $sanitized.Trim('_')
    $dest = Join-Path $outDir "$sanitized.png"
    if ((Test-Path $dest) -and (Get-Item $dest).Length -gt 20000) {
        Write-Host "Already have: $w"
    } else {
        $needDl += @{Name=$w; Dest=$dest; Sanitized=$sanitized}
    }
}

Write-Host "Need to fix: $($needDl.Count)"
Write-Host ""

foreach ($w in $needDl) {
    $name = $w.Name
    $dest = $w.Dest
    $sanitized = $w.Sanitized
    
    $nameClean = Remove-Accents $name
    
    # Generate filenames to try (with periods, without periods, with parentheses)
    $variants = @()
    # 1. Keep periods and parens
    $v1 = $nameClean -replace ' ', '_'
    $variants += $v1
    # 2. Remove periods but keep parens
    $v2 = $nameClean -replace '\.', '' -replace ' ', '_'
    if ($v2 -ne $v1) { $variants += $v2 }
    # 3. Remove parens but keep periods
    $v3 = $nameClean -replace '[()]', '' -replace ' ', '_'
    if ($v3 -ne $v1 -and $v3 -ne $v2) { $variants += $v3 }
    # 4. Remove both
    $v4 = $nameClean -replace '[.()]', '' -replace ' ', '_'
    if ($v4 -ne $v1 -and $v4 -ne $v2 -and $v4 -ne $v3) { $variants += $v4 }
    # 5. Hyphen variants (replace spaces with hyphens too)
    $v5 = $v1 -replace '_', '-'
    if ($v5 -ne $v1) { $variants += $v5 }
    
    $downloaded = $false
    $prefixes = @('ER_Icon_weapon', 'ER_Icon_Weapon', 'ER_Icon_shield')
    
    foreach ($prefix in $prefixes) {
        foreach ($v in $variants) {
            $fn = "${prefix}_$v.png"
            $url = Get-FandomUrl $fn
            try {
                Invoke-WebRequest -Uri $url -OutFile $dest -UseBasicParsing -TimeoutSec 15
                if ((Get-Item $dest).Length -gt 20000) {
                    Write-Host "OK: $name (${prefix}_$v)"
                    $downloaded = $true
                    break
                } else {
                    Remove-Item $dest -Force -ErrorAction SilentlyContinue
                }
            } catch { continue }
        }
        if ($downloaded) { break }
    }
    
    if (-not $downloaded) {
        Write-Host "NOT FOUND: $name"
        # Restore the small file from backup (copy from existing API source)
        # But we don't have a backup - the small file was the API version and got replaced with 0 bytes
        # Actually the small file still exists with the original content (we only removed failed downloads in the catch)
    }
}

Write-Host "`nDone."
