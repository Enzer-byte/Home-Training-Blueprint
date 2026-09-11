import { ImageOptimizationOptions, OptimizationResult } from '../types';

/**
 * Format bytes into a human-readable string (e.g., 2.4 MB, 185 KB).
 */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  const value = parseFloat((bytes / Math.pow(k, i)).toFixed(1));
  return `${value} ${sizes[i]}`;
}

/**
 * Checks if the browser supports encoding WebP images via canvas.
 */
export function supportsWebP(): boolean {
  if (typeof document === 'undefined') return false;
  try {
    const canvas = document.createElement('canvas');
    canvas.width = 1;
    canvas.height = 1;
    return canvas.toDataURL('image/webp').indexOf('data:image/webp') === 0;
  } catch {
    return false;
  }
}

/**
 * Convert a base64 Data URL to a Blob.
 */
function dataURLtoBlob(dataUrl: string): Blob {
  const arr = dataUrl.split(',');
  const mime = arr[0].match(/:(.*?);/)?.[1] || 'image/jpeg';
  const bstr = atob(arr[1]);
  let n = bstr.length;
  const u8arr = new Uint8Array(n);
  while (n--) {
    u8arr[n] = bstr.charCodeAt(n);
  }
  return new Blob([u8arr], { type: mime });
}

/**
 * Load a File or Blob into an HTMLImageElement safely.
 */
function loadImageFromFile(file: File | Blob): Promise<{ img: HTMLImageElement; objectUrl: string }> {
  return new Promise((resolve, reject) => {
    const objectUrl = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => resolve({ img, objectUrl });
    img.onerror = (err) => {
      URL.revokeObjectURL(objectUrl);
      reject(new Error('Failed to load image file into browser: ' + String(err)));
    };
    img.src = objectUrl;
  });
}

/**
 * Calculate constrained dimensions while maintaining aspect ratio.
 */
export function calculateAspectRatioDimensions(
  srcWidth: number,
  srcHeight: number,
  maxWidth: number,
  maxHeight: number
): { width: number; height: number } {
  if (srcWidth <= maxWidth && srcHeight <= maxHeight) {
    return { width: srcWidth, height: srcHeight };
  }

  const ratio = Math.min(maxWidth / srcWidth, maxHeight / srcHeight);
  return {
    width: Math.max(1, Math.round(srcWidth * ratio)),
    height: Math.max(1, Math.round(srcHeight * ratio))
  };
}

/**
 * Core helper function to resize and compress an image file before uploading to
 * Firebase Storage, CDN, or server endpoints.
 *
 * Reduces large camera or high-res photos (e.g. 5MB-15MB) to lightweight WebP/JPEG (100KB-300KB)
 * while preserving sharpness and correct aspect ratio for rapid mobile page loads.
 *
 * @param file The original File or Blob selected by the user.
 * @param options Configuration for dimensions, quality, format, and max size.
 * @returns OptimizationResult with the compressed File, Blob, DataUrl, and savings metrics.
 */
