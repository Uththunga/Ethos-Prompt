# PowerShell script to fix CORS in all Cloud Functions
# Adds port 5174 to all CORS origin lists

$filePath = "functions\main.py"

# Read the file content
$content = Get-Content $filePath -Raw

# Define the old pattern (without 5174)
$oldPattern = @'
            "http://localhost:5173",
            "http://127.0.0.1:5000"
'@

# Define the new pattern (with 5174)
$newPattern = @'
            "http://localhost:5173",
            "http://localhost:5174",
            "http://127.0.0.1:5000",
            "http://127.0.0.1:5173",
            "http://127.0.0.1:5174"
'@

# Replace all occurrences
$newContent = $content -replace [regex]::Escape($oldPattern), $newPattern

# Write back to file
$newContent | Set-Content $filePath -NoNewline

Write-Host "✅ Updated CORS configuration in $filePath"
Write-Host "   Added ports 5174 to all CORS origin lists"

