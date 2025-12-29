param(
  [string]$VersionTag = 'jdk-17.0.16+8',
  [string]$ZipName = 'OpenJDK17U-jdk_x64_windows_hotspot_17.0.16_8.zip'
)

$ErrorActionPreference = 'Stop'

# Resolve repo root (this script is in scripts/)
$root = Resolve-Path "$PSScriptRoot\.."
$toolsDir = Join-Path $root '.tools/jdk'

Write-Host "Creating tools directory at: $toolsDir"
New-Item -ItemType Directory -Force -Path $toolsDir | Out-Null

$zipPath = Join-Path $toolsDir $ZipName
$encodedTag = ($VersionTag -replace '\+','%2B')
$url = "https://github.com/adoptium/temurin17-binaries/releases/download/$encodedTag/$ZipName"

Write-Host "Downloading JDK from $url"
Invoke-WebRequest -Uri $url -OutFile $zipPath

$extractDir = Join-Path $toolsDir 'temurin-17'
if (Test-Path $extractDir) { Remove-Item -Recurse -Force $extractDir }
New-Item -ItemType Directory -Force -Path $extractDir | Out-Null

Write-Host "Extracting $zipPath to $extractDir"
Expand-Archive -Path $zipPath -DestinationPath $extractDir

$jdkDir = Get-ChildItem -Path $extractDir -Directory | Select-Object -First 1
if (-not $jdkDir) {
  Write-Error "Extraction failed: no JDK directory found under $extractDir"
  exit 1
}

Write-Host "JDK extracted to: $($jdkDir.FullName)"

