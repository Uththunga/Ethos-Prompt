# Fix CORS configuration for staging environment
# Adds staging URLs to all CORS configurations in main.py

$filePath = "main.py"
$content = Get-Content $filePath -Raw

# Define the old pattern (without staging)
$oldPattern = @'
            # Production origins
            "https://react-app-000730.web.app",
            "https://react-app-000730.firebaseapp.com",
            "https://rag-prompt-library.web.app",
            "https://rag-prompt-library.firebaseapp.com",
            # Development origins
'@

# Define the new pattern (with staging)
$newPattern = @'
            # Production origins
            "https://react-app-000730.web.app",
            "https://react-app-000730.firebaseapp.com",
            "https://rag-prompt-library.web.app",
            "https://rag-prompt-library.firebaseapp.com",
            # Staging origins
            "https://rag-prompt-library-staging.web.app",
            "https://rag-prompt-library-staging.firebaseapp.com",
            # Development origins
'@

# Count occurrences before replacement
$countBefore = ([regex]::Matches($content, [regex]::Escape($oldPattern))).Count

# Replace all occurrences
$updatedContent = $content -replace [regex]::Escape($oldPattern), $newPattern

# Count occurrences after replacement
$countAfter = ([regex]::Matches($updatedContent, [regex]::Escape($newPattern))).Count

# Write back
Set-Content -Path $filePath -Value $updatedContent -NoNewline

Write-Host "✅ Updated CORS configurations in main.py" -ForegroundColor Green
Write-Host "   Found and updated: $countBefore occurrences" -ForegroundColor Cyan
Write-Host "   Verified: $countAfter configurations now include staging URLs" -ForegroundColor Cyan
Write-Host ""
Write-Host "✅ Added staging URLs:" -ForegroundColor Green
Write-Host "   - https://rag-prompt-library-staging.web.app" -ForegroundColor Yellow
Write-Host "   - https://rag-prompt-library-staging.firebaseapp.com" -ForegroundColor Yellow

