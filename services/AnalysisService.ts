/**
 * AnalysisService
 * 
 * Service for analyzing pose data, calculating joint angles, comparing poses,
 * and generating feedback reports.
 */

import {
  PoseLandmarkData,
  NormalizedLandmark,
  JointAngles,
  DeviationScores,
  ComparisonResult,
  AnalysisReport,
  FeedbackCategory,
  FeedbackIssue,
  BodySegment,
  PoseLandmarkIndex,
  GoldStandardData,
} from '@/types/pose';

/**
 * AnalysisService class for pose comparison and feedback generation
 */
export class AnalysisService {
  /**
   * Calculate joint angles from pose landmarks
   * @param landmarks Array of normalized landmarks
   * @returns JointAngles object with all computed angles
   */
  calculateJointAngles(landmarks: NormalizedLandmark[]): JointAngles {
    return {
      shoulder: {
        left: this.calculateAngle(
          landmarks[PoseLandmarkIndex.LEFT_HIP],
          landmarks[PoseLandmarkIndex.LEFT_SHOULDER],
          landmarks[PoseLandmarkIndex.LEFT_ELBOW]
        ),
        right: this.calculateAngle(
          landmarks[PoseLandmarkIndex.RIGHT_HIP],
          landmarks[PoseLandmarkIndex.RIGHT_SHOULDER],
          landmarks[PoseLandmarkIndex.RIGHT_ELBOW]
        ),
      },
      elbow: {
        left: this.calculateAngle(
          landmarks[PoseLandmarkIndex.LEFT_SHOULDER],
          landmarks[PoseLandmarkIndex.LEFT_ELBOW],
          landmarks[PoseLandmarkIndex.LEFT_WRIST]
        ),
        right: this.calculateAngle(
          landmarks[PoseLandmarkIndex.RIGHT_SHOULDER],
          landmarks[PoseLandmarkIndex.RIGHT_ELBOW],
          landmarks[PoseLandmarkIndex.RIGHT_WRIST]
        ),
      },
      wrist: {
        left: this.calculateAngle(
          landmarks[PoseLandmarkIndex.LEFT_ELBOW],
          landmarks[PoseLandmarkIndex.LEFT_WRIST],
          landmarks[PoseLandmarkIndex.LEFT_INDEX]
        ),
        right: this.calculateAngle(
          landmarks[PoseLandmarkIndex.RIGHT_ELBOW],
          landmarks[PoseLandmarkIndex.RIGHT_WRIST],
          landmarks[PoseLandmarkIndex.RIGHT_INDEX]
        ),
      },
      hip: {
        left: this.calculateAngle(
          landmarks[PoseLandmarkIndex.LEFT_SHOULDER],
          landmarks[PoseLandmarkIndex.LEFT_HIP],
          landmarks[PoseLandmarkIndex.LEFT_KNEE]
        ),
        right: this.calculateAngle(
          landmarks[PoseLandmarkIndex.RIGHT_SHOULDER],
          landmarks[PoseLandmarkIndex.RIGHT_HIP],
          landmarks[PoseLandmarkIndex.RIGHT_KNEE]
        ),
      },
      knee: {
        left: this.calculateAngle(
          landmarks[PoseLandmarkIndex.LEFT_HIP],
          landmarks[PoseLandmarkIndex.LEFT_KNEE],
          landmarks[PoseLandmarkIndex.LEFT_ANKLE]
        ),
        right: this.calculateAngle(
          landmarks[PoseLandmarkIndex.RIGHT_HIP],
          landmarks[PoseLandmarkIndex.RIGHT_KNEE],
          landmarks[PoseLandmarkIndex.RIGHT_ANKLE]
        ),
      },
    };
  }

