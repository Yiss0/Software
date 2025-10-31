// frontend/app/(caregiver)/_layout.tsx

import { Stack } from 'expo-router';

export default function CaregiverLayout() {
  return (
    <Stack>
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      {/* AÑADIMOS ESTA LÍNEA */}
      <Stack.Screen 
        name="patient-dashboard" 
        options={{ 
          title: 'Resumen del Paciente',
          headerBackTitle: 'Atrás' // Título del botón para volver en iOS
        }} 
      />
    </Stack>
  );
}