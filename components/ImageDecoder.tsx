/**
 * ImageDecoder Component
 * 
 * Uses expo-gl to decode images to pixel data for TensorFlow.js
 * This component must be mounted (but can be hidden) to work
 */

import React, { useRef, useImperativeHandle, forwardRef } from 'react';
import { View, StyleSheet } from 'react-native';
import { GLView } from 'expo-gl';

export interface ImageDecoderRef {
  decodeImage: (imageUri: string, width: number, height: number) => Promise<Uint8Array>;
}

interface Props {}

export const ImageDecoder = forwardRef<ImageDecoderRef, Props>((props, ref) => {
  const glRef = useRef<any>(null);
  const pendingDecodes = useRef<Array<{
    imageUri: string;
    width: number;
    height: number;
    resolve: (pixels: Uint8Array) => void;
    reject: (error: Error) => void;
  }>>([]);

  const onContextCreate = async (gl: any) => {
    glRef.current = gl;
    console.log('[ImageDecoder] GL context created');
    
    // Process any pending decodes
    while (pendingDecodes.current.length > 0) {
      const decode = pendingDecodes.current.shift();
      if (decode) {
        try {
          const pixels = await decodeImageWithGL(gl, decode.imageUri, decode.width, decode.height);
          decode.resolve(pixels);
        } catch (error) {
          decode.reject(error as Error);
        }
      }
    }
  };

  useImperativeHandle(ref, () => ({
    decodeImage: async (imageUri: string, width: number, height: number): Promise<Uint8Array> => {
      if (!glRef.current) {
        // GL context not ready yet, queue the decode
        return new Promise((resolve, reject) => {
          pendingDecodes.current.push({ imageUri, width, height, resolve, reject });
        });
      }
      
      return decodeImageWithGL(glRef.current, imageUri, width, height);
    },
  }));

  return (
    <View style={styles.container}>
      <GLView
        style={styles.glView}
        onContextCreate={onContextCreate}
      />
    </View>
  );
});

ImageDecoder.displayName = 'ImageDecoder';

async function decodeImageWithGL(
  gl: any,
  imageUri: string,
  width: number,
  height: number
): Promise<Uint8Array> {
  console.log('[ImageDecoder] Decoding image:', imageUri);
  
  // Create texture
  const texture = gl.createTexture();
  gl.bindTexture(gl.TEXTURE_2D, texture);
  
  // Set texture parameters
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);

  // Load image into texture
  // expo-gl's texImage2D accepts { localUri } for file:// URIs
  gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, { localUri: imageUri });

  // Create framebuffer
  const framebuffer = gl.createFramebuffer();
  gl.bindFramebuffer(gl.FRAMEBUFFER, framebuffer);
  gl.framebufferTexture2D(
    gl.FRAMEBUFFER,
    gl.COLOR_ATTACHMENT0,
    gl.TEXTURE_2D,
    texture,
    0
  );

  // Read pixels
  const pixels = new Uint8Array(width * height * 4);
  gl.readPixels(0, 0, width, height, gl.RGBA, gl.UNSIGNED_BYTE, pixels);

  // Cleanup
  gl.deleteTexture(texture);
  gl.deleteFramebuffer(framebuffer);
  gl.flush();

  console.log('[ImageDecoder] Image decoded successfully');
  return pixels;
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    left: -10000,
    top: -10000,
    width: 1,
    height: 1,
    opacity: 0,
  },
  glView: {
    width: 1,
    height: 1,
  },
});
