import React, { useState } from 'react';
import { useRouter } from 'expo-router';
import { VideoInputSelector } from '@/components/VideoInputSelector';
import { ErrorDialog } from '@/components/ErrorDialog';
import { VideoProcessingService } from '@/services/VideoProcessingService';
import { AnalysisError, AnalysisErrorType } from '@/types/errors';
import * as ImagePicker from 'expo-image-picker';

export default function InputSelectionScreen() {
  const router = useRouter();
  const [isSelecting, setIsSelecting] = useState(false);
  const [error, setError] = useState<AnalysisError | Error | null>(null);
  const [showErrorDialog, setShowErrorDialog] = useState(false);

  const videoProcessingService = new VideoProcessingService();

  const handleSelectVideo = async () => {
    if (isSelecting) return;
    
    setIsSelecting(true);
    try {
      // Request media library permissions
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      
      if (status !== 'granted') {
        setError(new AnalysisError(
          AnalysisErrorType.INSUFFICIENT_STORAGE,
          'Media library permission is required to select videos.',
          true
        ));
        setShowErrorDialog(true);
        return;
      }

      // Launch image picker with video filter
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['videos'],
        allowsEditing: false,
        quality: 1,
        videoMaxDuration: 60, // 60 seconds max
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const video = result.assets[0];
        const uri = video.uri;

        // Validate video using VideoProcessingService
        const validation = await videoProcessingService.validateVideo(uri);
        
        if (!validation.isValid) {
          // Determine error type based on validation error
          let errorType = AnalysisErrorType.VIDEO_LOAD_FAILED;
          if (validation.error?.includes('format')) {
            errorType = AnalysisErrorType.VIDEO_INVALID_FORMAT;
          } else if (validation.error?.includes('long')) {
            errorType = AnalysisErrorType.VIDEO_TOO_LONG;
          } else if (validation.error?.includes('corrupted')) {
            errorType = AnalysisErrorType.VIDEO_CORRUPTED;
          }
          
          setError(new AnalysisError(
            errorType,
            validation.error || 'Video validation failed',
            true
          ));
          setShowErrorDialog(true);
          return;
        }

        // Navigate to processing screen with video URI
        router.push({
          pathname: '/analysis/processing',
          params: { videoUri: uri }
        });
      }
    } catch (error) {
      console.error('Error selecting video:', error);
      
      if (error instanceof AnalysisError) {
        setError(error);
      } else {
        setError(new AnalysisError(
          AnalysisErrorType.VIDEO_LOAD_FAILED,
          'Failed to select video. Please try again.',
          true
        ));
      }
      setShowErrorDialog(true);
    } finally {
      setIsSelecting(false);
    }
  };

  const handleCloseError = () => {
    setShowErrorDialog(false);
    setError(null);
  };

  const handleRetry = () => {
    handleSelectVideo();
  };

  return (
    <>
      <VideoInputSelector onSelectPressed={handleSelectVideo} />
      
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
