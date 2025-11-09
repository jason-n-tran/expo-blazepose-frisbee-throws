import { Stack } from 'expo-router';

export default function AnalysisLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: true,
        headerBackTitle: 'Back',
        headerStyle: {
          backgroundColor: '#000',
        },
        headerTintColor: '#fff',
      }}
    >
      <Stack.Screen
        name="input-selection"
        options={{
          title: 'Analysis',
          headerShown: true,
        }}
      />
      <Stack.Screen
        name="processing"
        options={{
          title: 'Processing Video',
          headerShown: true,
          headerBackVisible: false,
        }}
      />
      <Stack.Screen
        name="results"
        options={{
          title: 'Analysis Results',
          headerShown: true,
        }}
      />
    </Stack>
  );
}
