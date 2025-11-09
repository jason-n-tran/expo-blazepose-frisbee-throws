import React from 'react';
import { View, Text } from 'react-native';
import { useLocalSearchParams } from 'expo-router';

export default function ResultsScreen() {
  const params = useLocalSearchParams();

  return (
    <View className="flex-1 bg-black justify-center items-center px-6">
      <Text className="text-white text-2xl font-bold mb-4">
        Analysis Results
      </Text>
      <Text className="text-gray-400 text-base text-center">
        Results will be displayed here
      </Text>
    </View>
  );
}
