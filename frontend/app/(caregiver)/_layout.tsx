// frontend/app/(caregiver)/_layout.tsx

import { Stack } from 'expo-router';

export default function CaregiverLayout() {
  // Este Stack es para las pantallas DENTRO del grupo (caregiver)
  // Aquí definimos el layout de pestañas como la pantalla principal de este grupo.
  return (
    <Stack>
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
    </Stack>
  );
}