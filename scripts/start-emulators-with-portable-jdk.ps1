$ErrorActionPreference = 'Stop'

$root = Resolve-Path "$PSScriptRoot\.."
$toolsDir = Join-Path $root '.tools/jdk/temurin-17'

$jdkDir = Get-ChildItem -Path $toolsDir -Directory | Select-Object -First 1
if (-not $jdkDir) {
  Write-Error "JDK not found under $toolsDir. Run scripts/download-portable-jdk.ps1 first."
  exit 1
}

$env:JAVA_HOME = $jdkDir.FullName
$env:PATH = "$($env:JAVA_HOME)\bin;" + $env:PATH

Write-Host "Using JAVA_HOME=$($env:JAVA_HOME)"

# Start Firebase emulators (Auth, Firestore, Functions, Storage)
npx firebase emulators:start --only firestore,auth,functions,storage
