import React from 'react';
import { View, Text, ActivityIndicator } from 'react-native';
import { useLocalSearchParams } from 'expo-router';

export default function ProcessingScreen() {
  const params = useLocalSearchParams<{ videoUri: string }>();
  const videoUri = params.videoUri;

  return (
    <View className="flex-1 bg-black justify-center items-center px-6">
      <ActivityIndicator size="large" color="#e34077" />
      <Text className="text-white text-xl font-semibold mt-6">
        Processing Video
      </Text>
      <Text className="text-gray-400 text-sm mt-3 text-center">
        Analyzing your throwing form...
      </Text>
      {videoUri && (
        <Text className="text-gray-600 text-xs mt-6 text-center">
          Video: {videoUri}
        </Text>
      )}
    </View>
  );
}
