/**
 * VideoProcessingService
 * 
 * Service for extracting frames from videos, validating video files,
 * and preparing video data for pose detection.
 */

import { Video, ResizeMode } from 'expo-av';
import * as FileSystem from 'expo-file-system';
import { VideoFrame, ValidationResult, AnalysisError, AnalysisErrorType } from '@/types/pose';

export class VideoProcessingService {
  private static readonly MAX_VIDEO_DURATION = 60; // seconds
  private static readonly SUPPORTED_FORMATS = ['mp4', 'mov'];

  /**
   * Extract frames from a video at specified FPS
   * @param videoUri - URI of the video file
   * @param fps - Frames per second to extract (default: 10)
   * @returns Array of video frames with image data
   */
  async extractFrames(videoUri: string, fps: number = 10): Promise<VideoFrame[]> {
    try {
      // Validate video first
      const validation = await this.validateVideo(videoUri);
      if (!validation.isValid) {
        throw new AnalysisError(
          AnalysisErrorType.VIDEO_LOAD_FAILED,
          validation.error || 'Video validation failed',
          true
        );
      }

      const duration = validation.duration!;
      const frames: VideoFrame[] = [];
      const frameInterval = 1000 / fps; // milliseconds between frames
      const totalFrames = Math.floor(duration * fps);

      // Create a video element for frame extraction
      // Note: This is a simplified implementation
      // In React Native, we'll need to use a different approach with expo-video
      // or native modules for actual frame extraction
      
      for (let i = 0; i < totalFrames; i++) {
        const timestamp = i * frameInterval;
        
        // TODO: Implement actual frame extraction using expo-video or native module
        // For now, this is a placeholder that shows the structure
        // Real implementation would involve:
        // 1. Seek to timestamp
        // 2. Capture current frame as image
        // 3. Convert to ImageData
        
        // Placeholder ImageData (will be replaced with actual extraction)
        const imageData = new ImageData(640, 480);
        
        frames.push({
          index: i,
          timestamp,
          imageData,
        });
      }

      return frames;
    } catch (error) {
      if (error instanceof AnalysisError) {
        throw error;
      }
      throw new AnalysisError(
        AnalysisErrorType.VIDEO_LOAD_FAILED,
        `Failed to extract frames: ${error instanceof Error ? error.message : 'Unknown error'}`,
        true
      );
    }
  }

  /**
   * Get the duration of a video file
   * @param videoUri - URI of the video file
   * @returns Duration in seconds
   */
  async getVideoDuration(videoUri: string): Promise<number> {
    try {
      // Check if file exists
      const fileInfo = await FileSystem.getInfoAsync(videoUri);
      if (!fileInfo.exists) {
        throw new Error('Video file not found');
      }

      // Create a video component to get duration
      // Note: In React Native, we need to load the video to get its duration
      // This is a simplified approach - actual implementation would use expo-video
      
      return new Promise((resolve, reject) => {
        // Placeholder: In actual implementation, we would:
        // 1. Create a Video component
        // 2. Load the video
        // 3. Get duration from status
        // 4. Clean up
        
        // For now, return a default value
        // This will be replaced with actual video loading logic
        resolve(30); // Default 30 seconds
      });
    } catch (error) {
      throw new AnalysisError(
        AnalysisErrorType.VIDEO_LOAD_FAILED,
        `Failed to get video duration: ${error instanceof Error ? error.message : 'Unknown error'}`,
        true
      );
    }
  }

  /**
   * Validate a video file
   * @param videoUri - URI of the video file
   * @returns Validation result with duration if valid
   */
  async validateVideo(videoUri: string): Promise<ValidationResult> {
    try {
      // Check if file exists
      const fileInfo = await FileSystem.getInfoAsync(videoUri);
      if (!fileInfo.exists) {
        throw new AnalysisError(
          AnalysisErrorType.VIDEO_LOAD_FAILED,
          'Video file not found',
          true
        );
      }

      // Check if file is readable
      if (!fileInfo.isDirectory && fileInfo.size === 0) {
        throw new AnalysisError(
          AnalysisErrorType.VIDEO_CORRUPTED,
          'Video file is empty or corrupted',
          true
        );
      }

      // Check file format
      const extension = videoUri.split('.').pop()?.toLowerCase();
      if (!extension || !VideoProcessingService.SUPPORTED_FORMATS.includes(extension)) {
        throw new AnalysisError(
          AnalysisErrorType.VIDEO_INVALID_FORMAT,
          `Unsupported video format. Supported formats: ${VideoProcessingService.SUPPORTED_FORMATS.join(', ')}`,
          true
        );
      }

      // Get video duration
      let duration: number;
      try {
        duration = await this.getVideoDuration(videoUri);
      } catch (error) {
        throw new AnalysisError(
          AnalysisErrorType.VIDEO_CORRUPTED,
          'Unable to read video file. The file may be corrupted.',
          true
        );
      }

      // Check duration
      if (duration > VideoProcessingService.MAX_VIDEO_DURATION) {
        throw new AnalysisError(
          AnalysisErrorType.VIDEO_TOO_LONG,
          `Video is too long (${Math.round(duration)}s). Maximum duration is ${VideoProcessingService.MAX_VIDEO_DURATION}s`,
          true
        );
      }

      // Check minimum duration (at least 1 second)
      if (duration < 1) {
        throw new AnalysisError(
          AnalysisErrorType.VIDEO_LOAD_FAILED,
          'Video is too short. Please select a video at least 1 second long.',
          true
        );
      }

      return {
        isValid: true,
        duration,
      };
    } catch (error) {
      if (error instanceof AnalysisError) {
        return {
          isValid: false,
          error: error.getUserMessage(),
        };
      }
      return {
        isValid: false,
        error: error instanceof Error ? error.message : 'Unknown validation error',
      };
    }
  }

  /**
   * Extract a single frame from video at specific timestamp
   * @param videoUri - URI of the video file
   * @param timestamp - Timestamp in milliseconds
   * @returns ImageData for the frame
   */
  async extractFrameAtTimestamp(videoUri: string, timestamp: number): Promise<ImageData> {
    try {
      // TODO: Implement frame extraction at specific timestamp
      // This would involve:
      // 1. Load video
      // 2. Seek to timestamp
      // 3. Capture frame
      // 4. Convert to ImageData
      
      // Placeholder
      return new ImageData(640, 480);
    } catch (error) {
      throw new AnalysisError(
        AnalysisErrorType.VIDEO_LOAD_FAILED,
        `Failed to extract frame at ${timestamp}ms: ${error instanceof Error ? error.message : 'Unknown error'}`,
        true
      );
    }
  }

  /**
   * Get video metadata (resolution, fps, codec, etc.)
   * @param videoUri - URI of the video file
   * @returns Video metadata object
   */
  async getVideoMetadata(videoUri: string): Promise<{
    width: number;
    height: number;
    duration: number;
    fps?: number;
  }> {
    try {
      const duration = await this.getVideoDuration(videoUri);
      
      // TODO: Get actual video resolution and fps
      // For now, return default values
      return {
        width: 1920,
        height: 1080,
        duration,
        fps: 30,
      };
    } catch (error) {
      throw new AnalysisError(
        AnalysisErrorType.VIDEO_LOAD_FAILED,
        `Failed to get video metadata: ${error instanceof Error ? error.message : 'Unknown error'}`,
        true
      );
    }
  }
}
