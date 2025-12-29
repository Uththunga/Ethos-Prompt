const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

/**
 * Comprehensive Image Duplication Analysis Script
 * Analyzes duplicate images across assets/images and assets/marketing directories
 */

class ImageDuplicationAnalyzer {
  constructor() {
    this.imagesDir = 'frontend/public/assets/images';
    this.marketingDir = 'frontend/public/assets/marketing';
    this.srcDir = 'frontend/src';
    
    this.imageFiles = new Map(); // hash -> [file paths]
    this.references = new Map(); // directory -> count
    this.fileDetails = [];
  }

  /**
   * Calculate MD5 hash of a file
   */
  getFileHash(filePath) {
    const fileBuffer = fs.readFileSync(filePath);
    const hashSum = crypto.createHash('md5');
    hashSum.update(fileBuffer);
    return hashSum.digest('hex');
  }

  /**
   * Recursively scan directory for image files
   */
  scanDirectory(dir, baseDir) {
    if (!fs.existsSync(dir)) {
      console.log(`⚠️  Directory not found: ${dir}`);
      return;
    }

    const items = fs.readdirSync(dir);
    
    items.forEach(item => {
      const fullPath = path.join(dir, item);
      const stat = fs.statSync(fullPath);
      
      if (stat.isDirectory()) {
        this.scanDirectory(fullPath, baseDir);
      } else if (this.isImageFile(item)) {
        const hash = this.getFileHash(fullPath);
        const relativePath = path.relative(baseDir, fullPath);
        const size = stat.size;
        
        if (!this.imageFiles.has(hash)) {
          this.imageFiles.set(hash, []);
        }
        
        this.imageFiles.get(hash).push({
          path: fullPath,
          relativePath: relativePath,
          name: item,
          size: size,
          directory: baseDir
        });
        
        this.fileDetails.push({
          hash,
          path: fullPath,
          relativePath,
          name: item,
          size,
          directory: baseDir
        });
      }
    });
  }

  /**
   * Check if file is an image
   */
  isImageFile(filename) {
    const imageExtensions = ['.png', '.jpg', '.jpeg', '.svg', '.gif', '.webp', '.ico', '.bmp'];
    return imageExtensions.some(ext => filename.toLowerCase().endsWith(ext));
  }

  /**
   * Search for references in source code
   */
  searchReferences(searchDir) {
    const references = {
      'assets/images': [],
      'assets/marketing': []
    };

    const searchInFile = (filePath) => {
      const content = fs.readFileSync(filePath, 'utf8');
      const lines = content.split('\n');
      
      lines.forEach((line, index) => {
        if (line.includes('assets/images') && !line.includes('assets/marketing')) {
          references['assets/images'].push({
            file: path.relative(searchDir, filePath),
            line: index + 1,
            content: line.trim()
          });
        }
        if (line.includes('assets/marketing')) {
          references['assets/marketing'].push({
            file: path.relative(searchDir, filePath),
            line: index + 1,
            content: line.trim()
          });
        }
      });
    };

    const scanForReferences = (dir) => {
      if (!fs.existsSync(dir)) return;
      
      const items = fs.readdirSync(dir);
      items.forEach(item => {
        const fullPath = path.join(dir, item);
        const stat = fs.statSync(fullPath);
        
        if (stat.isDirectory() && !item.includes('node_modules') && !item.includes('dist')) {
          scanForReferences(fullPath);
        } else if (this.isSourceFile(item)) {
          searchInFile(fullPath);
        }
      });
    };

    scanForReferences(searchDir);
    return references;
  }

  /**
   * Check if file is a source code file
   */
  isSourceFile(filename) {
    const sourceExtensions = ['.tsx', '.ts', '.jsx', '.js', '.css', '.scss', '.html'];
    return sourceExtensions.some(ext => filename.endsWith(ext));
  }

  /**
   * Generate comprehensive report
   */
  generateReport() {
    console.log('🔍 Starting Image Duplication Analysis...\n');
    
    // Scan both directories
    console.log('📂 Scanning directories...');
    this.scanDirectory(this.imagesDir, 'frontend/public');
    this.scanDirectory(this.marketingDir, 'frontend/public');
    
    // Search for references
    console.log('🔎 Searching for references in source code...');
    const references = this.searchReferences(this.srcDir);
    
    // Identify duplicates
    const duplicates = Array.from(this.imageFiles.entries())
      .filter(([hash, files]) => files.length > 1)
      .map(([hash, files]) => ({ hash, files }));
    
    // Generate report
    const report = {
      timestamp: new Date().toISOString(),
      summary: {
        totalImages: this.fileDetails.length,
        uniqueImages: this.imageFiles.size,
        duplicateGroups: duplicates.length,
        totalDuplicates: duplicates.reduce((sum, d) => sum + d.files.length, 0),
        imagesInAssetsImages: this.fileDetails.filter(f => f.directory.includes('assets/images')).length,
        imagesInAssetsMarketing: this.fileDetails.filter(f => f.directory.includes('assets/marketing')).length
      },
      references: {
        'assets/images': {
          count: references['assets/images'].length,
          files: [...new Set(references['assets/images'].map(r => r.file))],
          examples: references['assets/images'].slice(0, 10)
        },
        'assets/marketing': {
          count: references['assets/marketing'].length,
          files: [...new Set(references['assets/marketing'].map(r => r.file))],
          examples: references['assets/marketing'].slice(0, 10)
        }
      },
      duplicates: duplicates.map(d => ({
        hash: d.hash,
        count: d.files.length,
        size: d.files[0].size,
        sizeFormatted: this.formatBytes(d.files[0].size),
        files: d.files.map(f => ({
          name: f.name,
          path: f.relativePath,
          directory: f.directory.includes('marketing') ? 'assets/marketing' : 'assets/images'
        }))
      })),
      recommendation: this.generateRecommendation(references, duplicates)
    };
    
    return report;
  }