  /**
   * Calculate angle between three points using vector math
   * @param point1 First landmark point
   * @param point2 Middle landmark point (vertex)
   * @param point3 Third landmark point
   * @returns Angle in degrees
   */
  private calculateAngle(
    point1: NormalizedLandmark,
    point2: NormalizedLandmark,
    point3: NormalizedLandmark
  ): number {
    // Create vectors from point2 to point1 and point2 to point3
    const vector1 = {
      x: point1.x - point2.x,
      y: point1.y - point2.y,
      z: point1.z - point2.z,
    };

    const vector2 = {
      x: point3.x - point2.x,
      y: point3.y - point2.y,
      z: point3.z - point2.z,
    };

    // Calculate dot product
    const dotProduct = 
      vector1.x * vector2.x + 
      vector1.y * vector2.y + 
      vector1.z * vector2.z;

    // Calculate magnitudes
    const magnitude1 = Math.sqrt(
      vector1.x ** 2 + vector1.y ** 2 + vector1.z ** 2
    );
    const magnitude2 = Math.sqrt(
      vector2.x ** 2 + vector2.y ** 2 + vector2.z ** 2
    );

    // Avoid division by zero
    if (magnitude1 === 0 || magnitude2 === 0) {
      return 0;
    }

    // Calculate angle using dot product formula
    const cosAngle = dotProduct / (magnitude1 * magnitude2);
    
    // Clamp to [-1, 1] to handle floating point errors
    const clampedCosAngle = Math.max(-1, Math.min(1, cosAngle));
    
    // Convert to degrees
    const angleRadians = Math.acos(clampedCosAngle);
    const angleDegrees = (angleRadians * 180) / Math.PI;

    return angleDegrees;
  }

  /**
   * Calculate deviations between user and gold standard angles
   * @param userAngles User's joint angles
   * @param goldAngles Gold standard joint angles
   * @returns Deviation scores with severity levels
   */
  calculateDeviations(
    userAngles: JointAngles,
    goldAngles: JointAngles
  ): DeviationScores {
    const deviations: DeviationScores = {};

    // Calculate deviations for each joint
    const joints: Array<keyof JointAngles> = ['shoulder', 'elbow', 'wrist', 'hip', 'knee'];
    const sides: Array<'left' | 'right'> = ['left', 'right'];

    for (const joint of joints) {
      for (const side of sides) {
        const userAngle = userAngles[joint][side];
        const goldAngle = goldAngles[joint][side];
        const deviation = Math.abs(userAngle - goldAngle);
        
        // Determine severity based on deviation thresholds
        let severity: 'high' | 'medium' | 'low';
        if (deviation > 15) {
          severity = 'high';
        } else if (deviation >= 10) {
          severity = 'medium';
        } else {
          severity = 'low';
        }

        const segmentKey = `${side}_${joint}`;
        deviations[segmentKey] = {
          deviation,
          severity,
        };
      }
    }

    return deviations;
  }

  /**
   * Compare user poses against gold standard poses
   * @param userLandmarks User's pose landmark data
   * @param goldStandardLandmarks Gold standard pose landmark data
   * @returns Comparison result with deviations and overall score
   */
  async comparePoses(
    userLandmarks: PoseLandmarkData[],
    goldStandardLandmarks: PoseLandmarkData[]
  ): Promise<ComparisonResult> {
    const allDeviations: DeviationScores[] = [];
    const keyFrames: number[] = [];

    // Compare each frame
    const minFrames = Math.min(userLandmarks.length, goldStandardLandmarks.length);
    
    for (let i = 0; i < minFrames; i++) {
      const userAngles = this.calculateJointAngles(userLandmarks[i].landmarks);
      const goldAngles = this.calculateJointAngles(goldStandardLandmarks[i].landmarks);
      
      const frameDeviations = this.calculateDeviations(userAngles, goldAngles);
      allDeviations.push(frameDeviations);

      // Identify key frames with significant deviations
      const hasSignificantDeviation = Object.values(frameDeviations).some(
        (dev) => dev.severity === 'high'
      );
      
      if (hasSignificantDeviation) {
        keyFrames.push(i);
      }
    }

    // Calculate average deviations across all frames
    const averageDeviations = this.calculateAverageDeviations(allDeviations);

    // Calculate overall score (0-100)
    const overallScore = this.calculateOverallScore(averageDeviations);

    return {
      deviations: averageDeviations,
      overallScore,
      keyFrames,
    };
  }