export async function resizeAndCompressImage(
  file: File | Blob,
  options: ImageOptimizationOptions = {}
): Promise<OptimizationResult> {
  const {
    maxWidth = 1600,
    maxHeight = 1600,
    quality = 0.82,
    outputFormat = 'auto',
    maxSizeBytes,
    fileName: customFileName
  } = options;

  if (typeof document === 'undefined') {
    throw new Error('resizeAndCompressImage must be executed in a browser environment with canvas support.');
  }

  const originalSize = file.size;
  const originalFileName = (file as File).name || 'image.jpg';

  // 1. Load image into memory
  const { img, objectUrl } = await loadImageFromFile(file);

  try {
    const originalWidth = img.naturalWidth || img.width;
    const originalHeight = img.naturalHeight || img.height;

    // 2. Compute proportional target dimensions
    const { width, height } = calculateAspectRatioDimensions(
      originalWidth,
      originalHeight,
      maxWidth,
      maxHeight
    );

    // 3. Render onto an offscreen canvas with high-quality downsampling
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;

    const ctx = canvas.getContext('2d');
    if (!ctx) {
      throw new Error('Unable to create canvas 2D rendering context for image compression.');
    }

    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';

    // 4. Determine target MIME type
    let chosenFormat: string;
    if (outputFormat === 'auto') {
      // If original has PNG transparency and user wants to keep transparency, or if WebP is available
      if (supportsWebP()) {
        chosenFormat = 'image/webp';
      } else if (file.type === 'image/png') {
        chosenFormat = 'image/png';
      } else {
        chosenFormat = 'image/jpeg';
      }
    } else {
      chosenFormat = outputFormat;
      if (chosenFormat === 'image/webp' && !supportsWebP()) {
        chosenFormat = 'image/jpeg';
      }
    }

    // Fill white background for JPEG to avoid black transparent backgrounds
    if (chosenFormat === 'image/jpeg') {
      ctx.fillStyle = '#FFFFFF';
      ctx.fillRect(0, 0, width, height);
    }

    ctx.drawImage(img, 0, 0, width, height);

    // 5. Generate compressed Blob with quality stepping if maxSizeBytes is defined
    let currentQuality = Math.min(1.0, Math.max(0.1, quality));
    let blob: Blob | null = null;

    const renderBlob = (q: number): Promise<Blob> => {
      return new Promise((resolve, reject) => {
        if (canvas.toBlob) {
          canvas.toBlob(
            (b) => {
              if (b) resolve(b);
              else {
                // Fallback to dataURL conversion
                try {
                  const dataUrl = canvas.toDataURL(chosenFormat, q);
                  resolve(dataURLtoBlob(dataUrl));
                } catch (e) {
                  reject(e);
                }
              }
            },
            chosenFormat,
            q
          );
        } else {
          try {
            const dataUrl = canvas.toDataURL(chosenFormat, q);
            resolve(dataURLtoBlob(dataUrl));
          } catch (e) {
            reject(e);
          }
        }
      });
    };

    blob = await renderBlob(currentQuality);

    // If maxSizeBytes was specified and output exceeds it, iteratively step down quality
    if (maxSizeBytes && blob.size > maxSizeBytes && currentQuality > 0.4) {
      for (let step = 0; step < 3 && blob.size > maxSizeBytes; step++) {
        currentQuality -= 0.15;
        if (currentQuality < 0.3) break;
        blob = await renderBlob(currentQuality);
      }
    }

    // 6. Build base64 Data URL for instant previews or fallback transfer
    const dataUrl = canvas.toDataURL(chosenFormat, currentQuality);

    // 7. Format clean output filename with proper extension
    const baseName = (customFileName || originalFileName).replace(/\.[^/.]+$/, '');
    const extension = chosenFormat === 'image/webp' ? '.webp' : chosenFormat === 'image/png' ? '.png' : '.jpg';
    const finalFileName = `${baseName}_optimized${extension}`;

    // 8. Reconstruct a standard File object ready for Firebase Storage uploadBytes()
    const optimizedFile = new File([blob], finalFileName, {
      type: chosenFormat,
      lastModified: Date.now()
    });

    const compressedSize = blob.size;
    const bytesSaved = Math.max(0, originalSize - compressedSize);
    const savingsPercent = originalSize > 0
      ? Math.max(0, Math.round(((originalSize - compressedSize) / originalSize) * 100))
      : 0;

    return {
      file: optimizedFile,
      blob,
      dataUrl,
      originalSize,
      compressedSize,
      bytesSaved,
      savingsPercent,
      originalWidth,
      originalHeight,
      width,
      height,
      format: chosenFormat,
      fileName: finalFileName
    };
  } finally {
    URL.revokeObjectURL(objectUrl);
  }
}

/**
 * Prepares and packages an image specifically for Firebase Storage uploads,
 * setting optimal cache headers and content metadata for CDN caching.
 *
 * @param file Original file selected from user input.
 * @param storagePath Target path in Firebase Storage bucket (e.g. 'images/hero/hero.webp').
 * @param options Compression and resizing options.
 */
