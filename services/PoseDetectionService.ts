/**
 * PoseDetectionService
 * 
 * Service for detecting human poses in video frames using Google MediaPipe BlazePose.
 * Handles model initialization, frame processing, and resource cleanup.
 */

import { FilesetResolver, PoseLandmarker, PoseLandmarkerResult } from '@mediapipe/tasks-vision';
import { NormalizedLandmark, PoseLandmarkData, AnalysisError, AnalysisErrorType } from '@/types/pose';

export class PoseDetectionService {
  private poseLandmarker: PoseLandmarker | null = null;
  private isInitialized: boolean = false;

  /**
   * Initialize the PoseLandmarker with BlazePose model
   * Loads WASM files and model from CDN
   */
  async initialize(): Promise<void> {
    try {
      // Initialize FilesetResolver for vision tasks
      const vision = await FilesetResolver.forVisionTasks(
        'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@latest/wasm'
      );

      // Create PoseLandmarker with BlazePose Lite model
      this.poseLandmarker = await PoseLandmarker.createFromOptions(vision, {
        baseOptions: {
          modelAssetPath: 'https://storage.googleapis.com/mediapipe-models/pose_landmarker/pose_landmarker_lite/float16/latest/pose_landmarker_lite.task',
          delegate: 'GPU', // Use GPU acceleration if available
        },
        runningMode: 'VIDEO',
        numPoses: 1, // Detect single person
        minPoseDetectionConfidence: 0.5,
        minPosePresenceConfidence: 0.5,
        minTrackingConfidence: 0.5,
      });

      this.isInitialized = true;
    } catch (error) {
      throw new AnalysisError(
        AnalysisErrorType.MODEL_LOAD_FAILED,
        `Failed to initialize BlazePose model: ${error instanceof Error ? error.message : 'Unknown error'}`,
        false
      );
    }
  }

  /**
   * Detect pose landmarks in a single video frame
   * @param imageData - Frame image data
   * @param timestamp - Frame timestamp in milliseconds
   * @returns Array of normalized landmarks or null if no pose detected
   */
  async detectPoseInFrame(
    imageData: ImageData,
    timestamp: number
  ): Promise<NormalizedLandmark[] | null> {
    if (!this.isInitialized || !this.poseLandmarker) {
      throw new AnalysisError(
        AnalysisErrorType.POSE_DETECTION_FAILED,
        'PoseDetectionService not initialized. Call initialize() first.',
        true
      );
    }

    try {
      // Create HTMLCanvasElement from ImageData for MediaPipe
      const canvas = document.createElement('canvas');
      canvas.width = imageData.width;
      canvas.height = imageData.height;
      const ctx = canvas.getContext('2d');
      
      if (!ctx) {
        throw new Error('Failed to get canvas context');
      }

      ctx.putImageData(imageData, 0, 0);

      // Detect pose landmarks
      const result: PoseLandmarkerResult = this.poseLandmarker.detectForVideo(
        canvas,
        timestamp
      );

      // Check if any poses were detected
      if (!result.landmarks || result.landmarks.length === 0) {
        return null;
      }

      // Return the first detected pose landmarks
      return result.landmarks[0] as NormalizedLandmark[];
    } catch (error) {
      throw new AnalysisError(
        AnalysisErrorType.POSE_DETECTION_FAILED,
        `Failed to detect pose in frame: ${error instanceof Error ? error.message : 'Unknown error'}`,
        true
      );
    }
  }

