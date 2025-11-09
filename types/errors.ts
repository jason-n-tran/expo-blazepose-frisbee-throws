/**
 * Error types for the Pose Analysis System
 */
export enum AnalysisErrorType {
  VIDEO_LOAD_FAILED = 'VIDEO_LOAD_FAILED',
  VIDEO_TOO_LONG = 'VIDEO_TOO_LONG',
  VIDEO_INVALID_FORMAT = 'VIDEO_INVALID_FORMAT',
  VIDEO_CORRUPTED = 'VIDEO_CORRUPTED',
  POSE_DETECTION_FAILED = 'POSE_DETECTION_FAILED',
  NO_PERSON_DETECTED = 'NO_PERSON_DETECTED',
  INSUFFICIENT_FRAMES = 'INSUFFICIENT_FRAMES',
  INSUFFICIENT_STORAGE = 'INSUFFICIENT_STORAGE',
  NETWORK_ERROR = 'NETWORK_ERROR',
  MODEL_LOAD_FAILED = 'MODEL_LOAD_FAILED',
}

/**
 * Custom error class for analysis-related errors
 */
export class AnalysisError extends Error {
  public readonly type: AnalysisErrorType;
  public readonly recoverable: boolean;

  constructor(
    type: AnalysisErrorType,
    message: string,
    recoverable: boolean = true
  ) {
    super(message);
    this.name = 'AnalysisError';
    this.type = type;
    this.recoverable = recoverable;

    // Maintains proper stack trace for where our error was thrown (only available on V8)
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, AnalysisError);
    }
  }

  /**
   * Get user-friendly error message
   */
  getUserMessage(): string {
    switch (this.type) {
      case AnalysisErrorType.VIDEO_LOAD_FAILED:
        return 'Unable to load the video. Please try selecting a different video.';
      case AnalysisErrorType.VIDEO_TOO_LONG:
        return 'Video is too long. Please select a video under 60 seconds.';
      case AnalysisErrorType.VIDEO_INVALID_FORMAT:
        return 'Invalid video format. Please select an MP4 or MOV file.';
      case AnalysisErrorType.VIDEO_CORRUPTED:
        return 'The video file appears to be corrupted or unreadable.';
      case AnalysisErrorType.POSE_DETECTION_FAILED:
        return 'Pose detection failed. Please try with a clearer video.';
      case AnalysisErrorType.NO_PERSON_DETECTED:
        return 'No person detected in the video. Please ensure you are clearly visible.';
      case AnalysisErrorType.INSUFFICIENT_FRAMES:
        return 'Not enough frames could be processed. Please try with a clearer video.';
      case AnalysisErrorType.INSUFFICIENT_STORAGE:
        return 'Not enough storage space available. Please free up some space and try again.';
      case AnalysisErrorType.NETWORK_ERROR:
        return 'Network connection error. Please check your internet connection.';
      case AnalysisErrorType.MODEL_LOAD_FAILED:
        return 'Failed to load the pose detection model. Please check your connection and try again.';
      default:
        return this.message || 'An unexpected error occurred.';
    }
  }

  /**
   * Get suggested action for the user
   */
  getSuggestedAction(): string {
    switch (this.type) {
      case AnalysisErrorType.VIDEO_LOAD_FAILED:
      case AnalysisErrorType.VIDEO_CORRUPTED:
        return 'Try selecting a different video or recording a new one.';
      case AnalysisErrorType.VIDEO_TOO_LONG:
        return 'Trim your video to under 60 seconds or record a shorter clip.';
      case AnalysisErrorType.VIDEO_INVALID_FORMAT:
        return 'Convert your video to MP4 or MOV format.';
      case AnalysisErrorType.POSE_DETECTION_FAILED:
      case AnalysisErrorType.NO_PERSON_DETECTED:
        return 'Record in good lighting with your full body visible in frame.';
      case AnalysisErrorType.INSUFFICIENT_FRAMES:
        return 'Ensure stable camera position and good lighting conditions.';
      case AnalysisErrorType.INSUFFICIENT_STORAGE:
        return 'Delete some files or apps to free up storage space.';
      case AnalysisErrorType.NETWORK_ERROR:
        return 'Connect to Wi-Fi or check your mobile data connection.';
      case AnalysisErrorType.MODEL_LOAD_FAILED:
        return 'Check your internet connection and restart the app.';
      default:
        return 'Please try again or contact support if the problem persists.';
    }
  }
}
