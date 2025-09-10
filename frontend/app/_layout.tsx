import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useFrameworkReady } from '@/hooks/useFrameworkReady';

export default function Layout() {
  return (
    <Stack>
      {/* Define la pantalla de login como la inicial */}
      <Stack.Screen name="login" options={{ headerShown: false }} />
      <Stack.Screen name="(tabs)/index" options={{ headerShown: false }} />
    </Stack>
  );
}