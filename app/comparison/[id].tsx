/**
 * Comparison Screen
 * 
 * Dynamic route for viewing side-by-side video comparison with pose analysis.
 * Loads analysis data by ID and displays synchronized video playback with landmarks.
 */

import React, { useEffect, useState } from 'react';
import { View, Text, Pressable, ActivityIndicator, Alert } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { StorageService } from '@/services/StorageService';
import { ComparisonViewer } from '@/components/ComparisonViewer';
import { StoredAnalysis, BodySegment, GoldStandardData } from '@/types/pose';
import { Ionicons } from '@expo/vector-icons';

const storageService = new StorageService();

export default function ComparisonScreen() {
  const { id, highlightedSegment } = useLocalSearchParams<{
    id: string;
    highlightedSegment?: string;
  }>();
  const router = useRouter();

  const [analysis, setAnalysis] = useState<StoredAnalysis | null>(null);
  const [goldStandard, setGoldStandard] = useState<GoldStandardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [highlightedSegments, setHighlightedSegments] = useState<BodySegment[]>([]);

  useEffect(() => {
    loadAnalysisData();
  }, [id]);

  useEffect(() => {
    // Parse highlighted segment from params
    if (highlightedSegment) {
      try {
        const segments = JSON.parse(highlightedSegment) as BodySegment[];
        setHighlightedSegments(segments);
      } catch (e) {
        // If parsing fails, treat as single segment
        setHighlightedSegments([highlightedSegment as BodySegment]);
      }
    }
  }, [highlightedSegment]);

  const loadAnalysisData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Load analysis by ID
      const analysisData = await storageService.getAnalysisById(id);
      
      if (!analysisData) {
        setError('Analysis not found');
        setLoading(false);
        return;
      }

      // Load gold standard data
      const goldData = await storageService.getGoldStandardData();

      setAnalysis(analysisData);
      setGoldStandard(goldData);
      setLoading(false);
    } catch (err) {
      console.error('Failed to load analysis data:', err);
      setError('Failed to load analysis data');
      setLoading(false);
    }
  };

  const handleBack = () => {
    if (router.canGoBack()) {
      router.back();
    } else {
      router.push('/analysis/results');
    }
  };

  const handleError = () => {
    Alert.alert(
      'Error',
      error || 'Failed to load comparison data',
      [
        { text: 'Retry', onPress: loadAnalysisData },
        { text: 'Go Back', onPress: handleBack },
      ]
    );
  };

  // Show loading state
  if (loading) {
    return (
      <View className="flex-1 bg-black items-center justify-center">
        <ActivityIndicator size="large" color="#3B82F6" />
        <Text className="text-white mt-4 text-lg">Loading comparison...</Text>
      </View>
    );
  }

  // Show error state
  if (error || !analysis || !goldStandard) {
    return (
      <View className="flex-1 bg-black items-center justify-center p-6">
        <Ionicons name="alert-circle-outline" size={64} color="#EF4444" />
        <Text className="text-white text-xl font-semibold mt-4 text-center">
          {error || 'Analysis not found'}
        </Text>
        <Text className="text-gray-400 text-base mt-2 text-center">
          The requested analysis could not be loaded. It may have been deleted or corrupted.
        </Text>
        <View className="flex-row gap-4 mt-6">
          <Pressable
            onPress={loadAnalysisData}
            className="bg-blue-600 rounded-lg py-3 px-6"
          >
            <Text className="text-white font-semibold">Retry</Text>
          </Pressable>
          <Pressable
            onPress={handleBack}
            className="bg-gray-700 rounded-lg py-3 px-6"
          >
            <Text className="text-white font-semibold">Go Back</Text>
          </Pressable>
        </View>
      </View>
    );
  }

  return (
    <View className="flex-1 bg-black">
      {/* Header */}
      <View className="bg-gray-900 px-4 py-3 flex-row items-center border-b border-gray-800">
        <Pressable
          onPress={handleBack}
          className="mr-4 p-2"
        >
          <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
        </Pressable>
        <View className="flex-1">
          <Text className="text-white text-lg font-semibold">
            Video Comparison
          </Text>
          <Text className="text-gray-400 text-sm">
            {new Date(analysis.timestamp).toLocaleDateString()}
          </Text>
        </View>
        <View className="bg-blue-600 rounded-full px-3 py-1">
          <Text className="text-white font-semibold">
            {analysis.report.overallScore}
          </Text>
        </View>
      </View>

      {/* Comparison Viewer */}
      <ComparisonViewer
        userVideoUri={analysis.videoUri}
        goldStandardVideoUri={goldStandard.videoUri}
        userLandmarks={analysis.report.userLandmarks}
        goldStandardLandmarks={goldStandard.landmarks}
        highlightedSegments={highlightedSegments}
      />

      {/* Legend */}
      <View className="bg-gray-900 px-4 py-3 border-t border-gray-800">
        <View className="flex-row justify-around">
          <View className="flex-row items-center">
            <View className="w-4 h-4 rounded-full bg-green-500 mr-2" />
            <Text className="text-white text-sm">Your Form</Text>
          </View>
          <View className="flex-row items-center">
            <View className="w-4 h-4 rounded-full bg-yellow-500 mr-2" />
            <Text className="text-white text-sm">Gold Standard</Text>
          </View>
          {highlightedSegments.length > 0 && (
            <View className="flex-row items-center">
              <View className="w-4 h-4 rounded-full bg-red-500 mr-2" />
              <Text className="text-white text-sm">Highlighted</Text>
            </View>
          )}
        </View>
      </View>
    </View>
  );
}
