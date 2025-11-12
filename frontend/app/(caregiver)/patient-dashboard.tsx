// app/(caregiver)/patient-dashboard.tsx (CORREGIDO EL ERROR DE TYPESCRIPT)

import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, ScrollView } from 'react-native';
import { Stack, useLocalSearchParams } from 'expo-router';
import { fetchPatientDashboard, PatientDashboard, IntakeLogWithMedication } from '../../services/apiService';
import { useAuth } from '../../context/AuthContext';
import { Pill, Clock, CheckCircle, XCircle, History } from 'lucide-react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

// --- Funciones de conversión de hora (sin cambios) ---
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
// ----------------------------------------------------

// --- Componente de Tarjeta de Historial (sin cambios) ---
const IntakeHistoryCard: React.FC<{ intake: IntakeLogWithMedication }> = ({ intake }) => {
  const getIntakeIcon = () => {
    switch (intake.action) {
      case 'TAKEN':
        return <CheckCircle size={24} color="#16A34A" />; // Verde
      case 'SKIPPED':
        return <XCircle size={24} color="#DC2626" />; // Rojo
      case 'POSTPONED':
        return <History size={24} color="#F59E0B" />; // Naranja
      default:
        return <Pill size={24} color="#6B7280" />;
    }
  };

  const getActionText = () => {
    switch (intake.action) {
      case 'TAKEN': return 'Tomada';
      case 'SKIPPED': return 'Omitida';
      case 'POSTPONED': return 'Pospuesta';
      default: return intake.action;
    }
  };

  return (
    <View style={styles.medItem}>
      <View style={styles.medIconContainer}>
        {getIntakeIcon()}
      </View>
      <View style={styles.medInfo}>
        <Text style={styles.medName}>{intake.medication.name}</Text>
        <Text style={styles.medDosage}>{getActionText()}</Text>
        <View style={styles.scheduleItem}>
          <Clock size={16} color="#6B7280" />
          <Text style={styles.scheduleText}>
            Registrado a las: {new Date(intake.actionAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </Text>
        </View>
      </View>
    </View>
  );
};
// --------------------------------------------------

const CaregiverPatientDashboardScreen = () => {
  const { patientId, patientName } = useLocalSearchParams<{ patientId: string; patientName: string }>();
  const { user } = useAuth(); 

  const [dashboardData, setDashboardData] = useState<PatientDashboard | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // ... (useEffect se mantiene igual) ...
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

  // ... (estados de carga, error y !dashboardData se mantienen iguales) ...
  if (isLoading) {
    return (
      <SafeAreaView style={styles.centered}>
        <ActivityIndicator size="large" color="#2563EB" />
        <Text style={styles.loadingText}>Cargando resumen de {patientName}...</Text>
      </SafeAreaView>
    );
  }

  if (error) {
    return (
      <SafeAreaView style={styles.centered}>
        <Text style={styles.errorText}>Error: {error}</Text>
      </SafeAreaView>
    );
  }

  if (!dashboardData) {
    return (
      <SafeAreaView style={styles.centered}>
        <Text style={styles.emptyText}>No hay datos disponibles.</Text>
      </SafeAreaView>
    );
  }


  return (
    <SafeAreaView style={styles.container} edges={['bottom', 'left', 'right']}>
      {/* --- CABECERA CORREGIDA --- */}
      <Stack.Screen 
        options={{ 
          title: `Resumen de ${patientName}`, 
          headerShown: true,
          headerStyle: { backgroundColor: '#F8FAFC' },
          headerShadowVisible: false,
          headerTitleStyle: {
            fontSize: 28,
            fontWeight: '700',
            color: '#1F2937',
          },
          // --- LÍNEA CON ERROR ELIMINADA ---
          // headerTitleContainerStyle: { ... } 
        }} 
      />

      <ScrollView contentContainerStyle={styles.scrollContainer}>
        
        {/* --- SECCIÓN DE MEDICAMENTOS MEJORADA --- */}
        <Text style={styles.sectionTitle}>Medicamentos Programados</Text>
        {dashboardData.patient.medications.length > 0 ? (
          dashboardData.patient.medications.map(med => (
            <View key={med.id} style={styles.medItem}>
              <View style={styles.medIconContainer}>
                <Pill size={24} color="#2563EB" />
              </View>
              <View style={styles.medInfo}>
                <Text style={styles.medName}>{med.name}</Text>
                <Text style={styles.medDosage}>{med.dosage}</Text>
                
                {med.schedules.map(s => 
                  <View key={s.id} style={styles.scheduleItem}>
                    <Clock size={16} color="#6B7280" />
                    <Text style={styles.scheduleText}>
                      A las {formatTimeToAMPM(convertUTCTimeToLocalString(s.time))}
                    </Text>
                  </View>
                )}
              </View>
            </View>
          ))
        ) : (
          <Text style={styles.emptyText}>No hay medicamentos programados.</Text>
        )}

        {/* --- SECCIÓN DE HISTORIAL MEJORADA --- */}
        <Text style={styles.sectionTitle}>Historial de Tomas de Hoy</Text>
        {dashboardData.todaysIntakes.length > 0 ? (
          dashboardData.todaysIntakes.map(intake => (
            <IntakeHistoryCard key={intake.id} intake={intake} />
          ))
        ) : (
          <Text style={styles.emptyText}>Aún no se han registrado tomas hoy.</Text>
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

// ... (Los estilos 'styles' se mantienen exactamente iguales) ...
const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    backgroundColor: '#F8FAFC' 
  },
  scrollContainer: {
    paddingHorizontal: 20,
    paddingBottom: 40,
  },
  centered: { 
    flex: 1, 
    justifyContent: 'center', 
    alignItems: 'center', 
    padding: 20, 
    backgroundColor: '#F8FAFC' 
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#6B7280'
  },
  sectionTitle: { 
    fontSize: 20, 
    fontWeight: '700', 
    color: '#1F2937', 
    marginTop: 16, 
    marginBottom: 12,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
    paddingTop: 24,
  },
  medItem: { 
    backgroundColor: '#FFFFFF', 
    padding: 16, 
    borderRadius: 12, 
    flexDirection: 'row', 
    alignItems: 'flex-start', 
    marginBottom: 12, 
    elevation: 2, 
    shadowColor: '#000', 
    shadowOffset: { width: 0, height: 1 }, 
    shadowOpacity: 0.1, 
    shadowRadius: 2, 
  },
  medIconContainer: { 
    padding: 12, 
    borderRadius: 8, 
    backgroundColor: '#EBF4FF', 
    marginRight: 16, 
  }, 
  medInfo: { 
    flex: 1 
  }, 
  medName: { 
    fontSize: 18, 
    fontWeight: '600', 
    color: '#1F2937' 
  }, 
  medDosage: { 
    fontSize: 14, 
    color: '#6B7280', 
    marginTop: 4 
  }, 
  scheduleItem: {
    flexDirection: 'row', 
    alignItems: 'center', 
    marginTop: 8, 
    backgroundColor: '#F3F4F6', 
    paddingVertical: 6, 
    paddingHorizontal: 10, 
    borderRadius: 8, 
    alignSelf: 'flex-start'
  },
  scheduleText: { 
    fontSize: 14, 
    color: '#4B5563', 
    fontWeight: '500',
    marginLeft: 6 
  },
  errorText: { 
    color: 'red', 
    fontSize: 16, 
    textAlign: 'center' 
  },
  emptyText: { 
    fontStyle: 'italic', 
    color: '#6B7280', 
    textAlign: 'center', 
    marginTop: 10,
    paddingVertical: 20,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
  },
});

export default CaregiverPatientDashboardScreen;