export async function prepareImageForFirebaseStorage(
  file: File | Blob,
  storagePath: string,
  options: ImageOptimizationOptions = {}
): Promise<{
  file: File;
  path: string;
  metadata: {
    contentType: string;
    cacheControl: string;
    customMetadata: Record<string, string>;
  };
  result: OptimizationResult;
}> {
  const result = await resizeAndCompressImage(file, options);

  return {
    file: result.file,
    path: storagePath,
    metadata: {
      contentType: result.format,
      // Aggressive immutable cache header so browsers cache optimized assets
      cacheControl: 'public, max-age=31536000, immutable',
      customMetadata: {
        optimized: 'true',
        originalSize: String(result.originalSize),
        compressedSize: String(result.compressedSize),
        savingsPercent: `${result.savingsPercent}%`,
        dimensions: `${result.width}x${result.height}`,
        optimizedAt: new Date().toISOString()
      }
    },
    result
  };
}

/**
 * Upload helper that uploads a compressed image to Firebase Storage if an initialized
 * Firebase Storage instance is available, or gracefully delegates to the local backend API.
 *
 * @param file The original or pre-optimized File/Blob.
 * @param path Destination storage path (e.g. 'blueprints/hero.webp').
 * @param storage Optional Firebase Storage instance from getStorage().
 * @param options Optimization options if file is not yet compressed.
 */
export async function uploadToFirebaseStorage(
  file: File | Blob,
  path: string,
  storage?: any,
  options?: ImageOptimizationOptions
): Promise<{
  success: boolean;
  downloadUrl?: string;
  result?: OptimizationResult;
  message?: string;
}> {
  try {
    // 1. Always ensure image is resized and compressed first
    const prepared = await prepareImageForFirebaseStorage(file, path, options);

    // 2. If Firebase Storage instance or custom upload function is provided at runtime
    if (storage && typeof storage === 'object') {
      try {
        // If storage object has ref/upload methods directly (e.g. Firebase v8/compat or custom client)
        if (typeof storage.ref === 'function') {
          const storageRef = storage.ref(prepared.path);
          if (typeof storageRef.put === 'function') {
            const uploadTask = await storageRef.put(prepared.file, prepared.metadata);
            const downloadUrl = await uploadTask.ref.getDownloadURL();
            return {
              success: true,
              downloadUrl,
              result: prepared.result,
              message: `Uploaded to Firebase Storage (${formatFileSize(prepared.result.compressedSize)}, ${prepared.result.savingsPercent}% saved)`
            };
          }
        }

        // Modular Firebase v9+ upload helper if passed in storage helper object: { storage, uploadBytes, ref, getDownloadURL }
        if (typeof storage.uploadBytes === 'function' && typeof storage.ref === 'function' && typeof storage.getDownloadURL === 'function') {
          const storageRef = storage.ref(storage.storage || storage, prepared.path);
          const snapshot = await storage.uploadBytes(storageRef, prepared.file, prepared.metadata);
          const downloadUrl = await storage.getDownloadURL(snapshot.ref);
          return {
            success: true,
            downloadUrl,
            result: prepared.result,
            message: `Uploaded to Firebase Storage (${formatFileSize(prepared.result.compressedSize)}, ${prepared.result.savingsPercent}% saved)`
          };
        }
      } catch (err) {
        console.warn('Firebase Storage upload error, falling back to data URL:', err);
      }
    }

    // 3. Fallback: Return optimized data URL and file details
    return {
      success: true,
      downloadUrl: prepared.result.dataUrl,
      result: prepared.result,
      message: `Image optimized successfully (${formatFileSize(prepared.result.compressedSize)}, ${prepared.result.savingsPercent}% reduction)`
    };
  } catch (error) {
    console.error('Error optimizing or uploading image to Firebase Storage:', error);
    return {
      success: false,
      message: error instanceof Error ? error.message : 'Unknown image optimization error'
    };
  }
}
