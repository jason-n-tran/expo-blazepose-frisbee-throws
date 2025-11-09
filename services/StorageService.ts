/**
 * StorageService
 * 
 * Service for managing local data persistence using MMKV,
 * including analysis history and gold standard data.
 */

import { MMKV } from 'react-native-mmkv';
import {
  AnalysisReport,
  StoredAnalysis,
  GoldStandardData,
  PoseLandmarkData,
} from '@/types/pose';

/**
 * Storage keys for MMKV
 */
const STORAGE_KEYS = {
  ANALYSIS_HISTORY: 'analysis_history',
  GOLD_STANDARD: 'gold_standard_data',
  USER_PREFERENCES: 'user_preferences',
} as const;

/**
 * MMKV storage instance
 */
const storage = new MMKV();

/**
 * StorageService class for data persistence
 */
export class StorageService {
  /**
   * Save an analysis report to storage
   * @param report Analysis report to save
   * @returns Unique ID of saved analysis
   */
  async saveAnalysis(report: AnalysisReport): Promise<string> {
    const storedAnalysis: StoredAnalysis = {
      id: report.id,
      timestamp: report.timestamp.getTime(),
      videoUri: report.videoUri,
      report,
    };

    // Get existing history
    const history = await this.getAnalysisHistory();
    
    // Add new analysis
    history.push(storedAnalysis);
    
    // Save updated history
    storage.set(STORAGE_KEYS.ANALYSIS_HISTORY, JSON.stringify(history));
    
    return report.id;
  }

  /**
   * Get all saved analyses
   * @returns Array of stored analyses
   */
  async getAnalysisHistory(): Promise<StoredAnalysis[]> {
    const historyJson = storage.getString(STORAGE_KEYS.ANALYSIS_HISTORY);
    
    if (!historyJson) {
      return [];
    }

    try {
      const history = JSON.parse(historyJson) as StoredAnalysis[];
      return history;
    } catch (error) {
      console.error('Failed to parse analysis history:', error);
      return [];
    }
  }

  /**
   * Get a single analysis by ID
   * @param id Analysis ID
   * @returns Stored analysis or null if not found
   */
  async getAnalysisById(id: string): Promise<StoredAnalysis | null> {
    const history = await this.getAnalysisHistory();
    const analysis = history.find((item) => item.id === id);
    return analysis || null;
  }

  /**
   * Delete an analysis by ID
   * @param id Analysis ID to delete
   */
  async deleteAnalysis(id: string): Promise<void> {
    const history = await this.getAnalysisHistory();
    const filteredHistory = history.filter((item) => item.id !== id);
    storage.set(STORAGE_KEYS.ANALYSIS_HISTORY, JSON.stringify(filteredHistory));
  }

  /**
   * Get gold standard reference data
   * @returns Gold standard data with placeholder values
   */
  async getGoldStandardData(): Promise<GoldStandardData> {
    // Check if gold standard data exists in storage
    const storedData = storage.getString(STORAGE_KEYS.GOLD_STANDARD);
    
    if (storedData) {
      try {
        return JSON.parse(storedData) as GoldStandardData;
      } catch (error) {
        console.error('Failed to parse gold standard data:', error);
      }
    }

    // Return placeholder data if not found
    return this.getPlaceholderGoldStandardData();
  }

  /**
   * Get placeholder gold standard data
   * @returns Placeholder gold standard data
   */
  private getPlaceholderGoldStandardData(): GoldStandardData {
    // Create placeholder landmarks for a typical throwing motion
    // This represents key frames of an ideal frisbee throw
    const placeholderLandmarks: PoseLandmarkData[] = [
      {
        frameIndex: 0,
        timestamp: 0,
        landmarks: this.createPlaceholderLandmarks(),
        worldLandmarks: this.createPlaceholderWorldLandmarks(),
      },
      {
        frameIndex: 15,
        timestamp: 500,
        landmarks: this.createPlaceholderLandmarks(),
        worldLandmarks: this.createPlaceholderWorldLandmarks(),
      },
      {
        frameIndex: 30,
        timestamp: 1000,
        landmarks: this.createPlaceholderLandmarks(),
        worldLandmarks: this.createPlaceholderWorldLandmarks(),
      },
    ];

    return {
      videoUri: 'placeholder://gold-standard-video',
      landmarks: placeholderLandmarks,
      metadata: {
        description: 'Professional ultimate frisbee backhand throw',
        athleteName: 'Gold Standard Athlete',
        recordedDate: new Date('2024-01-01'),
      },
    };
  }

  /**
   * Create placeholder normalized landmarks (33 points)
   */
  private createPlaceholderLandmarks() {
    // Create 33 placeholder landmarks with normalized coordinates
    return Array.from({ length: 33 }, (_, index) => ({
      x: 0.5,
      y: 0.5,
      z: 0,
      visibility: 1.0,
    }));
  }

  /**
   * Create placeholder world landmarks (33 points)
   */
  private createPlaceholderWorldLandmarks() {
    // Create 33 placeholder world landmarks in meters
    return Array.from({ length: 33 }, (_, index) => ({
      x: 0,
      y: 0,
      z: 0,
      visibility: 1.0,
    }));
  }

  /**
   * Set gold standard data (for future use when real data is available)
   * @param data Gold standard data to store
   */
  async setGoldStandardData(data: GoldStandardData): Promise<void> {
    storage.set(STORAGE_KEYS.GOLD_STANDARD, JSON.stringify(data));
  }
}
