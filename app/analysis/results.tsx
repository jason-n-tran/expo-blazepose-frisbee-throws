import { View, Text, ScrollView } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Button, ButtonText } from '@/components/ui/button';

export default function ResultsScreen() {
  const params = useLocalSearchParams<{ analysisId: string }>();
  const router = useRouter();

  const handleViewComparison = () => {
    router.push(`/comparison/${params.analysisId}`);
  };

  const handleSaveAnalysis = () => {
    // Will implement storage in task 5
    console.log('Save analysis');
  };

  const handleNewAnalysis = () => {
    router.push('/analysis/input-selection');
  };

  return (
    <ScrollView className="flex-1 bg-black">
      <View className="px-6 py-8">
        {/* Overall Score */}
        <View className="items-center mb-8">
          <Text className="text-gray-400 text-sm uppercase mb-2">
            Overall Score
          </Text>
          <Text className="text-white text-6xl font-bold">
            --
          </Text>
          <Text className="text-gray-400 text-sm mt-2">
            Analysis results will appear here
          </Text>
        </View>

        {/* Feedback Categories Placeholder */}
        <View className="mb-6">
          <Text className="text-white text-xl font-semibold mb-4">
            Feedback
          </Text>
          <Text className="text-gray-400 text-center py-8">
            Detailed feedback will be displayed here after analysis
          </Text>
        </View>

        {/* Action Buttons */}
        <View className="gap-3">
          <Button
            size="lg"
            onPress={handleViewComparison}
            className="w-full"
          >
            <ButtonText>View Comparison</ButtonText>
          </Button>

          <Button
            size="lg"
            variant="outline"
            onPress={handleSaveAnalysis}
            className="w-full"
          >
            <ButtonText>Save Analysis</ButtonText>
          </Button>

          <Button
            size="lg"
            variant="outline"
            onPress={handleNewAnalysis}
            className="w-full"
          >
            <ButtonText>New Analysis</ButtonText>
          </Button>
        </View>
      </View>
    </ScrollView>
  );
}
