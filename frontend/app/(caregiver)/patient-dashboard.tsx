// app/(caregiver)/patient-dashboard.tsx

import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, ScrollView } from 'react-native';
import { Stack, useLocalSearchParams } from 'expo-router';
import { fetchPatientDashboard, PatientDashboard } from '../../services/apiService';
import { useAuth } from '../../context/AuthContext';

// --- AÑADIMOS LAS FUNCIONES DE CONVERSIÓN ---
// Las copiamos de 'add-medication.tsx'
const convertUTCTimeToLocalString = (utcTime: string): string => {
  if (!/^\d{2}:\d{2}$/.test(utcTime)) return utcTime;
  const [hours, minutes] = utcTime.split(':').map(Number);
  const date = new Date();
  date.setUTCHours(hours, minutes, 0, 0);
  const localHours = String(date.getHours()).padStart(2, '0');
  const localMinutes = String(date.getMinutes()).padStart(2, '0');
  return `${localHours}:${localMinutes}`;
};

const formatTimeToAMPM = (time: string) => {
  if (!/^\d{2}:\d{2}$/.test(time)) return time;
  const [hoursStr, minutes] = time.split(':');
  const hours = parseInt(hoursStr, 10);
  const suffix = hours >= 12 ? 'p. m.' : 'a. m.';
  const formattedHour = hours % 12 === 0 ? 12 : hours % 12;
  return `${String(formattedHour).padStart(2, '0')}:${minutes} ${suffix}`;
};
// --- FIN DE LAS FUNCIONES AÑADIDAS ---

const CaregiverPatientDashboardScreen = () => {
  const { patientId, patientName } = useLocalSearchParams<{ patientId: string; patientName: string }>();
  const { user } = useAuth(); 

  const [dashboardData, setDashboardData] = useState<PatientDashboard | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadDashboard = async () => {
      if (!user?.id || !patientId) {
        setError('Falta información para cargar los datos.');
        setIsLoading(false);
        return;
      }

      try {
        setIsLoading(true);
        const data = await fetchPatientDashboard(user.id, patientId);
        setDashboardData(data);
        setError(null);
      } catch (err: any) {
        setError(err.message || 'No se pudieron cargar los datos.');
      } finally {
        setIsLoading(false);
      }
    };

    loadDashboard();
  }, [patientId, user]);

  if (isLoading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#007AFF" />
        <Text>Cargando resumen de {patientName}...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.centered}>
        <Text style={styles.errorText}>Error: {error}</Text>
      </View>
    );
  }

  if (!dashboardData) {
    return (
      <View style={styles.centered}>
        <Text>No hay datos disponibles.</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <Stack.Screen options={{ title: `Resumen de ${patientName}`, headerShown: true }} />

      {/* Sección de Medicamentos del Día */}
      <Text style={styles.sectionTitle}>Medicamentos Programados</Text>
      {dashboardData.patient.medications.length > 0 ? (
        dashboardData.patient.medications.map(med => (
          <View key={med.id} style={styles.card}>
            <Text style={styles.medName}>{med.name} {med.dosage}</Text>
            
            {/* --- LÍNEA MODIFICADA --- */}
            {/* Aplicamos la conversión y el formato a s.time */}
            {med.schedules.map(s => 
              <Text key={s.id} style={styles.scheduleTime}>
                - A las {formatTimeToAMPM(convertUTCTimeToLocalString(s.time))}
              </Text>
            )}
            {/* --- FIN DE LA MODIFICACIÓN --- */}

          </View>
        ))
      ) : (
        <Text style={styles.emptyText}>No hay medicamentos programados.</Text>
      )}

      {/* Sección de Tomas del Día */}
      <Text style={styles.sectionTitle}>Historial de Tomas de Hoy</Text>
      {dashboardData.todaysIntakes.length > 0 ? (
        dashboardData.todaysIntakes.map(intake => (
          <View key={intake.id} style={styles.card}>
            <Text style={styles.medName}>
              {intake.medication.name} - {intake.action}
            </Text>
            <Text>
              Registrado a las: {new Date(intake.actionAt).toLocaleTimeString()}
            </Text>
          </View>
        ))
      ) : (
        <Text style={styles.emptyText}>Aún no se han registrado tomas hoy.</Text>
      )}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 },
  container: { flex: 1, padding: 16, backgroundColor: '#f5f5f5' },
  sectionTitle: { fontSize: 20, fontWeight: '600', marginTop: 20, marginBottom: 10, borderBottomWidth: 1, borderBottomColor: '#ddd', paddingBottom: 5 },
  card: { backgroundColor: 'white', padding: 15, borderRadius: 8, marginBottom: 10, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.2, shadowRadius: 1.41, elevation: 2 },
  medName: { fontSize: 16, fontWeight: 'bold', marginBottom: 5 },
  scheduleTime: { fontSize: 15, color: '#333' }, // Estilo para la hora
  errorText: { color: 'red', fontSize: 16, textAlign: 'center' },
  emptyText: { fontStyle: 'italic', color: '#666', textAlign: 'center', marginTop: 10 },
});

export default CaregiverPatientDashboardScreen;