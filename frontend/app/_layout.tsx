import { Stack, router } from 'expo-router';
import { AuthProvider, useAuth } from '../context/AuthContext';
import { useEffect } from 'react';
import { ActivityIndicator, View } from 'react-native';

function RootLayoutNav() {
  const { session, isLoading } = useAuth();

  useEffect(() => {
    if (isLoading) return; // Wait until the session is loaded

    if (session) {
      // If the user is logged in, go to the main app tabs
      router.replace('/(tabs)');
    } else {
      // If the user is not logged in, show the user type selection screen
      router.replace('/(auth)');
    }
  }, [session, isLoading]);
  
  // Display a loading indicator while checking for an active session
  if (isLoading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color="#0000ff" />
      </View>
    );
  }

  // This Stack navigator defines all the possible navigation roots
  return (
    <Stack>
      <Stack.Screen name="(auth)" options={{ headerShown: false }} />
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      <Stack.Screen name="add-medication" options={{ headerShown: false }} />
      <Stack.Screen name="edit-medication" options={{ headerShown: false }} />
      <Stack.Screen name="modal" options={{ headerShown: false }} />
      <Stack.Screen name="sync" options={{ headerShown: false }} />
    </Stack>
  );
}

export default function RootLayout() {
  return (
    <AuthProvider>
      <RootLayoutNav />
    </AuthProvider>
  );
}