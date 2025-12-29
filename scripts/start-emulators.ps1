$ErrorActionPreference = 'Stop'

# Set JAVA_HOME to portable JDK inside repo and prepend to PATH for this process
$javaHomePath = (Resolve-Path ".tools/jdk/temurin-17/jdk-17.0.16+8").Path
$env:JAVA_HOME = $javaHomePath
$env:Path = "$env:JAVA_HOME\bin;" + $env:Path

Write-Host "JAVA_HOME=$env:JAVA_HOME"

# Show Java version to verify it's available
& java -version

# Start Firebase emulators (firestore, auth, functions, storage)
& npx firebase-tools emulators:start --only firestore,auth,functions,storage --project demo-test --import=./emulator-data --export-on-exit
