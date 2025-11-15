// frontend/app/tabs/medicamentos.tsx (CORREGIDO CON LÓGICA UTC)

import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Alert, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Link, useFocusEffect } from 'expo-router';
import { Plus, Pill, Clock, Pencil, Trash2 } from 'lucide-react-native';
import { useAuth } from '../../context/AuthContext';
import { usePatient } from '../../context/PatientContext';
import * as apiService from '../../services/apiService';

type MedicationListItem = apiService.MedicationWithSchedules;

// --- FUNCIÓN AÑADIDA ---
// Convierte un string de hora UTC (ej: "02:30") a hora local (ej: "23:30")
const convertUTCTimeToLocalString = (utcTime: string): string => {
  if (!/^\d{2}:\d{2}$/.test(utcTime)) return utcTime;
  const [hours, minutes] = utcTime.split(':').map(Number);
  const date = new Date();
  date.setUTCHours(hours, minutes, 0, 0); // Establece la hora como UTC
  
  const localHours = String(date.getHours()).padStart(2, '0'); // Obtiene la hora local
  const localMinutes = String(date.getMinutes()).padStart(2, '0');
  
  return `${localHours}:${localMinutes}`;
};
// -------------------------

const formatTimeToAMPM = (time: string) => {
    if (!/^\d{2}:\d{2}$/.test(time)) return time;
    const [hours, minutes] = time.split(':');
    const h = parseInt(hours, 10);
    const suffix = h >= 12 ? 'p. m.' : 'a. m.';
    const formattedHour = h % 12 === 0 ? 12 : h % 12;
    return `${String(formattedHour).padStart(2, '0')}:${minutes} ${suffix}`;
};

const getFrequencyText = (schedule: apiService.Schedule): string => {
  // --- ¡CORRECCIÓN IMPORTANTE! ---
  // schedule.time es UTC ("02:30"), lo convertimos a local ("23:30")
  const localTime = convertUTCTimeToLocalString(schedule.time); 
  // -------------------------------
  const formattedTime = formatTimeToAMPM(localTime); // Formatea "23:30" a "11:30 p. m."
  
  switch (schedule.frequencyType) {
      case 'DAILY': return `Cada día a las ${formattedTime}`;
      case 'HOURLY': return `Cada ${schedule.frequencyValue} horas (desde ${formattedTime})`;
      case 'WEEKLY': const dayNames = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb']; const days = schedule.daysOfWeek?.split(',').map(d => dayNames[parseInt(d, 10)]).join(', ') || ''; return `Semanal (${days}) a las ${formattedTime}`;
      default: return `Horario a las ${formattedTime}`;
  }
};

const MedicationItem = React.memo(({ item, onDelete }: { item: MedicationListItem; onDelete: () => void; }) => {
    return (
      <View style={styles.medItem}>
        <View style={styles.medInfoContainer}>
          <View style={styles.medIconContainer}><Pill size={24} color="#2563EB" /></View>
          <View style={styles.medInfo}>
            <Text style={styles.medName}>{item.name}</Text>
            <Text style={styles.medDosage}>{item.dosage} - Quedan: {item.quantity}</Text>
            {item.instructions ? <Text style={styles.medInstructions}>Instrucciones: {item.instructions}</Text> : null}
            {item.schedules.map((schedule: apiService.Schedule) => (
                <View key={schedule.id} style={styles.schedulesContainer}>
                    <Clock size={16} color="#6B7280" style={{ marginRight: 5 }} />
                    <Text style={styles.scheduleText}>{getFrequencyText(schedule)}</Text>
                </View>
            ))}
          </View>
        </View>
        <View style={styles.actionButtons}>
      <Link href={`/edit-medication?medId=${item.id}`} asChild>
        <TouchableOpacity style={styles.editButton}><Pencil size={20} color="#3B82F6" /></TouchableOpacity>
      </Link>
            <TouchableOpacity style={styles.deleteButton} onPress={onDelete}><Trash2 size={20} color="#EF4444" /></TouchableOpacity>
        </View>
      </View>
    );
});