  /**
   * Calculate average deviations across all frames
   * @param allDeviations Array of deviation scores for each frame
   * @returns Average deviation scores
   */
  private calculateAverageDeviations(
    allDeviations: DeviationScores[]
  ): DeviationScores {
    if (allDeviations.length === 0) {
      return {};
    }

    const averageDeviations: DeviationScores = {};
    const segmentKeys = Object.keys(allDeviations[0]);

    for (const key of segmentKeys) {
      const deviationValues = allDeviations.map((d) => d[key].deviation);
      const averageDeviation = 
        deviationValues.reduce((sum, val) => sum + val, 0) / deviationValues.length;

      // Determine severity based on average deviation
      let severity: 'high' | 'medium' | 'low';
      if (averageDeviation > 15) {
        severity = 'high';
      } else if (averageDeviation >= 10) {
        severity = 'medium';
      } else {
        severity = 'low';
      }

      averageDeviations[key] = {
        deviation: averageDeviation,
        severity,
      };
    }

    return averageDeviations;
  }

  /**
   * Calculate overall score based on deviations
   * @param deviations Deviation scores
   * @returns Overall score (0-100)
   */
  private calculateOverallScore(deviations: DeviationScores): number {
    const deviationValues = Object.values(deviations);
    
    if (deviationValues.length === 0) {
      return 100;
    }

    // Calculate average deviation
    const totalDeviation = deviationValues.reduce(
      (sum, dev) => sum + dev.deviation,
      0
    );
    const averageDeviation = totalDeviation / deviationValues.length;

    // Convert to score (0-100)
    // Perfect form (0° deviation) = 100 points
    // 30° average deviation = 0 points
    const score = Math.max(0, Math.min(100, 100 - (averageDeviation / 30) * 100));

    return Math.round(score);
  }

