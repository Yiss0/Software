import { Tabs } from 'expo-router';
import { History, Chrome as Home, MessageCircle, Pill, User, Users } from 'lucide-react-native';

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          height: 90,
          paddingBottom: 20,
          paddingTop: 10,
          backgroundColor: '#FFFFFF',
          borderTopWidth: 1,
          borderTopColor: '#E5E7EB',
        },
        tabBarLabelStyle: {
          fontSize: 14,
          fontWeight: '600',
          marginTop: 4,
        },
        tabBarActiveTintColor: '#2563EB',
        tabBarInactiveTintColor: '#6B7280',
      }}>
      <Tabs.Screen
        name="index"
        options={{
          title: 'Inicio',
          tabBarIcon: ({ size, color }) => (
            <Home size={28} color={color} strokeWidth={2} />
          ),
        }}
      />
      <Tabs.Screen
        name="medicamentos"
        options={{
          title: 'Medicamentos',
          tabBarIcon: ({ size, color }) => (
            <Pill size={28} color={color} strokeWidth={2} />
          ),
        }}
      />
      <Tabs.Screen
        name="familiares"
        options={{
          title: 'Familiares',
          tabBarIcon: ({ size, color }) => (
            <Users size={28} color={color} strokeWidth={2} />
          ),
        }}
      />
      <Tabs.Screen
        name="historial"
        options={{
          title: 'Historial',
          tabBarIcon: ({ size, color }) => (
            <History size={28} color={color} strokeWidth={2} />
          ),
        }}
      />
      <Tabs.Screen
        name="asistente"
        options={{
          title: 'Asistente',
          tabBarIcon: ({ size, color }) => (
            <MessageCircle size={28} color={color} strokeWidth={2} />
          ),
        }}
      />
      <Tabs.Screen
        name="perfil"
        options={{
          title: 'Perfil',
          tabBarIcon: ({ size, color }) => (
            <User size={28} color={color} strokeWidth={2} />
          ),
        }}
      />
    </Tabs>
  );
}