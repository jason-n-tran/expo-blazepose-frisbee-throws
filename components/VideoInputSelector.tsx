import React from 'react';
import { View, Text } from 'react-native';
import { useRouter } from 'expo-router';
import { Button, ButtonText, ButtonIcon } from '@/components/ui/button';
import IonIcon from '@expo/vector-icons/Ionicons';

interface VideoInputSelectorProps {
  onRecordPressed?: () => void;
  onSelectPressed?: () => void;
}

export function VideoInputSelector({ onRecordPressed, onSelectPressed }: VideoInputSelectorProps) {
  const router = useRouter();

  const handleRecordVideo = () => {
    if (onRecordPressed) {
      onRecordPressed();
    } else {
      // Navigate to camera tab and mark that we're coming from analysis
      router.push('/(tabs)');
    }
  };

  const handleSelectVideo = () => {
    if (onSelectPressed) {
      onSelectPressed();
    }
  };

  return (
    <View className="flex-1 bg-black justify-center items-center px-6">
      <View className="mb-12 items-center">
        <IonIcon name="videocam-outline" size={80} color="#e34077" />
        <Text className="text-white text-3xl font-bold mt-6 text-center">
          Analyze Your Throw
        </Text>
        <Text className="text-gray-400 text-base mt-3 text-center max-w-sm">
          Record a new video or select an existing one to analyze your frisbee throwing form
        </Text>
      </View>
      
      <View className="w-full max-w-md gap-4">
        <Button
          size="xl"
          onPress={handleRecordVideo}
          className="w-full bg-[#e34077] active:bg-[#c73566]"
        >
          <ButtonIcon as={IonIcon} name="videocam" size={24} />
          <ButtonText className="text-lg font-semibold ml-2">Record New Video</ButtonText>
        </Button>

        <Button
          size="xl"
          variant="outline"
          onPress={handleSelectVideo}
          className="w-full border-gray-600 active:border-gray-500"
        >
          <ButtonIcon as={IonIcon} name="folder-open-outline" size={24} />
          <ButtonText className="text-lg font-semibold ml-2">Select Existing Video</ButtonText>
        </Button>
      </View>

      <Text className="text-gray-500 text-sm mt-10 text-center max-w-sm">
        Videos should be under 60 seconds and clearly show your throwing motion
      </Text>
    </View>
  );
}
