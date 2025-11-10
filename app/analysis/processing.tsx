/**
 * Processing Screen
 * 
 * Displays progress while video is being processed through pose detection.
 * Shows frame counter, progress indicator, and estimated time remaining.
 */

import React, { useEffect, useState, useRef } from 'react';
import { View, Text, ActivityIndicator } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Button, ButtonText } from '@/components/ui/button';
import { Progress, ProgressFilledTrack } from '@/components/ui/progress';
import { ErrorDialog } from '@/components/ErrorDialog';
import { PoseDetectionService } from '@/services/PoseDetectionService';
import { VideoProcessingService } from '@/services/VideoProcessingService';
import { VideoFrameExtractor, VideoFrameExtractorRef } from '@/components/VideoFrameExtractor';
import { ImageDecoder, ImageDecoderRef } from '@/components/ImageDecoder';
import { AnalysisError, AnalysisErrorType } from '@/types/errors';

export default function ProcessingScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ videoUri: string }>();
  const videoUri = params.videoUri;

  console.log('[ProcessingScreen] Component mounted');
  console.log('[ProcessingScreen] Params:', JSON.stringify(params));
  console.log('[ProcessingScreen] Video URI:', videoUri);

  const [progress, setProgress] = useState(0);
  const [currentFrame, setCurrentFrame] = useState(0);
  const [totalFrames, setTotalFrames] = useState(0);
  const [estimatedTimeRemaining, setEstimatedTimeRemaining] = useState<number | null>(null);
  const [error, setError] = useState<AnalysisError | Error | null>(null);
  const [showErrorDialog, setShowErrorDialog] = useState(false);
  const [isCancelled, setIsCancelled] = useState(false);
  const [isInitializing, setIsInitializing] = useState(true);

  const poseDetectionService = useRef(new PoseDetectionService());
  const videoProcessingService = useRef(new VideoProcessingService());
  const frameExtractorRef = useRef<VideoFrameExtractorRef>(null);
  const imageDecoderRef = useRef<ImageDecoderRef>(null);
  const startTime = useRef<number>(Date.now());

  useEffect(() => {
    console.log('[ProcessingScreen] useEffect triggered');
    
    if (!videoUri) {
      console.error('[ProcessingScreen] No video URI provided!');
      setError(new Error('No video selected'));
      return;
    }

    // Set frame extractor and image decoder references
    if (frameExtractorRef.current) {
      videoProcessingService.current.setFrameExtractor(frameExtractorRef.current);
    }
    if (imageDecoderRef.current) {
      poseDetectionService.current.setImageDecoder(imageDecoderRef.current);
    }

    console.log('[ProcessingScreen] Starting video processing...');
    processVideo();

    // Cleanup on unmount
    return () => {
      poseDetectionService.current.dispose();
    };
  }, [videoUri]);

  const processVideo = async () => {
    console.log('[ProcessingScreen] processVideo called');
    
    try {
      // Initialize pose detection service
      console.log('[ProcessingScreen] Initializing pose detection service...');
      setIsInitializing(true);
      try {
        await poseDetectionService.current.initialize();
        console.log('[ProcessingScreen] Pose detection service initialized');
      } catch (err) {
        console.error('[ProcessingScreen] Error initializing pose detection:', err);
        
        // Try offline model as fallback if network error
        if (err instanceof AnalysisError && err.type === AnalysisErrorType.NETWORK_ERROR) {
          console.log('[ProcessingScreen] Attempting to use offline model...');
          try {
            await poseDetectionService.current.initialize(true);
            console.log('[ProcessingScreen] Offline model initialized');
          } catch (offlineErr) {
            console.error('[ProcessingScreen] Offline model failed:', offlineErr);
            throw err; // Throw original network error
          }
        } else {
          throw err;
        }
      }
      setIsInitializing(false);

      // Get video duration to estimate total frames
      console.log('[ProcessingScreen] Getting video duration...');
      const duration = await videoProcessingService.current.getVideoDuration(videoUri);
      console.log('[ProcessingScreen] Video duration:', duration);
      
      const estimatedFrames = Math.floor(duration * 10); // 10 FPS
      console.log('[ProcessingScreen] Estimated frames:', estimatedFrames);
      setTotalFrames(estimatedFrames);

      // Process video with progress tracking
      const landmarks = await poseDetectionService.current.detectPosesInVideo(
        videoUri,
        videoProcessingService.current,
        (progressPercent) => {
          if (isCancelled) return;

          setProgress(progressPercent);
          
          // Calculate current frame based on progress
          const currentFrameNum = Math.floor((progressPercent / 100) * estimatedFrames);
          setCurrentFrame(currentFrameNum);

          // Calculate estimated time remaining
          const elapsed = Date.now() - startTime.current;
          const estimatedTotal = (elapsed / progressPercent) * 100;
          const remaining = Math.max(0, estimatedTotal - elapsed);
          setEstimatedTimeRemaining(Math.ceil(remaining / 1000)); // Convert to seconds
        }
      );

      if (isCancelled) return;

      // Navigate to results screen with landmarks data
      router.push({
        pathname: '/analysis/results',
        params: {
          videoUri,
          landmarksData: JSON.stringify(landmarks),
        },
      });
    } catch (err) {
      console.error('Processing error:', err);
      
      if (err instanceof AnalysisError) {
        setError(err);
      } else {
        setError(new AnalysisError(
          AnalysisErrorType.POSE_DETECTION_FAILED,
          err instanceof Error ? err.message : 'Failed to process video',
          true
        ));
      }
      setShowErrorDialog(true);
    }
  };

  const handleCancel = () => {
    setIsCancelled(true);
    poseDetectionService.current.dispose();
    router.back();
  };

  const handleCloseError = () => {
    setShowErrorDialog(false);
    router.back();
  };

  const handleRetry = () => {
    setError(null);
    setShowErrorDialog(false);
    setProgress(0);
    setCurrentFrame(0);
    setIsCancelled(false);
    startTime.current = Date.now();
    processVideo();
  };

  return (
    <>
      <View className="flex-1 bg-background items-center justify-center p-6">
        <View className="items-center max-w-md w-full">
          {/* Progress Circle */}
          <View className="mb-8 items-center">
            <View className="relative items-center justify-center">
              <ActivityIndicator size="large" color="#3b82f6" />
              <Text className="text-4xl font-bold text-primary-600 mt-4">
                {progress}%
              </Text>
            </View>
          </View>

          {/* Progress Bar */}
          <View className="w-full mb-6">
            <Progress value={progress} className="w-full h-3 bg-gray-200">
              <ProgressFilledTrack 
                className="bg-primary-600" 
                style={{ width: `${progress}%` }}
              />
            </Progress>
          </View>

          {/* Frame Counter */}
          {!isInitializing && totalFrames > 0 && (
            <Text className="text-lg text-gray-700 mb-2">
              Processing frame {currentFrame} of {totalFrames}
            </Text>
          )}

          {/* Estimated Time Remaining */}
          {estimatedTimeRemaining !== null && estimatedTimeRemaining > 0 && (
            <Text className="text-md text-gray-500 mb-6">
              Estimated time remaining: {estimatedTimeRemaining}s
            </Text>
          )}

          {/* Status Message */}
          <Text className="text-center text-gray-600 mb-8">
            {isInitializing 
              ? 'Loading pose detection model...' 
              : 'Analyzing your throwing form using AI pose detection...'}
          </Text>

          {/* Cancel Button */}
          <Button
            onPress={handleCancel}
            variant="outline"
            className="border-gray-300"
          >
            <ButtonText className="text-gray-700">Cancel</ButtonText>
          </Button>
        </View>
      </View>

      {/* Hidden video frame extractor component */}
      <VideoFrameExtractor ref={frameExtractorRef} />
      
      {/* Hidden image decoder component */}
      <ImageDecoder ref={imageDecoderRef} />

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
