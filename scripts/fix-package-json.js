#!/usr/bin/env node

/**
 * Fix package.json by removing comments (JSON doesn't support comments)
 */

const fs = require('fs');
const path = require('path');

const packageJsonPath = path.join(process.cwd(), 'frontend', 'package.json');

try {
  // Read the file
  const content = fs.readFileSync(packageJsonPath, 'utf8');
  
  // Remove comment lines (lines that start with // after whitespace)
  const lines = content.split('\n');
  const cleanedLines = lines.filter(line => {
    const trimmed = line.trim();
    return !trimmed.startsWith('//');
  });
  
  // Join back and write
  const cleanedContent = cleanedLines.join('\n');
  fs.writeFileSync(packageJsonPath, cleanedContent, 'utf8');
  
  console.log('✅ Fixed package.json - removed comments');
  
  // Validate JSON
  try {
    JSON.parse(cleanedContent);
    console.log('✅ JSON is valid');
  } catch (error) {
    console.error('❌ JSON is still invalid:', error.message);
    process.exit(1);
  }
  
} catch (error) {
  console.error('❌ Error fixing package.json:', error.message);
  process.exit(1);
}
