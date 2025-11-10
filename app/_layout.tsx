import { StatusBar } from 'expo-status-bar';
import { GluestackUIProvider } from '@/components/ui/gluestack-ui-provider';
import { Stack } from 'expo-router';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { useTensorFlow } from '@/hooks/useTensorFlow';
import { View, Text, ActivityIndicator } from 'react-native';
import '@/utils/ImageDataPolyfill'; // Polyfill for React Native
import '@/global.css';

export default function App() {
  const { isReady, error } = useTensorFlow();

  if (error) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#000' }}>
        <Text style={{ color: '#fff', fontSize: 16, textAlign: 'center', padding: 20 }}>
          Failed to initialize TensorFlow: {error.message}
        </Text>
      </View>
    );
  }

  if (!isReady) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#000' }}>
        <ActivityIndicator size="large" color="#fff" />
        <Text style={{ color: '#fff', marginTop: 16 }}>Initializing TensorFlow...</Text>
      </View>
    );
  }

  return (
      <GluestackUIProvider mode="dark">
        <GestureHandlerRootView>
          <StatusBar style="auto" />
          <Stack
            screenOptions={{
              headerBackTitle: 'Back'
            }}
            initialRouteName="analysis"
          >
            <Stack.Screen name="analysis" options={{ headerShown: false }}/>
            <Stack.Screen name="(tabs)" options={{ headerShown: false }}/>
            <Stack.Screen name="MediaViewer" options={{ headerShown: false }}/>
          </Stack>
        </GestureHandlerRootView>
      </GluestackUIProvider>
  );
}