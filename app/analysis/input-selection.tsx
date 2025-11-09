import { View, Text } from 'react-native';
import { useRouter } from 'expo-router';
import { Button, ButtonText } from '@/components/ui/button';

export default function InputSelectionScreen() {
  const router = useRouter();

  const handleRecordVideo = () => {
    // Navigate to camera screen for recording
    router.push('/');
  };

  const handleSelectVideo = async () => {
    // Will implement video picker in next task
    console.log('Select video from library');
  };

  return (
    <View className="flex-1 bg-black justify-center items-center px-6">
      <Text className="text-white text-2xl font-bold mb-8 text-center">
        Choose Video Input
      </Text>
      
      <View className="w-full max-w-md gap-4">
        <Button
          size="xl"
          onPress={handleRecordVideo}
          className="w-full"
        >
          <ButtonText>Record New Video</ButtonText>
        </Button>

        <Button
          size="xl"
          variant="outline"
          onPress={handleSelectVideo}
          className="w-full"
        >
          <ButtonText>Select Existing Video</ButtonText>
        </Button>
      </View>

      <Text className="text-gray-400 text-sm mt-8 text-center">
        Record or select a video of your throw for analysis
      </Text>
    </View>
  );
}
