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
   * @param useOfflineModel - If true, attempt to use bundled model instead of CDN
   */
  async initialize(useOfflineModel: boolean = false): Promise<void> {
    try {
      // Initialize FilesetResolver for vision tasks
      let vision;
      try {
        vision = await FilesetResolver.forVisionTasks(
          'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@latest/wasm'
        );
      } catch (error) {
        // Network error loading WASM files
        throw new AnalysisError(
          AnalysisErrorType.NETWORK_ERROR,
          'Failed to load pose detection resources. Please check your internet connection.',
          true
        );
      }

      // Create PoseLandmarker with BlazePose Lite model
      try {
        this.poseLandmarker = await PoseLandmarker.createFromOptions(vision, {
          baseOptions: {
            modelAssetPath: useOfflineModel
              ? '/assets/pose_landmarker_lite.task' // Bundled model path
              : 'https://storage.googleapis.com/mediapipe-models/pose_landmarker/pose_landmarker_lite/float16/latest/pose_landmarker_lite.task',
            delegate: 'GPU', // Use GPU acceleration if available
          },
          runningMode: 'VIDEO',
          numPoses: 1, // Detect single person
          minPoseDetectionConfidence: 0.5,
          minPosePresenceConfidence: 0.5,
          minTrackingConfidence: 0.5,
        });
      } catch (error) {
        // Model loading error
        if (!useOfflineModel) {
          // Try offline model as fallback
          console.warn('Failed to load model from CDN, attempting offline model...');
          throw new AnalysisError(
            AnalysisErrorType.NETWORK_ERROR,
            'Failed to download pose detection model. Please check your internet connection.',
            true
          );
        } else {
          throw new AnalysisError(
            AnalysisErrorType.MODEL_LOAD_FAILED,
            'Failed to load pose detection model. Please restart the app.',
            false
          );
        }
      }

      this.isInitialized = true;
      console.log('PoseDetectionService initialized successfully');
    } catch (error) {
      if (error instanceof AnalysisError) {
        throw error;
      }
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

    // Check if no poses were detected at all
    if (results.length === 0) {
      throw new AnalysisError(
        AnalysisErrorType.NO_PERSON_DETECTED,
        'No person detected in the video. Please ensure you are clearly visible in the frame.',
        true
      );
    }

    // Check if too many frames failed
    const successRate = (results.length / totalFrames) * 100;
    if (successRate < 50) {
      throw new AnalysisError(
        AnalysisErrorType.INSUFFICIENT_FRAMES,
        `Only ${successRate.toFixed(0)}% of frames processed successfully. Please record in better lighting with your full body visible.`,
        true
      );
    }

    // Log warning if some frames failed but still above threshold
    if (failedFrames > 0) {
      console.warn(`${failedFrames} out of ${totalFrames} frames failed to process (${successRate.toFixed(0)}% success rate)`);
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

    // Check if no poses were detected at all
    if (results.length === 0) {
      throw new AnalysisError(
        AnalysisErrorType.NO_PERSON_DETECTED,
        'No person detected in the video. Please ensure you are clearly visible in the frame.',
        true
      );
    }

    // Check if too many frames failed
    const successRate = (results.length / totalFrames) * 100;
    if (successRate < 50) {
      throw new AnalysisError(
        AnalysisErrorType.INSUFFICIENT_FRAMES,
        `Only ${successRate.toFixed(0)}% of frames processed successfully. Please record in better lighting with your full body visible.`,
        true
      );
    }

    // Log warning if some frames failed but still above threshold
    if (failedFrames > 0) {
      console.warn(`${failedFrames} out of ${totalFrames} frames failed to process (${successRate.toFixed(0)}% success rate)`);
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
