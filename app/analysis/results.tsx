import React, { useState } from 'react';
import { View, Text, Alert } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { FeedbackDisplay } from '@/components/FeedbackDisplay';
import { ErrorDialog } from '@/components/ErrorDialog';
import { Button, ButtonText } from '@/components/ui/button';
import { AnalysisError, AnalysisErrorType } from '@/types/errors';
import type { AnalysisReport, BodySegment } from '@/types/pose';

export default function ResultsScreen() {
  const params = useLocalSearchParams();
  const router = useRouter();
  const [selectedSegment, setSelectedSegment] = useState<BodySegment | null>(null);
  const [error, setError] = useState<AnalysisError | Error | null>(null);
  const [showErrorDialog, setShowErrorDialog] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Parse analysis report from params
  // In a real implementation, this would come from navigation params or storage
  const analysisReport: AnalysisReport | null = params.report 
    ? JSON.parse(params.report as string)
    : null;

  const handleSegmentPress = (segment: BodySegment) => {
    setSelectedSegment(segment);
  };

  const handleViewComparison = () => {
    if (!analysisReport) {
      Alert.alert('Error', 'No analysis data available');
      return;
    }

    // Navigate to comparison viewer with analysis ID and highlighted segment
    router.push({
      pathname: '/comparison/[id]',
      params: {
        id: analysisReport.id,
        highlightedSegment: selectedSegment || '',
      },
    });
  };

  const handleSaveAnalysis = async () => {
    if (!analysisReport) {
      Alert.alert('Error', 'No analysis data available');
      return;
    }

    if (isSaving) return;

    setIsSaving(true);
    try {
      // Import StorageService dynamically to avoid circular dependencies
      const { StorageService } = await import('@/services/StorageService');
      const storageService = new StorageService();
      await storageService.saveAnalysis(analysisReport);
      
      Alert.alert('Success', 'Analysis saved successfully');
    } catch (err) {
      console.error('Failed to save analysis:', err);
      
      if (err instanceof AnalysisError) {
        setError(err);
      } else {
        setError(new AnalysisError(
          AnalysisErrorType.INSUFFICIENT_STORAGE,
          'Failed to save analysis. Please try again.',
          true
        ));
      }
      setShowErrorDialog(true);
    } finally {
      setIsSaving(false);
    }
  };

  const handleCloseError = () => {
    setShowErrorDialog(false);
    setError(null);
  };

  const handleRetry = () => {
    handleSaveAnalysis();
  };

  const handleNewAnalysis = () => {
    // Navigate back to input selection
    router.push('/analysis/input-selection');
  };

  if (!analysisReport) {
    return (
      <View className="flex-1 bg-gray-50 justify-center items-center px-6">
        <Text className="text-gray-800 text-xl font-bold mb-4">
          No Analysis Data
        </Text>
        <Text className="text-gray-600 text-base text-center mb-6">
          No analysis results available. Please start a new analysis.
        </Text>
        <Button onPress={handleNewAnalysis}>
          <ButtonText>New Analysis</ButtonText>
        </Button>
      </View>
    );
  }

  return (
    <>
      <View className="flex-1 bg-gray-50">
        {/* Feedback Display */}
        <View className="flex-1">
          <FeedbackDisplay
            analysisReport={analysisReport}
            onSegmentPress={handleSegmentPress}
          />
        </View>

        {/* Action Buttons */}
        <View className="bg-white p-4 border-t border-gray-200">
          <Button
            onPress={handleViewComparison}
            className="mb-3"
          >
            <ButtonText>View Comparison</ButtonText>
          </Button>

          <View className="flex-row gap-3">
            <Button
              onPress={handleSaveAnalysis}
              variant="outline"
              className="flex-1"
              disabled={isSaving}
            >
              <ButtonText className="text-primary-500">
                {isSaving ? 'Saving...' : 'Save Analysis'}
              </ButtonText>
            </Button>

            <Button
              onPress={handleNewAnalysis}
              variant="outline"
              className="flex-1"
            >
              <ButtonText className="text-primary-500">New Analysis</ButtonText>
            </Button>
          </View>
        </View>
      </View>

      <ErrorDialog
        isOpen={showErrorDialog}
        error={error}
        onClose={handleCloseError}
        onRetry={handleRetry}
        showRetry={true}
      />
    </>
  );
}
