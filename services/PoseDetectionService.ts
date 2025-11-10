/**
 * PoseDetectionService
 * 
 * Service for detecting human poses in video frames using TensorFlow.js MoveNet.
 * Handles model initialization, frame processing, and resource cleanup.
 * Compatible with React Native.
 */

import * as tf from '@tensorflow/tfjs';
import * as poseDetection from '@tensorflow-models/pose-detection';
import { NormalizedLandmark, PoseLandmarkData, AnalysisError, AnalysisErrorType } from '@/types/pose';
import { Platform } from 'react-native';

export class PoseDetectionService {
  private detector: poseDetection.PoseDetector | null = null;
  private isInitialized: boolean = false;

  /**
   * Initialize the PoseDetector with MoveNet model
   * Loads TensorFlow.js and MoveNet model
   * @param useOfflineModel - Ignored for now, kept for API compatibility
   */
  async initialize(useOfflineModel: boolean = false): Promise<void> {
    try {
      console.log('[PoseDetectionService] Initializing TensorFlow.js...');
      
      // Wait for TensorFlow.js to be ready
      await tf.ready();
      console.log('[PoseDetectionService] TensorFlow.js ready');

      // Create MoveNet detector
      // Using MoveNet Lightning for faster inference (suitable for mobile)
      try {
        console.log('[PoseDetectionService] Loading MoveNet model...');
        this.detector = await poseDetection.createDetector(
          poseDetection.SupportedModels.MoveNet,
          {
            modelType: poseDetection.movenet.modelType.SINGLEPOSE_LIGHTNING,
            enableSmoothing: true,
            minPoseScore: 0.25,
          }
        );
        console.log('[PoseDetectionService] MoveNet model loaded successfully');
      } catch (error) {
        console.error('[PoseDetectionService] Failed to load MoveNet model:', error);
        throw new AnalysisError(
          AnalysisErrorType.MODEL_LOAD_FAILED,
          'Failed to load pose detection model. Please check your internet connection.',
          true
        );
      }

      this.isInitialized = true;
      console.log('[PoseDetectionService] Initialization complete');
    } catch (error) {
      console.error('[PoseDetectionService] Initialization error:', error);
      if (error instanceof AnalysisError) {
        throw error;
      }
      throw new AnalysisError(
        AnalysisErrorType.MODEL_LOAD_FAILED,
        `Failed to initialize pose detection: ${error instanceof Error ? error.message : 'Unknown error'}`,
        false
      );
    }
  }

  /**
   * Detect pose landmarks in a single video frame
   * @param imageData - Frame image data or tensor
   * @param timestamp - Frame timestamp in milliseconds
   * @returns Array of normalized landmarks or null if no pose detected
   */
  async detectPoseInFrame(
    imageData: ImageData | tf.Tensor3D,
    timestamp: number
  ): Promise<NormalizedLandmark[] | null> {
    if (!this.isInitialized || !this.detector) {
      throw new AnalysisError(
        AnalysisErrorType.POSE_DETECTION_FAILED,
        'PoseDetectionService not initialized. Call initialize() first.',
        true
      );
    }

    try {
      let tensor: tf.Tensor3D;
      
      // Convert ImageData to tensor if needed
      if (imageData instanceof ImageData) {
        // Create tensor from ImageData
        const { width, height, data } = imageData;
        tensor = tf.browser.fromPixels({ width, height, data } as any);
      } else {
        tensor = imageData;
      }

      // Detect poses
      const poses = await this.detector.estimatePoses(tensor);

      // Clean up tensor if we created it
      if (imageData instanceof ImageData) {
        tensor.dispose();
      }

      // Check if any poses were detected
      if (!poses || poses.length === 0 || !poses[0].keypoints) {
        return null;
      }

      // Convert MoveNet keypoints to MediaPipe-style normalized landmarks
      const pose = poses[0];
      const landmarks: NormalizedLandmark[] = pose.keypoints.map((kp) => ({
        x: kp.x || 0,
        y: kp.y || 0,
        z: 0, // MoveNet doesn't provide z coordinate
        visibility: kp.score || 0,
      }));

      return landmarks;
    } catch (error) {
      console.error('[PoseDetectionService] Frame detection error:', error);
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
    if (!this.isInitialized || !this.detector) {
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
    if (!this.isInitialized || !this.detector) {
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
   * Clean up resources and dispose of the pose detector
   */
  dispose(): void {
    if (this.detector) {
      this.detector.dispose();
      this.detector = null;
    }
    this.isInitialized = false;
    console.log('[PoseDetectionService] Resources disposed');
  }

  /**
   * Check if the service is initialized
   */
  isReady(): boolean {
    return this.isInitialized;
  }
}
