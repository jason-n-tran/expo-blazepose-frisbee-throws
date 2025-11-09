import { StatusBar } from 'expo-status-bar';
import { GluestackUIProvider } from '@/components/ui/gluestack-ui-provider';
import { Stack } from 'expo-router';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import '@/global.css';

export default function App() {
  return (
      <GluestackUIProvider mode="dark">
        <GestureHandlerRootView>
          <StatusBar style="auto" />
          <Stack
            screenOptions={{
              headerBackTitle: 'Back'
            }}
          >
            <Stack.Screen name="(tabs)" options={{ headerShown: false }}/>
          </Stack>
        </GestureHandlerRootView>
      </GluestackUIProvider>
  );
}