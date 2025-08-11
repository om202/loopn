/**
 * Client-side image compression and processing utilities
 * Uses native browser APIs (Canvas) for optimal performance
 */

export interface ImageCompressionOptions {
  maxWidth?: number;
  maxHeight?: number;
  quality?: number; // 0-1
  maxSizeInMB?: number;
  outputFormat?: 'image/jpeg' | 'image/png' | 'image/webp';
}

const DEFAULT_OPTIONS: Required<ImageCompressionOptions> = {
  maxWidth: 1200,
  maxHeight: 1200,
  quality: 0.8,
  maxSizeInMB: 2,
  outputFormat: 'image/jpeg',
};

/**
 * Compress an image file using browser Canvas API
 */
export async function compressImage(
  file: File,
  options: ImageCompressionOptions = {}
): Promise<File> {
  const opts = { ...DEFAULT_OPTIONS, ...options };

  // Check if file is already small enough
  const fileSizeInMB = file.size / (1024 * 1024);
  if (fileSizeInMB <= opts.maxSizeInMB) {
    return file;
  }

  return new Promise((resolve, reject) => {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const img = new Image();

    if (!ctx) {
      reject(new Error('Failed to get canvas context'));
      return;
    }

    img.onload = () => {
      try {
        // Calculate new dimensions while maintaining aspect ratio
        const { width, height } = calculateDimensions(
          img.width,
          img.height,
          opts.maxWidth,
          opts.maxHeight
        );

        canvas.width = width;
        canvas.height = height;

        // Clear canvas and draw resized image
        ctx.clearRect(0, 0, width, height);
        ctx.drawImage(img, 0, 0, width, height);

        // Convert to compressed blob
        canvas.toBlob(
          blob => {
            if (!blob) {
              reject(new Error('Failed to compress image'));
              return;
            }

            // Create new File object with original filename
            const compressedFile = new File([blob], file.name, {
              type: opts.outputFormat,
              lastModified: Date.now(),
            });

            resolve(compressedFile);
          },
          opts.outputFormat,
          opts.quality
        );
      } catch (error) {
        reject(error);
      } finally {
        // Clean up
        URL.revokeObjectURL(img.src);
      }
    };

    img.onerror = () => {
      reject(new Error('Failed to load image'));
    };

    // Load the image
    img.src = URL.createObjectURL(file);
  });
}

/**
 * Calculate new dimensions while maintaining aspect ratio
 */
function calculateDimensions(
  originalWidth: number,
  originalHeight: number,
  maxWidth: number,
  maxHeight: number
): { width: number; height: number } {
  const aspectRatio = originalWidth / originalHeight;

  let width = originalWidth;
  let height = originalHeight;

  // Scale down if needed
  if (width > maxWidth) {
    width = maxWidth;
    height = width / aspectRatio;
  }

  if (height > maxHeight) {
    height = maxHeight;
    width = height * aspectRatio;
  }

  return { width: Math.round(width), height: Math.round(height) };
}

/**
 * Validate image file type and size
 */
export function validateImageFile(
  file: File,
  maxSizeInMB: number = 10
): { isValid: boolean; error?: string } {
  // Check file type
  const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
  if (!allowedTypes.includes(file.type)) {
    return {
      isValid: false,
      error: 'Please select a valid image file (JPEG, PNG, or WebP)',
    };
  }

  // Check file size
  const fileSizeInMB = file.size / (1024 * 1024);
  if (fileSizeInMB > maxSizeInMB) {
    return {
      isValid: false,
      error: `File size must be less than ${maxSizeInMB}MB`,
    };
  }

  return { isValid: true };
}

/**
 * Create a preview URL for an image file
 */
export function createImagePreview(file: File): string {
  return URL.createObjectURL(file);
}

/**
 * Clean up preview URL
 */
export function revokeImagePreview(url: string): void {
  URL.revokeObjectURL(url);
}
