// frontend/app/_layout.tsx (VERSIÓN SIMPLIFICADA Y FINAL)

import { Stack, router, useSegments } from 'expo-router';
import { AuthProvider, useAuth } from '../context/AuthContext';
import { PatientProvider } from '../context/PatientContext';
import { useEffect } from 'react';
import { ActivityIndicator, View } from 'react-native';

function RootLayoutNav() {
  const { user, isLoading } = useAuth();
  const segments = useSegments();

  useEffect(() => {
    if (isLoading) {
      return; // No hacemos nada hasta que termine de cargar la sesión.
    }

    const inAuthGroup = segments[0] === '(auth)';

    // Esta es la ÚNICA regla que necesitamos aquí:
    // Si el usuario NO está logueado y NO está en una pantalla de autenticación,
    // lo enviamos al grupo de autenticación.
    if (!user && !inAuthGroup) {
      router.replace('/(auth)');
    }
    
  }, [user, isLoading, segments]);
  
  if (isLoading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color="#0000ff" />
      </View>
    );
  }

  // Asegúrate de que todos tus grupos de rutas estén definidos aquí.
  return (
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="(auth)" />
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="(caregiver)" />
        <Stack.Screen name="historial-paciente" />
      </Stack>
  );
}

export default function RootLayout() {
  return (
    <AuthProvider>
      <PatientProvider>
        <RootLayoutNav />
      </PatientProvider>
    </AuthProvider>
  );
}