export default function MedicamentosScreen() {
  const [medicamentos, setMedicamentos] = useState<MedicationListItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { user } = useAuth();
  const { selectedPatient } = usePatient();

  const cargarMedicamentos = useCallback(async () => {
    const patientIdToShow = user?.role === 'CAREGIVER' ? selectedPatient?.id : user?.id;

    if (!patientIdToShow) {
        setIsLoading(false);
        return;
    }

    setIsLoading(true);
    try {
      const baseMeds = await apiService.fetchMedicationsByPatient(patientIdToShow);
      
      const medsWithSchedules = await Promise.all(
        baseMeds.map(async (med) => {
          const schedules = await apiService.fetchSchedulesForMedication(med.id);
          return { ...med, schedules };
        })
      );
      setMedicamentos(medsWithSchedules);
    } catch (error) {
      console.error("Error al cargar medicamentos desde la API:", error);
      Alert.alert("Error", "No se pudieron obtener los medicamentos del servidor.");
    } finally {
      setIsLoading(false);
    }
  }, [user, selectedPatient]);

  useFocusEffect(
    useCallback(() => {
      cargarMedicamentos();
    }, [cargarMedicamentos])
  );

  const handleDelete = async (med: MedicationListItem) => {
    Alert.alert( "Eliminar Medicamento", `¿Estás seguro de que quieres eliminar "${med.name}"?`,
        [
            { text: "Cancelar", style: "cancel" },
            { text: "Sí, Eliminar", style: "destructive", onPress: async () => {
                const success = await apiService.deleteMedication(med.id);
                if (success) {
                    await cargarMedicamentos();
                    Alert.alert("Éxito", "Medicamento eliminado.");
                } else {
                    Alert.alert("Error", "No se pudo eliminar el medicamento del servidor.");
                }
            }}
        ]
    );
  };

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}><Text style={styles.title}>Mis Medicamentos</Text></View>
        <ActivityIndicator size="large" color="#2563EB" style={{ flex: 1 }} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}><Text style={styles.title}>Mis Medicamentos</Text></View>
      <FlatList
        data={medicamentos}
        renderItem={({ item }) => <MedicationItem item={item} onDelete={() => handleDelete(item)} />}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContainer}
        ListEmptyComponent={() => ( <View style={styles.emptyContainer}><Text style={styles.emptyText}>No tienes medicamentos registrados.</Text><Text style={styles.emptySubText}>Presiona el botón '+' para añadir el primero.</Text></View> )}
      />
      <Link href="/add-medication" asChild>
        <TouchableOpacity style={styles.fab}><Plus size={32} color="#FFFFFF" /></TouchableOpacity>
      </Link>
    </SafeAreaView>
  );
}

// ... (Los estilos permanecen exactamente iguales) ...
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAFC' }, 
  header: { paddingHorizontal: 20, paddingVertical: 20 }, 
  title: { fontSize: 28, fontWeight: '700', color: '#1F2937' }, 
  listContainer: { paddingHorizontal: 20, paddingBottom: 100 }, 
  emptyContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', marginTop: '50%' }, 
  emptyText: { fontSize: 18, fontWeight: '600', color: '#6B7280' }, 
  emptySubText: { fontSize: 16, color: '#9CA3AF', marginTop: 8 }, 
  fab: { position: 'absolute', bottom: 30, right: 30, width: 64, height: 64, borderRadius: 32, backgroundColor: '#2563EB', justifyContent: 'center', alignItems: 'center', elevation: 8, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 4, }, 
  medItem: { backgroundColor: '#FFFFFF', padding: 16, borderRadius: 12, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12, elevation: 2, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.1, shadowRadius: 2, },
  medInfoContainer: { flex: 1, flexDirection: 'row', alignItems: 'flex-start' },
  medIconContainer: { padding: 12, borderRadius: 8, backgroundColor: '#EBF4FF', marginRight: 16, }, 
  medInfo: { flex: 1 }, 
  medName: { fontSize: 18, fontWeight: '600', color: '#1F2937' }, 
  medDosage: { fontSize: 14, color: '#6B7280', marginTop: 4 }, 
  medInstructions: { fontSize: 14, color: '#6B7280', marginTop: 8, fontStyle: 'italic' }, 
  schedulesContainer: { flexDirection: 'row', alignItems: 'center', marginTop: 8, backgroundColor: '#F3F4F6', paddingVertical: 6, paddingHorizontal: 10, borderRadius: 8, alignSelf: 'flex-start' }, 
  scheduleText: { fontSize: 14, color: '#4B5563', fontWeight: '500' },
  actionButtons: { flexDirection: 'column', gap: 12, marginLeft: 16 },
  editButton: { padding: 10, backgroundColor: '#EBF4FF', borderRadius: 20 },
  deleteButton: { padding: 10, backgroundColor: '#FEE2E2', borderRadius: 20 },
});