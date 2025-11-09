import { View, Text, ActivityIndicator } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useState, useEffect } from 'react';
import { Button, ButtonText } from '@/components/ui/button';
import { Progress, ProgressFilledTrack } from '@/components/ui/progress';

export default function ProcessingScreen() {
  const params = useLocalSearchParams<{ videoUri: string }>();
  const router = useRouter();
  const [progress, setProgress] = useState(0);
  const [currentFrame, setCurrentFrame] = useState(0);
  const [totalFrames, setTotalFrames] = useState(0);
  const [estimatedTime, setEstimatedTime] = useState('Calculating...');

  useEffect(() => {
    // Placeholder for pose detection processing
    // Will be implemented in task 3
    console.log('Processing video:', params.videoUri);
  }, [params.videoUri]);

  const handleCancel = () => {
    router.back();
  };

  return (
    <View className="flex-1 bg-black justify-center items-center px-6">
      <View className="items-center mb-8">
        <ActivityIndicator size="large" color="#ffffff" />
        <Text className="text-white text-xl font-semibold mt-4">
          Processing Video
        </Text>
      </View>

      <View className="w-full max-w-md mb-6">
        <Progress value={progress} className="w-full h-2 mb-2">
          <ProgressFilledTrack className="h-2" />
        </Progress>
        <Text className="text-gray-400 text-center">
          {progress.toFixed(0)}% Complete
        </Text>
      </View>

      {totalFrames > 0 && (
        <Text className="text-gray-300 text-center mb-2">
          Processing frame {currentFrame} of {totalFrames}
        </Text>
      )}

      <Text className="text-gray-400 text-sm text-center mb-8">
        Estimated time remaining: {estimatedTime}
      </Text>

      <Button
        variant="outline"
        onPress={handleCancel}
      >
        <ButtonText>Cancel</ButtonText>
      </Button>
    </View>
  );
}
