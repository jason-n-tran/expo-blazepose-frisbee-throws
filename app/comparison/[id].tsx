import { View, Text } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Button, ButtonText } from '@/components/ui/button';

export default function ComparisonScreen() {
  const params = useLocalSearchParams<{ id: string }>();
  const router = useRouter();

  return (
    <View className="flex-1 bg-black">
      {/* Header */}
      <View className="px-4 py-3 border-b border-gray-800">
        <Text className="text-white text-lg font-semibold text-center">
          Side-by-Side Comparison
        </Text>
      </View>

      {/* Video Comparison Area */}
      <View className="flex-1 justify-center items-center px-6">
        <Text className="text-gray-400 text-center mb-4">
          Comparison viewer will display here
        </Text>
        <Text className="text-gray-500 text-sm text-center">
          Analysis ID: {params.id}
        </Text>
      </View>

      {/* Playback Controls Placeholder */}
      <View className="px-6 py-4 border-t border-gray-800">
        <Text className="text-gray-400 text-center text-sm">
          Synchronized playback controls will appear here
        </Text>
      </View>

      {/* Back Button */}
      <View className="px-6 pb-6">
        <Button
          variant="outline"
          onPress={() => router.back()}
          className="w-full"
        >
          <ButtonText>Back to Results</ButtonText>
        </Button>
      </View>
    </View>
  );
}
