// frontend/app/(caregiver)/(tabs)/_layout.tsx

import { Tabs } from 'expo-router';
import { Users, UserCircle } from 'lucide-react-native';

export default function CaregiverTabsLayout() {
  return (
    <Tabs screenOptions={{
      tabBarActiveTintColor: '#2563EB',
      tabBarLabelStyle: { fontWeight: '600' }
    }}>
      <Tabs.Screen
        name="pacientes"
        options={{
          title: 'Pacientes',
          headerShown: false,
          tabBarIcon: ({ color }) => <Users size={24} color={color} />,
        }}
      />
      <Tabs.Screen
        name="perfil"
        options={{
          title: 'Mi Perfil',
          headerShown: false,
          tabBarIcon: ({ color }) => <UserCircle size={24} color={color} />,
        }}
      />
    </Tabs>
  );
}