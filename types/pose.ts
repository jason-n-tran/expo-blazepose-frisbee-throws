/**
 * Pose Analysis Type Definitions
 * 
 * This file contains all TypeScript interfaces and types for the pose analysis system,
 * including BlazePose landmarks, analysis reports, and comparison results.
 */

// ============================================================================
// BlazePose Landmark Types
// ============================================================================

/**
 * Enum defining all 33 BlazePose landmark indices
 */
export enum PoseLandmarkIndex {
  NOSE = 0,
  LEFT_EYE_INNER = 1,
  LEFT_EYE = 2,
  LEFT_EYE_OUTER = 3,
  RIGHT_EYE_INNER = 4,
  RIGHT_EYE = 5,
  RIGHT_EYE_OUTER = 6,
  LEFT_EAR = 7,
  RIGHT_EAR = 8,
  MOUTH_LEFT = 9,
  MOUTH_RIGHT = 10,
  LEFT_SHOULDER = 11,
  RIGHT_SHOULDER = 12,
  LEFT_ELBOW = 13,
  RIGHT_ELBOW = 14,
  LEFT_WRIST = 15,
  RIGHT_WRIST = 16,
  LEFT_PINKY = 17,
  RIGHT_PINKY = 18,
  LEFT_INDEX = 19,
  RIGHT_INDEX = 20,
  LEFT_THUMB = 21,
  RIGHT_THUMB = 22,
  LEFT_HIP = 23,
  RIGHT_HIP = 24,
  LEFT_KNEE = 25,
  RIGHT_KNEE = 26,
  LEFT_ANKLE = 27,
  RIGHT_ANKLE = 28,
  LEFT_HEEL = 29,
  RIGHT_HEEL = 30,
  LEFT_FOOT_INDEX = 31,
  RIGHT_FOOT_INDEX = 32,
}

/**
 * Normalized landmark with coordinates in 0-1 range
 */
export interface NormalizedLandmark {
  x: number;          // Normalized x coordinate (0-1)
  y: number;          // Normalized y coordinate (0-1)
  z: number;          // Depth coordinate
  visibility?: number; // Visibility score (0-1)
}

/**
 * World landmark with coordinates in meters
 */
export interface Landmark {
  x: number;          // X coordinate in meters
  y: number;          // Y coordinate in meters
  z: number;          // Z coordinate in meters
  visibility?: number; // Visibility score (0-1)
}

/**
 * Pose landmark data for a single video frame
 */
export interface PoseLandmarkData {
  frameIndex: number;              // Frame number in video
  timestamp: number;               // Timestamp in milliseconds
  landmarks: NormalizedLandmark[]; // Normalized landmarks (33 points)
  worldLandmarks: Landmark[];      // World landmarks in meters (33 points)
}

// ============================================================================
// Analysis and Comparison Types
// ============================================================================

/**
 * Joint angles for key body joints
 */
export interface JointAngles {
  shoulder: { left: number; right: number };
  elbow: { left: number; right: number };
  wrist: { left: number; right: number };
  hip: { left: number; right: number };
  knee: { left: number; right: number };
}

/**
 * Deviation scores for body segments
 */
export interface DeviationScores {
  [segment: string]: {
    deviation: number;                    // Angular deviation in degrees
    severity: 'high' | 'medium' | 'low'; // Severity level
  };
}

/**
 * Result of pose comparison analysis
 */
export interface ComparisonResult {
  deviations: DeviationScores;  // Deviation scores for each segment
  overallScore: number;         // Overall score (0-100)
  keyFrames: number[];          // Frame indices with significant deviations
}

// ============================================================================
// Feedback and Report Types
// ============================================================================

/**
 * Body segment types for feedback categorization
 */
export type BodySegment =
  | 'shoulder'
  | 'elbow'
  | 'wrist'
  | 'hip'
  | 'knee'
  | 'ankle';

/**
 * Individual feedback issue
 */
export interface FeedbackIssue {
  segment: BodySegment;              // Body segment with issue
  severity: 'high' | 'medium' | 'low'; // Issue severity
  deviationDegrees: number;          // Deviation amount in degrees
  description: string;               // Description of the issue
  recommendation: string;            // Recommended correction
}

/**
 * Feedback category grouping related issues
 */
export interface FeedbackCategory {
  name: string;              // Category name (e.g., "Upper Body")
  issues: FeedbackIssue[];   // Issues in this category
}

/**
 * Complete analysis report
 */
export interface AnalysisReport {
  id: string;                    // Unique analysis ID
  overallScore: number;          // Overall score (0-100)
  categories: FeedbackCategory[]; // Categorized feedback
  timestamp: Date;               // Analysis timestamp
  videoUri: string;              // User video URI
  userLandmarks: PoseLandmarkData[]; // User pose landmarks
}

// ============================================================================
// Gold Standard Data Types
// ============================================================================

/**
 * Gold standard reference data
 */
export interface GoldStandardData {
  videoUri: string;              // Gold standard video URI
  landmarks: PoseLandmarkData[]; // Gold standard pose landmarks
  metadata: {
    description: string;         // Description of the throw
    athleteName: string;         // Athlete name
    recordedDate: Date;          // Recording date
  };
}

// ============================================================================
// Storage Types
// ============================================================================

/**
 * Stored analysis with metadata
 */
export interface StoredAnalysis {
  id: string;                // Unique ID
  timestamp: number;         // Unix timestamp
  videoUri: string;          // Video file URI
  report: AnalysisReport;    // Analysis report
  thumbnailUri?: string;     // Optional thumbnail
}

// ============================================================================
// Error Types
// ============================================================================

// Re-export error types from errors.ts for convenience
export { AnalysisError, AnalysisErrorType } from './errors';

// ============================================================================
// Video Processing Types
// ============================================================================

/**
 * Video frame with extracted image data
 */
export interface VideoFrame {
  index: number;                                                    // Frame index
  timestamp: number;                                                // Timestamp in milliseconds
  imageData: ImageData | string | { uri: string; width: number; height: number };  // Frame image data, URI, or frame info
}

/**
 * Video validation result
 */
export interface ValidationResult {
  isValid: boolean;   // Whether video is valid
  duration?: number;  // Video duration in seconds
  error?: string;     // Error message if invalid
}
