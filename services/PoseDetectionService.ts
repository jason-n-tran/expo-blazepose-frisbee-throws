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
  private imageDecoder: any = null;

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
   * @param imageData - Frame image data, tensor, image URI, or frame info
   * @param timestamp - Frame timestamp in milliseconds
   * @returns Array of normalized landmarks or null if no pose detected
   */
  async detectPoseInFrame(
    imageData: ImageData | tf.Tensor3D | string | { uri: string; width: number; height: number },
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
      let poses;
      
      // Handle different input types
      if (typeof imageData === 'object' && 'uri' in imageData) {
        // Frame info object with URI - use TensorFlow's decodeImage
        const { uri, width, height } = imageData;
        
        console.log('[PoseDetectionService] Loading image from URI:', uri);
        
        // Read image file as binary
        const FileSystem = require('expo-file-system/legacy');
        const base64 = await FileSystem.readAsStringAsync(uri, {
          encoding: FileSystem.EncodingType.Base64,
        });
        
        // Convert base64 to Uint8Array
        const binaryString = atob(base64);
        const bytes = new Uint8Array(binaryString.length);
        for (let i = 0; i < binaryString.length; i++) {
          bytes[i] = binaryString.charCodeAt(i);
        }
        
        console.log('[PoseDetectionService] Image loaded, size:', bytes.length, 'bytes');
        
        // Use bundleResourceIO to load the image
        // In React Native, we need to use fetch to load the image as a blob
        // then use decodeJpeg/decodePng from tfjs-react-native
        let tensor: tf.Tensor3D;
        
        // Use ImageDecoder component to decode the image using expo-gl
        let pixelData: Uint8Array;
        
        if (this.imageDecoder) {
          console.log('[PoseDetectionService] Using ImageDecoder (expo-gl)');
          pixelData = await this.imageDecoder.decodeImage(uri, width, height);
        } else {
          console.warn('[PoseDetectionService] ImageDecoder not available, using placeholder');
          const placeholderArray = await this.decodeBase64PNG(base64, width, height);
          pixelData = new Uint8Array(placeholderArray);
        }
        
        // Create tensor from pixel data [height, width, channels]
        const rgbaTensor = tf.tensor3d(Array.from(pixelData), [height, width, 4]);
        
        // Convert RGBA to RGB (remove alpha channel)
        tensor = rgbaTensor.slice([0, 0, 0], [height, width, 3]) as tf.Tensor3D;
        rgbaTensor.dispose();
        
        console.log('[PoseDetectionService] Tensor shape:', tensor.shape);
        console.log('[PoseDetectionService] Tensor dtype:', tensor.dtype);
        console.log('[PoseDetectionService] Tensor min/max:', await tensor.min().data(), await tensor.max().data());
        
        poses = await this.detector.estimatePoses(tensor);
        console.log('[PoseDetectionService] Poses detected:', poses?.length || 0);
        if (poses && poses.length > 0) {
          console.log('[PoseDetectionService] First pose keypoints:', poses[0].keypoints?.length || 0);
          console.log('[PoseDetectionService] First pose score:', poses[0].score);
        }
        tensor.dispose();
      } else {
        // Other types - pass directly
        poses = await this.detector.estimatePoses(imageData as any);
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
   * Set the image decoder reference (from ImageDecoder component)
   */
  setImageDecoder(decoder: any) {
    this.imageDecoder = decoder;
    console.log('[PoseDetectionService] Image decoder set');
  }

  /**
   * Check if the service is initialized
   */
  isReady(): boolean {
    return this.isInitialized;
  }

  /**
   * Decode base64 PNG to raw RGBA pixel data
   * 
   * NOTE: This is a placeholder implementation that returns test data.
   * For production, you need to implement proper PNG decoding using:
   * 1. A React Native compatible PNG decoder library
   * 2. Or a native module for image decoding
   * 3. Or use expo-image-manipulator to get actual pixel data
   * 
   * The current implementation allows the pipeline to run but won't
   * produce accurate pose detection results.
   */
  private async decodeBase64PNG(base64: string, width: number, height: number): Promise<number[]> {
    console.warn('[PoseDetectionService] Using placeholder PNG decoder - pose detection will not work accurately');
    console.warn('[PoseDetectionService] Implement proper PNG decoding for production use');
    
    // Return placeholder data - this allows testing the pipeline
    // but won't produce real pose detection results
    const pixelCount = width * height * 4;
    const pixels = new Array(pixelCount);
    
    // Create a simple gradient for testing
    for (let i = 0; i < pixelCount; i += 4) {
      const pixelIndex = i / 4;
      const x = pixelIndex % width;
      const y = Math.floor(pixelIndex / width);
      
      const value = Math.floor(((x + y) / (width + height)) * 255);
      pixels[i] = value;     // R
      pixels[i + 1] = value; // G
      pixels[i + 2] = value; // B
      pixels[i + 3] = 255;   // A
    }
    
    return pixels;
  }
}
