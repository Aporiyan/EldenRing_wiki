param([switch]$Force)

$ErrorActionPreference = 'Stop'
$ProgressPreference = 'SilentlyContinue'

$ProjectRoot = Split-Path -Parent (Split-Path -Parent $PSCommandPath)
$OutDir = Join-Path $ProjectRoot 'public\images\weapons'
$ManifestPath = Join-Path $ProjectRoot 'public\data\weapon-images.json'
$ArmPath = Join-Path $ProjectRoot 'public\data\armaments.json'
$DlcArmPath = Join-Path $ProjectRoot 'public\data\dlc-armaments.json'

[Net.ServicePointManager]::SecurityProtocol = [Net.SecurityProtocolType]::Tls12
Add-Type -AssemblyName System.Security

function Get-FandomUrl($nameEn, $prefix) {
    $namePart = $nameEn -replace ' ', '_'
    $filename = "${prefix}_$namePart.png"
    $bytes = [System.Text.Encoding]::UTF8.GetBytes($filename)
    $hash = [System.Security.Cryptography.MD5]::Create().ComputeHash($bytes)
    $hex = [BitConverter]::ToString($hash) -replace '-', ''
    $p = $hex.Substring(0,1).ToLower() + '/' + $hex.Substring(0,2).ToLower()
    return "https://static.wikia.nocookie.net/eldenring/images/$p/$filename/revision/latest?format=original"
}

function Test-Url($url) {
    try {
        $r = Invoke-WebRequest -Uri $url -UseBasicParsing -TimeoutSec 10 -Method Head
        return ($r.StatusCode -eq 200)
    } catch { return $false }
}

# Load all weapon names
$names = @()
$baseRaw = Get-Content -Raw $ArmPath -Encoding UTF8 | ConvertFrom-Json
$dlcRaw = Get-Content -Raw $DlcArmPath -Encoding UTF8 | ConvertFrom-Json
$allItems = @($baseRaw.PSObject.Properties.Value) + @($dlcRaw.PSObject.Properties.Value)
foreach ($w in $allItems) {
    $n = if ($w.name_en) { $w.name_en.ToString().Trim() } elseif ($w.name) { $w.name.ToString().Trim() } else { '' }
    if ($n) { $names += $n }
}
$names = $names | Sort-Object -Unique
Write-Host "Total weapons: $($names.Count)"

$ok = 0; $fail = 0; $skipExists = 0
$i = 0

foreach ($name in $names) {
    $i++
    $sanitized = $name -replace '[<>:""/\\|?*''’!.,&()]', '' -replace '\s+', '_' -replace '_+', '_'
    $sanitized = $sanitized.Trim('_')
    $dest = Join-Path $OutDir "$sanitized.png"

    if (-not $Force -and (Test-Path $dest) -and (Get-Item $dest).Length -gt 20000) {
        $skipExists++
        continue
    }

    # Try both patterns
    $url = $null
    foreach ($prefix in @('ER_Icon_Weapon', 'ER_Icon_weapon')) {
        $u = Get-FandomUrl $name $prefix
        if (Test-Url $u) { $url = $u; break }
    }

    if (-not $url) {
        Write-Host "  [$i/$($names.Count)] $name -> NOT FOUND"
        $fail++
        continue
    }

    Write-Host "  [$i/$($names.Count)] $name"
    try {
        Invoke-WebRequest -Uri $url -OutFile $dest -UseBasicParsing -TimeoutSec 30
        $ok++
    } catch {
        $fail++
        Write-Warning "    FAILED: $name"
    }
}

Write-Host "`n=== Result ==="
Write-Host "  Downloaded: $ok | Skipped(existing): $skipExists | Not found: $fail | Total: $($names.Count)"
