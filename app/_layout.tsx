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