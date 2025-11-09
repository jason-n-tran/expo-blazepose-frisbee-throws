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

  const handleRecordVideo = () => {
    // Navigate to camera tab with analysis flag
    router.push({
      pathname: '/(tabs)',
      params: { forAnalysis: 'true' }
    });
  };

  const handleSelectVideo = async () => {
    console.log('[InputSelection] handleSelectVideo called');
    
    if (isSelecting) {
      console.log('[InputSelection] Already selecting, returning');
      return;
    }
    
    setIsSelecting(true);
    try {
      // Request media library permissions
      console.log('[InputSelection] Requesting media library permissions...');
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      console.log('[InputSelection] Permission status:', status);
      
      if (status !== 'granted') {
        console.error('[InputSelection] Permission denied');
        setError(new AnalysisError(
          AnalysisErrorType.INSUFFICIENT_STORAGE,
          'Media library permission is required to select videos.',
          true
        ));
        setShowErrorDialog(true);
        return;
      }

      // Launch image picker with video filter
      console.log('[InputSelection] Launching image picker...');
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['videos'],
        allowsEditing: false,
        quality: 1,
        videoMaxDuration: 60, // 60 seconds max
      });

      console.log('[InputSelection] Image picker result:', JSON.stringify(result, null, 2));

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const video = result.assets[0];
        const uri = video.uri;
        console.log('[InputSelection] Selected video URI:', uri);
        console.log('[InputSelection] Video details:', JSON.stringify(video, null, 2));

        // Validate video using VideoProcessingService
        console.log('[InputSelection] Validating video...');
        const validation = await videoProcessingService.validateVideo(uri);
        console.log('[InputSelection] Validation result:', JSON.stringify(validation, null, 2));
        
        if (!validation.isValid) {
          console.error('[InputSelection] Video validation failed:', validation.error);
          
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
        console.log('[InputSelection] Navigating to processing screen with URI:', uri);
        router.push({
          pathname: '/analysis/processing',
          params: { videoUri: uri }
        });
      } else {
        console.log('[InputSelection] User canceled or no video selected');
      }
    } catch (error) {
      console.error('[InputSelection] Error selecting video:', error);
      
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
      console.log('[InputSelection] Setting isSelecting to false');
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
      <VideoInputSelector 
        onRecordPressed={handleRecordVideo}
        onSelectPressed={handleSelectVideo} 
      />
      
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