  /**
   * Process entire video and detect poses in all frames
   * Extracts frames from video and processes each through BlazePose
   * @param videoUri - URI of the video file
   * @param videoProcessingService - Instance of VideoProcessingService for frame extraction
   * @param onProgress - Callback for progress updates (0-100)
   * @returns Array of pose landmark data for all frames
   */
  async detectPosesInVideo(
    videoUri: string,
    videoProcessingService: any, // VideoProcessingService type
    onProgress?: (progress: number) => void
  ): Promise<PoseLandmarkData[]> {
    if (!this.isInitialized || !this.poseLandmarker) {
      throw new AnalysisError(
        AnalysisErrorType.POSE_DETECTION_FAILED,
        'PoseDetectionService not initialized. Call initialize() first.',
        true
      );
    }

    // Extract frames from video at 10 FPS
    const frames = await videoProcessingService.extractFrames(videoUri, 10);
    
    const results: PoseLandmarkData[] = [];
    const totalFrames = frames.length;
    let processedFrames = 0;
    let failedFrames = 0;

    for (const frame of frames) {
      try {
        const landmarks = await this.detectPoseInFrame(frame.imageData, frame.timestamp);

        if (landmarks) {
          results.push({
            frameIndex: frame.index,
            timestamp: frame.timestamp,
            landmarks,
            worldLandmarks: [], // World landmarks can be added if needed
          });
        } else {
          failedFrames++;
        }
      } catch (error) {
        // Log error but continue processing remaining frames
        console.warn(`Failed to process frame ${frame.index}:`, error);
        failedFrames++;
      }

      processedFrames++;
      
      // Report progress
      if (onProgress) {
        const progress = Math.round((processedFrames / totalFrames) * 100);
        onProgress(progress);
      }
    }

    // Check if too many frames failed
    const successRate = (results.length / totalFrames) * 100;
    if (successRate < 50) {
      throw new AnalysisError(
        AnalysisErrorType.NO_PERSON_DETECTED,
        `Only ${successRate.toFixed(0)}% of frames processed successfully. Ensure the person is clearly visible in the video.`,
        true
      );
    }

    return results;
  }

  /**
   * Process pre-extracted frames and detect poses
   * @param frames - Array of video frames to process
   * @param onProgress - Callback for progress updates (0-100)
   * @returns Array of pose landmark data for all frames
   */
  async detectPosesInFrames(
    frames: { index: number; timestamp: number; imageData: ImageData }[],
    onProgress?: (progress: number) => void
  ): Promise<PoseLandmarkData[]> {
    if (!this.isInitialized || !this.poseLandmarker) {
      throw new AnalysisError(
        AnalysisErrorType.POSE_DETECTION_FAILED,
        'PoseDetectionService not initialized. Call initialize() first.',
        true
      );
    }

    const results: PoseLandmarkData[] = [];
    const totalFrames = frames.length;
    let processedFrames = 0;
    let failedFrames = 0;

    for (const frame of frames) {
      try {
        const landmarks = await this.detectPoseInFrame(frame.imageData, frame.timestamp);

        if (landmarks) {
          results.push({
            frameIndex: frame.index,
            timestamp: frame.timestamp,
            landmarks,
            worldLandmarks: [], // World landmarks can be added if needed
          });
        } else {
          failedFrames++;
        }
      } catch (error) {
        // Log error but continue processing remaining frames
        console.warn(`Failed to process frame ${frame.index}:`, error);
        failedFrames++;
      }

      processedFrames++;
      
      // Report progress
      if (onProgress) {
        const progress = Math.round((processedFrames / totalFrames) * 100);
        onProgress(progress);
      }
    }

    // Check if too many frames failed
    const successRate = (results.length / totalFrames) * 100;
    if (successRate < 50) {
      throw new AnalysisError(
        AnalysisErrorType.NO_PERSON_DETECTED,
        `Only ${successRate.toFixed(0)}% of frames processed successfully. Ensure the person is clearly visible in the video.`,
        true
      );
    }

    return results;
  }

  /**
   * Clean up resources and dispose of the pose landmarker
   */
  dispose(): void {
    if (this.poseLandmarker) {
      this.poseLandmarker.close();
      this.poseLandmarker = null;
    }
    this.isInitialized = false;
  }

  /**
   * Check if the service is initialized
   */
  isReady(): boolean {
    return this.isInitialized;
  }
}