  /**
   * Generate consolidation recommendation
   */
  generateRecommendation(references, duplicates) {
    const imagesRefCount = references['assets/images'].length;
    const marketingRefCount = references['assets/marketing'].length;
    
    const primaryDirectory = marketingRefCount > imagesRefCount ? 'assets/marketing' : 'assets/images';
    const secondaryDirectory = primaryDirectory === 'assets/marketing' ? 'assets/images' : 'assets/marketing';
    
    return {
      primaryDirectory,
      secondaryDirectory,
      reasoning: `The ${primaryDirectory} directory has ${Math.max(imagesRefCount, marketingRefCount)} references vs ${Math.min(imagesRefCount, marketingRefCount)} in ${secondaryDirectory}`,
      strategy: 'Keep files in the most-referenced directory and remove duplicates from the other',
      estimatedSpaceSavings: this.calculateSpaceSavings(duplicates)
    };
  }

  /**
   * Calculate potential space savings
   */
  calculateSpaceSavings(duplicates) {
    const totalDuplicateSize = duplicates.reduce((sum, d) => {
      return sum + (d.files[0].size * (d.files.length - 1));
    }, 0);
    
    return this.formatBytes(totalDuplicateSize);
  }

  /**
   * Format bytes to human-readable format
   */
  formatBytes(bytes) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
  }

  /**
   * Save report to file
   */
  saveReport(report) {
    const reportPath = 'reports/image-duplication-analysis.json';
    const reportDir = path.dirname(reportPath);
    
    if (!fs.existsSync(reportDir)) {
      fs.mkdirSync(reportDir, { recursive: true });
    }
    
    fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
    console.log(`\n✅ Report saved to: ${reportPath}`);
    
    // Also create a human-readable markdown report
    this.saveMarkdownReport(report);
  }

  /**
   * Save markdown report
   */
  saveMarkdownReport(report) {
    const mdPath = 'reports/IMAGE_DUPLICATION_REPORT.md';
    
    let md = `# Image Duplication Analysis Report\n\n`;
    md += `**Generated:** ${new Date(report.timestamp).toLocaleString()}\n\n`;
    md += `## Executive Summary\n\n`;
    md += `- **Total Images:** ${report.summary.totalImages}\n`;
    md += `- **Unique Images:** ${report.summary.uniqueImages}\n`;
    md += `- **Duplicate Groups:** ${report.summary.duplicateGroups}\n`;
    md += `- **Total Duplicate Files:** ${report.summary.totalDuplicates}\n`;
    md += `- **Potential Space Savings:** ${report.recommendation.estimatedSpaceSavings}\n\n`;
    
    md += `## Directory Distribution\n\n`;
    md += `- **assets/images:** ${report.summary.imagesInAssetsImages} files\n`;
    md += `- **assets/marketing:** ${report.summary.imagesInAssetsMarketing} files\n\n`;
    
    md += `## Codebase Usage Analysis\n\n`;
    md += `### assets/images References\n`;
    md += `- **Total References:** ${report.references['assets/images'].count}\n`;
    md += `- **Files Referencing:** ${report.references['assets/images'].files.length}\n\n`;
    
    md += `### assets/marketing References\n`;
    md += `- **Total References:** ${report.references['assets/marketing'].count}\n`;
    md += `- **Files Referencing:** ${report.references['assets/marketing'].files.length}\n\n`;
    
    md += `## Recommendation\n\n`;
    md += `**Primary Directory:** \`${report.recommendation.primaryDirectory}\`\n\n`;
    md += `**Reasoning:** ${report.recommendation.reasoning}\n\n`;
    md += `**Strategy:** ${report.recommendation.strategy}\n\n`;
    
    md += `## Duplicate Files Found\n\n`;
    report.duplicates.forEach((dup, index) => {
      md += `### Duplicate Group ${index + 1}\n`;
      md += `- **Size:** ${dup.sizeFormatted}\n`;
      md += `- **Files:**\n`;
      dup.files.forEach(file => {
        md += `  - \`${file.path}\` (${file.directory})\n`;
      });
      md += `\n`;
    });
    
    fs.writeFileSync(mdPath, md);
    console.log(`✅ Markdown report saved to: ${mdPath}`);
  }
}

// Run the analysis
const analyzer = new ImageDuplicationAnalyzer();
const report = analyzer.generateReport();
analyzer.saveReport(report);

console.log('\n📊 Analysis Complete!');
console.log(`\n🎯 Recommendation: Use ${report.recommendation.primaryDirectory} as primary directory`);
console.log(`💾 Potential space savings: ${report.recommendation.estimatedSpaceSavings}`);

