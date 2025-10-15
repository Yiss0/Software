import { Tabs } from 'expo-router';
import { Bot, History, Home, Pill, User, Users } from 'lucide-react-native'; // Cambié MessageCircle por Bot
import React from 'react';
import { useAuth } from '../../context/AuthContext';

export default function TabLayout() {
  // En tu AuthContext, asegúrate de que el rol se guarde como 'PATIENT' o 'CAREGIVER'
  const { user } = useAuth(); 
  const isCaregiver = user?.role === 'CAREGIVER';

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: '#2563EB',
        tabBarInactiveTintColor: '#6B7280',
        tabBarStyle: {
          height: 90,
          paddingBottom: 20,
          paddingTop: 10,
        },
        tabBarLabelStyle: {
          fontSize: 14,
          fontWeight: '600',
        },
      }}>
      
      {/* Pestañas Comunes para ambos roles */}
      <Tabs.Screen
        name="index"
        options={{
          title: 'Inicio',
          tabBarIcon: ({ color }) => <Home size={28} color={color} />,
        }}
      />
      
      {/* Pestañas Exclusivas para Pacientes */}
      {!isCaregiver && (
        <>
          <Tabs.Screen
            name="medicamentos"
            options={{
              title: 'Medicamentos',
              tabBarIcon: ({ color }) => <Pill size={28} color={color} />,
            }}
          />
          <Tabs.Screen
            name="familiares"
            options={{
              title: 'Familiares',
              tabBarIcon: ({ color }) => <Users size={28} color={color} />,
            }}
          />
          <Tabs.Screen
            name="asistente" // Esta ya está aquí y es correcta
            options={{
              title: 'Asistente',
              tabBarIcon: ({ color }) => <Bot size={28} color={color} />,
            }}
          />
        </>
      )}

      {/* Pestañas Comunes para ambos roles */}
      <Tabs.Screen
        name="historial"
        options={{
          title: 'Historial',
          tabBarIcon: ({ color }) => <History size={28} color={color} />,
        }}
      />
      <Tabs.Screen
        name="perfil"
        options={{
          title: 'Perfil',
          tabBarIcon: ({ color }) => <User size={28} color={color} />,
        }}
      />
    </Tabs>
  );
}