/**
 * Image Optimization Utilities
 * Provides client-side image processing and optimization
 */

interface ImageOptimizationOptions {
  maxWidth?: number;
  maxHeight?: number;
  quality?: number;
  format?: 'jpeg' | 'png' | 'webp';
  maintainAspectRatio?: boolean;
}

interface ImageMetadata {
  width: number;
  height: number;
  size: number;
  format: string;
  aspectRatio: number;
}

class ImageOptimizer {
  /**
   * Compress and resize an image file
   */
  async optimizeImage(
    file: File,
    options: ImageOptimizationOptions = {}
  ): Promise<{ file: File; metadata: ImageMetadata; originalMetadata: ImageMetadata }> {
    const {
      maxWidth = 1920,
      maxHeight = 1080,
      quality = 0.8,
      format = 'jpeg',
      maintainAspectRatio = true
    } = options;

    // Get original metadata
    const originalMetadata = await this.getImageMetadata(file);

    return new Promise((resolve, reject) => {
      const img = new Image();
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');

      if (!ctx) {
        reject(new Error('Canvas context not available'));
        return;
      }

      img.onload = () => {
        try {
          // Calculate new dimensions
          const { width: newWidth, height: newHeight } = this.calculateDimensions(
            img.width,
            img.height,
            maxWidth,
            maxHeight,
            maintainAspectRatio
          );

          // Set canvas dimensions
          canvas.width = newWidth;
          canvas.height = newHeight;

          // Draw and compress image
          ctx.drawImage(img, 0, 0, newWidth, newHeight);

          // Convert to blob
          canvas.toBlob(
            (blob) => {
              if (!blob) {
                reject(new Error('Failed to create blob'));
                return;
              }

              // Create new file
              const optimizedFile = new File(
                [blob],
                this.generateOptimizedFileName(file.name, format),
                { type: `image/${format}` }
              );

              const metadata: ImageMetadata = {
                width: newWidth,
                height: newHeight,
                size: blob.size,
                format,
                aspectRatio: newWidth / newHeight
              };

              resolve({
                file: optimizedFile,
                metadata,
                originalMetadata
              });
            },
            `image/${format}`,
            quality
          );
        } catch (error) {
          reject(error);
        }
      };

      img.onerror = () => reject(new Error('Failed to load image'));
      img.src = URL.createObjectURL(file);
    });
  }

  /**
   * Get image metadata without loading the full image
   */
  async getImageMetadata(file: File): Promise<ImageMetadata> {
    return new Promise((resolve, reject) => {
      const img = new Image();
      
      img.onload = () => {
        const metadata: ImageMetadata = {
          width: img.width,
          height: img.height,
          size: file.size,
          format: file.type.split('/')[1] || 'unknown',
          aspectRatio: img.width / img.height
        };
        
        URL.revokeObjectURL(img.src);
        resolve(metadata);
      };

      img.onerror = () => {
        URL.revokeObjectURL(img.src);
        reject(new Error('Failed to load image for metadata'));
      };

      img.src = URL.createObjectURL(file);
    });
  }

  /**
   * Calculate optimal dimensions while maintaining aspect ratio
   */
  private calculateDimensions(
    originalWidth: number,
    originalHeight: number,
    maxWidth: number,
    maxHeight: number,
    maintainAspectRatio: boolean
  ): { width: number; height: number } {
    if (!maintainAspectRatio) {
      return {
        width: Math.min(originalWidth, maxWidth),
        height: Math.min(originalHeight, maxHeight)
      };
    }

    const aspectRatio = originalWidth / originalHeight;
    
    let newWidth = originalWidth;
    let newHeight = originalHeight;

    // Scale down if too wide
    if (newWidth > maxWidth) {
      newWidth = maxWidth;
      newHeight = newWidth / aspectRatio;
    }

    // Scale down if too tall
    if (newHeight > maxHeight) {
      newHeight = maxHeight;
      newWidth = newHeight * aspectRatio;
    }

    return {
      width: Math.round(newWidth),
      height: Math.round(newHeight)
    };
  }

