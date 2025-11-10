/**
 * VideoFrameExtractor Component
 * 
 * Hidden component that renders video frames and captures them as images.
 * Used by VideoProcessingService for frame extraction.
 * Uses expo-video for modern, reliable video playback.
 */

import React, { useRef, useImperativeHandle, forwardRef } from 'react';
import { View, StyleSheet } from 'react-native';
import { VideoView, useVideoPlayer } from 'expo-video';
import { captureRef } from 'react-native-view-shot';

export interface VideoFrameExtractorRef {
  extractFrame: (videoUri: string, timestamp: number, width: number, height: number) => Promise<{ uri: string; width: number; height: number }>;
}

interface Props {}

export const VideoFrameExtractor = forwardRef<VideoFrameExtractorRef, Props>((props, ref) => {
  const viewRef = useRef<View>(null);
  const currentVideoUri = useRef<string>('');
  
  // Create player with a dummy initial source - IMPORTANT: don't change this dependency
  // The player must remain stable across renders to avoid "shared object released" errors
  const player = useVideoPlayer('', (player) => {
    player.muted = true;
    player.pause();
  });

  useImperativeHandle(ref, () => ({
    extractFrame: async (videoUri: string, timestamp: number, width: number, height: number): Promise<string> => {
      try {
        console.log(`[VideoFrameExtractor] Extracting frame at ${timestamp}ms from ${videoUri}`);
        
        // Load video if it's a new source
        if (currentVideoUri.current !== videoUri) {
          console.log('[VideoFrameExtractor] Loading new video...');
          
          // Use replaceAsync to change video source
          await player.replaceAsync(videoUri);
          currentVideoUri.current = videoUri;
          
          // Wait for video to be ready
          await waitForPlayerReady(player);
          console.log('[VideoFrameExtractor] Video loaded and ready');
        }

        // Seek to timestamp (in seconds)
        console.log(`[VideoFrameExtractor] Seeking to ${timestamp}ms`);
        player.currentTime = timestamp / 1000;
        
        // Wait for seek to complete and frame to render
        await new Promise(resolve => setTimeout(resolve, 300));

        // Capture the frame
        if (!viewRef.current) {
          throw new Error('View ref not available');
        }

        const capturedUri = await captureRef(viewRef, {
          format: 'png',
          quality: 1,
          result: 'tmpfile',
        });

        console.log(`[VideoFrameExtractor] Frame captured to: ${capturedUri}`);

        // Return the image info - URI and dimensions
        return { uri: capturedUri, width, height };
      } catch (error) {
        console.error('[VideoFrameExtractor] Error extracting frame:', error);
        throw error;
      }
    },
  }));

  return (
    <View style={styles.container}>
      <View ref={viewRef} style={styles.videoContainer} collapsable={false}>
        <VideoView
          player={player}
          style={styles.video}
          nativeControls={false}
        />
      </View>
    </View>
  );
});

VideoFrameExtractor.displayName = 'VideoFrameExtractor';

/**
 * Wait for video player to be ready
 */
async function waitForPlayerReady(player: any): Promise<void> {
  return new Promise<void>((resolve, reject) => {
    const timeout = setTimeout(() => {
      reject(new Error('Video load timeout'));
    }, 10000);
    
    const checkStatus = () => {
      try {
        if (player.status === 'readyToPlay') {
          clearTimeout(timeout);
          resolve();
        } else if (player.status === 'error') {
          clearTimeout(timeout);
          reject(new Error('Video load error'));
        } else {
          setTimeout(checkStatus, 100);
        }
      } catch (error) {
        clearTimeout(timeout);
        reject(error);
      }
    };
    
    checkStatus();
  });
}



const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    left: -10000, // Hide off-screen
    top: -10000,
    width: 640,
    height: 480,
    opacity: 0,
  },
  videoContainer: {
    width: 640,
    height: 480,
    overflow: 'hidden',
    backgroundColor: '#000',
  },
  video: {
    width: '100%',
    height: '100%',
  },
});
