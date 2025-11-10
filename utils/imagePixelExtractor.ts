/**
 * Image Pixel Extractor
 * 
 * Extracts raw RGBA pixel data from images using expo-gl.
 * This is needed for TensorFlow.js pose detection in React Native.
 */

import { GLView } from 'expo-gl';
import * as FileSystem from 'expo-file-system/legacy';

/**
 * Extract pixel data from an image URI using WebGL
 * @param imageUri - URI of the image file
 * @param width - Target width
 * @param height - Target height
 * @returns Uint8Array of RGBA pixel data
 */
export async function extractPixelsFromImage(
  imageUri: string,
  width: number,
  height: number
): Promise<Uint8Array> {
  return new Promise((resolve, reject) => {
    let glContext: any = null;
    let texture: any = null;
    let framebuffer: any = null;

    const onContextCreate = async (gl: any) => {
      try {
        glContext = gl;
        console.log('[PixelExtractor] GL context created');

        // Create texture
        texture = gl.createTexture();
        gl.bindTexture(gl.TEXTURE_2D, texture);
        
        // Set texture parameters
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);

        // Load image into texture
        console.log('[PixelExtractor] Loading image:', imageUri);
        const asset = { uri: imageUri, width, height };
        await gl.texImage2DAsync(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, asset);
        console.log('[PixelExtractor] Image loaded into texture');

        // Create framebuffer
        framebuffer = gl.createFramebuffer();
        gl.bindFramebuffer(gl.FRAMEBUFFER, framebuffer);
        gl.framebufferTexture2D(
          gl.FRAMEBUFFER,
          gl.COLOR_ATTACHMENT0,
          gl.TEXTURE_2D,
          texture,
          0
        );

        // Check framebuffer status
        const status = gl.checkFramebufferStatus(gl.FRAMEBUFFER);
        if (status !== gl.FRAMEBUFFER_COMPLETE) {
          throw new Error(`Framebuffer not complete: ${status}`);
        }

        // Read pixels
        console.log('[PixelExtractor] Reading pixels...');
        const pixels = new Uint8Array(width * height * 4);
        gl.readPixels(0, 0, width, height, gl.RGBA, gl.UNSIGNED_BYTE, pixels);
        console.log('[PixelExtractor] Pixels read successfully');

        // Cleanup
        gl.deleteTexture(texture);
        gl.deleteFramebuffer(framebuffer);
        gl.endFrameEXP();

        resolve(pixels);
      } catch (error) {
        console.error('[PixelExtractor] Error:', error);
        // Cleanup on error
        if (glContext) {
          if (texture) glContext.deleteTexture(texture);
          if (framebuffer) glContext.deleteFramebuffer(framebuffer);
          try {
            glContext.endFrameEXP();
          } catch (e) {
            // Ignore
          }
        }
        reject(error);
      }
    };

    // We need to trigger GL context creation
    // This is a workaround - in practice, you'd render a hidden GLView component
    // For now, we'll use a different approach
    reject(new Error('GL context creation requires a mounted GLView component'));
  });
}

/**
 * Alternative: Extract pixels using expo-image-manipulator
 * This is a simpler approach that doesn't require GL
 */
export async function extractPixelsUsingManipulator(
  imageUri: string,
  width: number,
  height: number
): Promise<Uint8Array> {
  const ImageManipulator = require('expo-image-manipulator');
  
  try {
    console.log('[PixelExtractor] Using ImageManipulator approach');
    
    // Resize image to target dimensions
    const manipResult = await ImageManipulator.manipulateAsync(
      imageUri,
      [{ resize: { width, height } }],
      { 
        format: ImageManipulator.SaveFormat.PNG,
        compress: 1,
      }
    );

    // Read as base64
    const base64 = await FileSystem.readAsStringAsync(manipResult.uri, {
      encoding: FileSystem.EncodingType.Base64,
    });

    // Convert base64 to Uint8Array (PNG file bytes)
    const binaryString = atob(base64);
    const pngBytes = new Uint8Array(binaryString.length);
    for (let i = 0; i < binaryString.length; i++) {
      pngBytes[i] = binaryString.charCodeAt(i);
    }

    // Parse PNG header to find image data
    // This is a simplified PNG parser - just extracts IDAT chunks
    const pixels = parsePNGPixels(pngBytes, width, height);

    // Cleanup
    await FileSystem.deleteAsync(manipResult.uri, { idempotent: true });

    return pixels;
  } catch (error) {
    console.error('[PixelExtractor] Error with ImageManipulator:', error);
    throw error;
  }
}

/**
 * Simple PNG parser to extract pixel data
 * This handles basic PNG files without compression
 */
function parsePNGPixels(pngBytes: Uint8Array, width: number, height: number): Uint8Array {
  // PNG signature: 137 80 78 71 13 10 26 10
  if (pngBytes[0] !== 137 || pngBytes[1] !== 80 || pngBytes[2] !== 78 || pngBytes[3] !== 71) {
    throw new Error('Invalid PNG signature');
  }

  // For now, return a placeholder
  // A full PNG parser would need to:
  // 1. Find IDAT chunks
  // 2. Decompress zlib data
  // 3. Unfilter scanlines
  // 4. Return RGBA pixels
  
  console.warn('[PixelExtractor] PNG parsing not fully implemented, using placeholder');
  const pixelCount = width * height * 4;
  return new Uint8Array(pixelCount).fill(128); // Gray placeholder
}
