// frontend/app/(tabs)/_layout.tsx (CORREGIDO)

import { Tabs } from 'expo-router';
import { Bot, History, Home, Pill, User, Users } from 'lucide-react-native';
import React from 'react';
import { useAuth } from '../../context/AuthContext';

export default function TabLayout() {
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
      
      {/* 1. Inicio */}
      <Tabs.Screen
        name="index"
        options={{
          title: 'Inicio',
          tabBarIcon: ({ color }) => <Home size={28} color={color} />,
        }}
      />
      
      {/* 2. Medicamentos (Solo Paciente) */}
      {!isCaregiver && (
        <Tabs.Screen
          name="medicamentos"
          options={{
            title: 'Medicamentos',
            tabBarIcon: ({ color }) => <Pill size={28} color={color} />,
          }}
        />
      )}

      {/* 3. Historial (OCULTO DE LA BARRA) */}
      <Tabs.Screen
        name="historial"
        options={{
          title: 'Historial',
          tabBarIcon: ({ color }) => <History size={28} color={color} />,
          // --- CAMBIO CLAVE ---
          // Esta línea oculta la pestaña de la barra, pero sigue existiendo
          href: null, 
        }}
      />
      
      {/* 4. Familiares (Solo Paciente) */}
      {!isCaregiver && (
        <Tabs.Screen
          name="familiares"
          options={{
            title: 'Familiares',
            tabBarIcon: ({ color }) => <Users size={28} color={color} />,
          }}
        />
      )}

      {/* 5. Asistente (Solo Paciente) */}
      {!isCaregiver && (
          <Tabs.Screen
            name="asistente"
            options={{
              title: 'Asistente',
              tabBarIcon: ({ color }) => <Bot size={28} color={color} />,
            }}
          />
      )}

      {/* 6. Perfil */}
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