  /**
   * Generate optimized file name
   */
  private generateOptimizedFileName(originalName: string, format: string): string {
    const nameWithoutExt = originalName.replace(/\.[^/.]+$/, '');
    const timestamp = Date.now();
    return `${nameWithoutExt}_optimized_${timestamp}.${format}`;
  }

  /**
   * Create thumbnail from image file
   */
  async createThumbnail(
    file: File,
    size: number = 150,
    quality: number = 0.7
  ): Promise<File> {
    const result = await this.optimizeImage(file, {
      maxWidth: size,
      maxHeight: size,
      quality,
      format: 'jpeg',
      maintainAspectRatio: true
    });

    return new File(
      [result.file],
      `thumb_${file.name}`,
      { type: result.file.type }
    );
  }

  /**
   * Convert image to WebP format
   */
  async convertToWebP(file: File, quality: number = 0.8): Promise<File> {
    const result = await this.optimizeImage(file, {
      quality,
      format: 'webp'
    });

    return result.file;
  }

  /**
   * Batch optimize multiple images
   */
  async optimizeImages(
    files: File[],
    options: ImageOptimizationOptions = {}
  ): Promise<Array<{
    original: File;
    optimized: File;
    metadata: ImageMetadata;
    originalMetadata: ImageMetadata;
    compressionRatio: number;
  }>> {
    const results = await Promise.all(
      files.map(async (file) => {
        try {
          const result = await this.optimizeImage(file, options);
          const compressionRatio = result.originalMetadata.size / result.metadata.size;
          
          return {
            original: file,
            optimized: result.file,
            metadata: result.metadata,
            originalMetadata: result.originalMetadata,
            compressionRatio
          };
        } catch (error) {
          console.error(`Failed to optimize ${file.name}:`, error);
          throw error;
        }
      })
    );

    return results;
  }

  /**
   * Check if image needs optimization
   */
  shouldOptimize(
    metadata: ImageMetadata,
    maxSize: number = 1024 * 1024, // 1MB
    maxDimension: number = 1920
  ): boolean {
    return (
      metadata.size > maxSize ||
      metadata.width > maxDimension ||
      metadata.height > maxDimension
    );
  }

  /**
   * Generate responsive image sizes
   */
  async generateResponsiveSizes(
    file: File,
    breakpoints: number[] = [480, 768, 1024, 1440, 1920]
  ): Promise<Array<{ width: number; file: File }>> {
    const originalMetadata = await this.getImageMetadata(file);
    const aspectRatio = originalMetadata.aspectRatio;

    const results = await Promise.all(
      breakpoints
        .filter(width => width <= originalMetadata.width) // Only generate smaller sizes
        .map(async (width) => {
          const height = Math.round(width / aspectRatio);
          const result = await this.optimizeImage(file, {
            maxWidth: width,
            maxHeight: height,
            quality: 0.8,
            format: 'webp'
          });

          return {
            width,
            file: result.file
          };
        })
    );

    return results;
  }
}

// Singleton instance
export const imageOptimizer = new ImageOptimizer();

// Utility functions
export const imageUtils = {
  /**
   * Check if file is an image
   */
  isImage: (file: File): boolean => {
    return file.type.startsWith('image/');
  },

  /**
   * Get image file extension from MIME type
   */
  getExtensionFromMimeType: (mimeType: string): string => {
    const map: Record<string, string> = {
      'image/jpeg': 'jpg',
      'image/jpg': 'jpg',
      'image/png': 'png',
      'image/gif': 'gif',
      'image/webp': 'webp',
      'image/svg+xml': 'svg',
      'image/bmp': 'bmp',
      'image/tiff': 'tiff'
    };
    return map[mimeType] || 'jpg';
  },

  /**
   * Format file size for display
   */
  formatFileSize: (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  },

  /**
   * Calculate compression percentage
   */
  calculateCompressionPercentage: (originalSize: number, compressedSize: number): number => {
    return Math.round(((originalSize - compressedSize) / originalSize) * 100);
  },

  /**
   * Generate srcset string for responsive images
   */
  generateSrcSet: (baseUrl: string, sizes: number[]): string => {
    return sizes
      .map(size => `${baseUrl}?w=${size} ${size}w`)
      .join(', ');
  }
};

// Export types
export type { ImageOptimizationOptions, ImageMetadata };