  /**
   * Generate feedback report from comparison result
   * @param comparison Comparison result
   * @param videoUri User's video URI
   * @param userLandmarks User's pose landmarks
   * @returns Complete analysis report with categorized feedback
   */
  async generateFeedback(
    comparison: ComparisonResult,
    videoUri: string,
    userLandmarks: PoseLandmarkData[]
  ): Promise<AnalysisReport> {
    // Create feedback issues from deviations
    const issues = this.createFeedbackIssues(comparison.deviations);

    // Categorize issues
    const categories = this.categorizeIssues(issues);

    // Generate unique ID
    const id = `analysis_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    return {
      id,
      overallScore: comparison.overallScore,
      categories,
      timestamp: new Date(),
      videoUri,
      userLandmarks,
    };
  }

  /**
   * Create feedback issues from deviation scores
   * @param deviations Deviation scores
   * @returns Array of feedback issues
   */
  private createFeedbackIssues(deviations: DeviationScores): FeedbackIssue[] {
    const issues: FeedbackIssue[] = [];

    for (const [segmentKey, deviation] of Object.entries(deviations)) {
      // Skip low severity issues
      if (deviation.severity === 'low') {
        continue;
      }

      // Parse segment key (e.g., "left_shoulder" -> "left", "shoulder")
      const [side, joint] = segmentKey.split('_');
      const segment = joint as BodySegment;

      // Generate description and recommendation
      const { description, recommendation } = this.generateFeedbackText(
        segment,
        side,
        deviation.deviation,
        deviation.severity
      );

      issues.push({
        segment,
        severity: deviation.severity,
        deviationDegrees: Math.round(deviation.deviation),
        description,
        recommendation,
      });
    }

    // Sort by severity (high first) and then by deviation amount
    issues.sort((a, b) => {
      if (a.severity !== b.severity) {
        const severityOrder = { high: 0, medium: 1, low: 2 };
        return severityOrder[a.severity] - severityOrder[b.severity];
      }
      return b.deviationDegrees - a.deviationDegrees;
    });

    return issues;
  }

  /**
   * Categorize issues into body regions
   * @param issues Array of feedback issues
   * @returns Categorized feedback
   */
  private categorizeIssues(issues: FeedbackIssue[]): FeedbackCategory[] {
    const upperBodySegments: BodySegment[] = ['shoulder', 'elbow', 'wrist'];
    const lowerBodySegments: BodySegment[] = ['hip', 'knee', 'ankle'];

    const upperBodyIssues = issues.filter((issue) =>
      upperBodySegments.includes(issue.segment)
    );
    const lowerBodyIssues = issues.filter((issue) =>
      lowerBodySegments.includes(issue.segment)
    );

    const categories: FeedbackCategory[] = [];

    if (upperBodyIssues.length > 0) {
      categories.push({
        name: 'Upper Body',
        issues: upperBodyIssues,
      });
    }

    if (lowerBodyIssues.length > 0) {
      categories.push({
        name: 'Lower Body',
        issues: lowerBodyIssues,
      });
    }

    // Add overall form category if there are multiple issues
    if (issues.length >= 3) {
      const overallIssue: FeedbackIssue = {
        segment: 'shoulder', // Placeholder segment
        severity: 'medium',
        deviationDegrees: 0,
        description: 'Multiple form deviations detected across your throwing motion',
        recommendation: 'Focus on the high-priority issues first, then work on refining your overall technique. Consider recording multiple throws to track improvement over time.',
      };

      categories.push({
        name: 'Overall Form',
        issues: [overallIssue],
      });
    }

    return categories;
  }

  /**
   * Generate description and recommendation text for a feedback issue
   * @param segment Body segment
   * @param side Left or right side
   * @param deviation Deviation amount in degrees
   * @param severity Severity level
   * @returns Description and recommendation text
   */
  private generateFeedbackText(
    segment: BodySegment,
    side: string,
    deviation: number,
    severity: 'high' | 'medium' | 'low'
  ): { description: string; recommendation: string } {
    const sideText = side.charAt(0).toUpperCase() + side.slice(1);
    const deviationText = `${Math.round(deviation)}°`;

    // Generate segment-specific feedback
    const feedbackTemplates: Record<
      BodySegment,
      { description: string; recommendation: string }
    > = {
      shoulder: {
        description: `${sideText} shoulder angle deviates by ${deviationText} from ideal form`,
        recommendation: 'Focus on keeping your shoulder aligned with your target. Practice rotating your shoulders smoothly through the throwing motion.',
      },
      elbow: {
        description: `${sideText} elbow angle deviates by ${deviationText} from ideal form`,
        recommendation: 'Keep your elbow at the proper height and angle. Avoid dropping or raising your elbow too much during the throw.',
      },
      wrist: {
        description: `${sideText} wrist angle deviates by ${deviationText} from ideal form`,
        recommendation: 'Maintain a firm wrist position throughout the throw. Practice wrist snap drills to improve control and consistency.',
      },
      hip: {
        description: `${sideText} hip angle deviates by ${deviationText} from ideal form`,
        recommendation: 'Engage your hips more in the throwing motion. Rotate your hips toward the target to generate more power and accuracy.',
      },
      knee: {
        description: `${sideText} knee angle deviates by ${deviationText} from ideal form`,
        recommendation: 'Check your stance and weight distribution. Maintain proper knee bend for stability and power transfer.',
      },
      ankle: {
        description: `${sideText} ankle position deviates by ${deviationText} from ideal form`,
        recommendation: 'Ensure proper foot placement and ankle stability. Your base should be solid throughout the throwing motion.',
      },
    };

    return feedbackTemplates[segment];
  }
}
