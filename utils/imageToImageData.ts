/**
 * Image to ImageData Converter
 * 
 * Utilities for converting image URIs to ImageData format for pose detection.
 * Uses expo-image-manipulator and expo-file-system for React Native compatibility.
 */

import * as ImageManipulator from 'expo-image-manipulator';
import * as FileSystem from 'expo-file-system/legacy';

/**
 * Convert an image URI to ImageData
 * @param uri - Image file URI
 * @param targetWidth - Target width for the image
 * @param targetHeight - Target height for the image
 * @returns ImageData object with pixel data
 */
export async function imageUriToImageData(
  uri: string,
  targetWidth: number,
  targetHeight: number
): Promise<ImageData> {
  try {
    console.log('[imageToImageData] Converting image to ImageData:', uri);
    
    // Resize and convert to PNG
    const manipResult = await ImageManipulator.manipulateAsync(
      uri,
      [{ resize: { width: targetWidth, height: targetHeight } }],
      { 
        format: ImageManipulator.SaveFormat.PNG,
        compress: 1,
      }
    );

    console.log('[imageToImageData] Image manipulated:', manipResult.uri);

    // Read as base64
    const base64 = await FileSystem.readAsStringAsync(manipResult.uri, {
      encoding: FileSystem.EncodingType.Base64,
    });

    // Decode PNG to get pixel data
    const pixelData = await decodePNGToPixels(base64, targetWidth, targetHeight);

    // Create ImageData
    const imageData = new ImageData(
      new Uint8ClampedArray(pixelData),
      targetWidth,
      targetHeight
    );

    // Clean up temporary file
    try {
      await FileSystem.deleteAsync(manipResult.uri, { idempotent: true });
    } catch (e) {
      console.warn('[imageToImageData] Failed to delete temp file:', e);
    }

    console.log('[imageToImageData] ImageData created successfully');
    return imageData;
  } catch (error) {
    console.error('[imageToImageData] Error converting image:', error);
    throw error;
  }
}

/**
 * Decode PNG base64 to raw RGBA pixel data
 * This is a simplified decoder that creates a placeholder for TensorFlow
 * In production, you'd use a proper PNG decoder library
 */
async function decodePNGToPixels(
  base64: string,
  width: number,
  height: number
): Promise<number[]> {
  // For now, create a simple grayscale pattern
  // In production, use a library like 'pngjs' or 'fast-png'
  // or implement proper PNG decoding
  
  const pixelCount = width * height * 4; // RGBA
  const pixels = new Array(pixelCount);
  
  // Create a simple pattern for testing
  // This should be replaced with actual PNG decoding
  for (let i = 0; i < pixelCount; i += 4) {
    const pixelIndex = i / 4;
    const x = pixelIndex % width;
    const y = Math.floor(pixelIndex / width);
    
    // Simple gradient pattern for testing
    const value = Math.floor((x / width) * 255);
    
    pixels[i] = value;     // R
    pixels[i + 1] = value; // G
    pixels[i + 2] = value; // B
    pixels[i + 3] = 255;   // A
  }
  
  return pixels;
}

/**
 * Create a blank ImageData for testing
 */
export function createBlankImageData(width: number, height: number): ImageData {
  const pixelCount = width * height * 4;
  const data = new Uint8ClampedArray(pixelCount);
  
  // Fill with black pixels
  for (let i = 0; i < pixelCount; i += 4) {
    data[i] = 0;       // R
    data[i + 1] = 0;   // G
    data[i + 2] = 0;   // B
    data[i + 3] = 255; // A
  }
  
  return new ImageData(data, width, height);
}
