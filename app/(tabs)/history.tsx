import { View, Text, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { Button, ButtonText } from '@/components/ui/button';

export default function HistoryScreen() {
  const router = useRouter();

  const handleNewAnalysis = () => {
    router.push('/analysis/input-selection');
  };

  return (
    <View className="flex-1 bg-black">
      <ScrollView className="flex-1 px-6 py-8">
        <Text className="text-white text-2xl font-bold mb-6">
          Analysis History
        </Text>

        {/* Empty State */}
        <View className="flex-1 justify-center items-center py-16">
          <Text className="text-gray-400 text-center mb-6">
            No saved analyses yet
          </Text>
          <Button onPress={handleNewAnalysis}>
            <ButtonText>Start New Analysis</ButtonText>
          </Button>
        </View>

        {/* History list will be implemented in task 8.4 */}
      </ScrollView>
    </View>
  );
}
