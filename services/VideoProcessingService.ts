/**
 * VideoProcessingService
 * 
 * Service for extracting frames from videos, validating video files,
 * and preparing video data for pose detection.
 */

import { Audio } from 'expo-av';
import { getInfoAsync } from 'expo-file-system/legacy';
import { VideoFrame, ValidationResult, AnalysisError, AnalysisErrorType } from '@/types/pose';

export class VideoProcessingService {
  private static readonly MAX_VIDEO_DURATION = 60; // seconds
  private static readonly SUPPORTED_FORMATS = ['mp4', 'mov'];

  private frameExtractorRef: any = null;

  /**
   * Set the frame extractor reference (from VideoFrameExtractor component)
   */
  setFrameExtractor(ref: any) {
    this.frameExtractorRef = ref;
  }

  /**
   * Extract frames from a video at specified FPS
   * @param videoUri - URI of the video file
   * @param fps - Frames per second to extract (default: 10)
   * @returns Array of video frames with image data
   */
  async extractFrames(videoUri: string, fps: number = 10): Promise<VideoFrame[]> {
    console.log('[VideoProcessingService] extractFrames called');
    console.log('[VideoProcessingService] Video URI:', videoUri);
    console.log('[VideoProcessingService] FPS:', fps);
    
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

      if (!this.frameExtractorRef) {
        throw new AnalysisError(
          AnalysisErrorType.VIDEO_LOAD_FAILED,
          'Frame extractor not initialized. Please ensure VideoFrameExtractor component is mounted.',
          true
        );
      }

      const duration = validation.duration!;
      const frames: VideoFrame[] = [];
      const frameInterval = 1000 / fps; // milliseconds between frames
      const totalFrames = Math.floor(duration * fps);

      console.log('[VideoProcessingService] Duration:', duration, 'seconds');
      console.log('[VideoProcessingService] Total frames to extract:', totalFrames);
      console.log('[VideoProcessingService] Frame interval:', frameInterval, 'ms');

      // Extract frames using the VideoFrameExtractor component
      for (let i = 0; i < totalFrames; i++) {
        const timestamp = i * frameInterval;
        
        console.log(`[VideoProcessingService] Extracting frame ${i + 1}/${totalFrames} at ${timestamp}ms`);
        
        try {
          const frameInfo = await this.frameExtractorRef.extractFrame(
            videoUri,
            timestamp,
            640, // width
            480  // height
          );
          
          frames.push({
            index: i,
            timestamp,
            imageData: frameInfo, // Store frame info (URI + dimensions)
          });
          
          console.log(`[VideoProcessingService] Frame ${i + 1} extracted successfully`);
        } catch (frameError) {
          console.warn(`[VideoProcessingService] Failed to extract frame ${i}:`, frameError);
          // Continue with next frame instead of failing completely
        }
      }

      if (frames.length === 0) {
        throw new AnalysisError(
          AnalysisErrorType.VIDEO_LOAD_FAILED,
          'Failed to extract any frames from video',
          true
        );
      }

      console.log(`[VideoProcessingService] Successfully extracted ${frames.length}/${totalFrames} frames`);
      return frames;
    } catch (error) {
      console.error('[VideoProcessingService] Error in extractFrames:', error);
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
    console.log('[VideoProcessingService] getVideoDuration called with URI:', videoUri);
    
    try {
      // Check if file exists
      console.log('[VideoProcessingService] Checking if file exists...');
      const fileInfo = await getInfoAsync(videoUri);
      console.log('[VideoProcessingService] File info:', JSON.stringify(fileInfo, null, 2));
      
      if (!fileInfo.exists) {
        console.error('[VideoProcessingService] File does not exist!');
        throw new Error('Video file not found');
      }

      // Use expo-av Audio.Sound to load video and get duration
      // Sound can load video files and extract their duration
      console.log('[VideoProcessingService] Creating Audio.Sound to load video...');
      const { sound } = await Audio.Sound.createAsync(
        { uri: videoUri },
        { shouldPlay: false }
      );
      
      console.log('[VideoProcessingService] Getting sound status...');
      const status = await sound.getStatusAsync();
      console.log('[VideoProcessingService] Sound status:', JSON.stringify(status, null, 2));
      
      await sound.unloadAsync();
      console.log('[VideoProcessingService] Sound unloaded');
      
      if (status.isLoaded && status.durationMillis) {
        const durationSeconds = status.durationMillis / 1000;
        console.log('[VideoProcessingService] Video duration:', durationSeconds, 'seconds');
        return durationSeconds;
      } else {
        console.error('[VideoProcessingService] Could not load video or get duration. Status:', status);
        throw new Error('Could not load video or get duration');
      }
    } catch (error) {
      console.error('[VideoProcessingService] Error in getVideoDuration:', error);
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
    console.log('[VideoProcessingService] validateVideo called with URI:', videoUri);
    
    try {
      // Check if file exists
      console.log('[VideoProcessingService] Checking if file exists...');
      const fileInfo = await getInfoAsync(videoUri);
      console.log('[VideoProcessingService] File info:', JSON.stringify(fileInfo, null, 2));
      
      if (!fileInfo.exists) {
        console.error('[VideoProcessingService] File does not exist!');
        throw new AnalysisError(
          AnalysisErrorType.VIDEO_LOAD_FAILED,
          'Video file not found',
          true
        );
      }

      // Check if file is readable
      if (!fileInfo.isDirectory && fileInfo.size === 0) {
        console.error('[VideoProcessingService] File is empty!');
        throw new AnalysisError(
          AnalysisErrorType.VIDEO_CORRUPTED,
          'Video file is empty or corrupted',
          true
        );
      }

      // Check file format
      const extension = videoUri.split('.').pop()?.toLowerCase();
      console.log('[VideoProcessingService] File extension:', extension);
      
      if (!extension || !VideoProcessingService.SUPPORTED_FORMATS.includes(extension)) {
        console.error('[VideoProcessingService] Unsupported format:', extension);
        throw new AnalysisError(
          AnalysisErrorType.VIDEO_INVALID_FORMAT,
          `Unsupported video format. Supported formats: ${VideoProcessingService.SUPPORTED_FORMATS.join(', ')}`,
          true
        );
      }

      // Get video duration
      let duration: number;
      try {
        console.log('[VideoProcessingService] Getting video duration...');
        duration = await this.getVideoDuration(videoUri);
        console.log('[VideoProcessingService] Duration retrieved:', duration);
      } catch (error) {
        console.error('[VideoProcessingService] Error getting duration:', error);
        throw new AnalysisError(
          AnalysisErrorType.VIDEO_CORRUPTED,
          'Unable to read video file. The file may be corrupted.',
          true
        );
      }

      // Check duration
      if (duration > VideoProcessingService.MAX_VIDEO_DURATION) {
        console.error('[VideoProcessingService] Video too long:', duration);
        throw new AnalysisError(
          AnalysisErrorType.VIDEO_TOO_LONG,
          `Video is too long (${Math.round(duration)}s). Maximum duration is ${VideoProcessingService.MAX_VIDEO_DURATION}s`,
          true
        );
      }

      // Check minimum duration (at least 1 second)
      if (duration < 1) {
        console.error('[VideoProcessingService] Video too short:', duration);
        throw new AnalysisError(
          AnalysisErrorType.VIDEO_LOAD_FAILED,
          'Video is too short. Please select a video at least 1 second long.',
          true
        );
      }

      console.log('[VideoProcessingService] Video validation successful!');
      return {
        isValid: true,
        duration,
      };
    } catch (error) {
      console.error('[VideoProcessingService] Validation error:', error);
      
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
      if (!this.frameExtractorRef) {
        throw new AnalysisError(
          AnalysisErrorType.VIDEO_LOAD_FAILED,
          'Frame extractor not initialized',
          true
        );
      }

      const imageData = await this.frameExtractorRef.extractFrame(
        videoUri,
        timestamp,
        640,
        480
      );
      
      return imageData;
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
