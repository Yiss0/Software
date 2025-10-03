// frontend/app/(tabs)/medicamentos.tsx

import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Alert, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Link, useFocusEffect } from 'expo-router';
import { Plus, Pill, Clock, Pencil, Trash2 } from 'lucide-react-native';
import { useAuth } from '../../context/AuthContext';
// --- 1. CAMBIO EN LAS IMPORTACIONES ---
// Cambiamos 'db' por nuestro servicio de API
import * as apiService from '../../services/apiService';

// El tipo ahora viene de nuestro servicio de API
type MedicationListItem = apiService.MedicationWithSchedules;

// ... (Las funciones 'formatTimeToAMPM' y 'getFrequencyText' no cambian)
const formatTimeToAMPM = (time: string) => {
  // La hora del horario (ej: "22:00") no tiene zona horaria, la mostramos tal cual.
  if (!/^\d{2}:\d{2}$/.test(time)) return time;
  const [hours, minutes] = time.split(':');
  const h = parseInt(hours, 10);
  const suffix = h >= 12 ? 'p. m.' : 'a. m.';
  const formattedHour = h % 12 === 0 ? 12 : h % 12;
  return `${String(formattedHour).padStart(2, '0')}:${minutes} ${suffix}`;
};
const getFrequencyText = (schedule: apiService.Schedule): string => {
  const formattedTime = formatTimeToAMPM(schedule.time);
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
            {item.schedules.map(schedule => (
                <View key={schedule.id} style={styles.schedulesContainer}>
                    <Clock size={16} color="#6B7280" style={{ marginRight: 5 }} />
                    <Text style={styles.scheduleText}>{getFrequencyText(schedule)}</Text>
                </View>
            ))}
          </View>
        </View>
        <View style={styles.actionButtons}>
            {/* El ID del item ahora es un string, lo cual es compatible con los params */}
            <Link href={{ pathname: "/edit-medication", params: { medId: item.id } }} asChild>
                <TouchableOpacity style={styles.editButton}><Pencil size={20} color="#3B82F6" /></TouchableOpacity>
            </Link>
            <TouchableOpacity style={styles.deleteButton} onPress={onDelete}><Trash2 size={20} color="#EF4444" /></TouchableOpacity>
        </View>
      </View>
    );
});

export default function MedicamentosScreen() {
  const [medicamentos, setMedicamentos] = useState<MedicationListItem[]>([]);
  // --- 2. AÑADIMOS ESTADO DE CARGA ---
  const [isLoading, setIsLoading] = useState(true);
  // Quitamos 'database', ya no se necesita aquí
  const { session } = useAuth();

  // --- 3. MODIFICAMOS LA FUNCIÓN DE CARGA ---
  const cargarMedicamentos = useCallback(async () => {
    if (!session) return;
    setIsLoading(true);
    try {
      // Paso 1: Obtener los medicamentos base
      const baseMeds = await apiService.fetchMedicationsByPatient(session);
      
      // Paso 2: Para cada medicamento, obtener sus horarios en paralelo
      const medsWithSchedules = await Promise.all(
        baseMeds.map(async (med) => {
          const schedules = await apiService.fetchSchedulesForMedication(med.id);
          return { ...med, schedules }; // Combinamos el medicamento con sus horarios
        })
      );
      setMedicamentos(medsWithSchedules);
    } catch (error) {
      console.error("Error al cargar medicamentos desde la API:", error);
      Alert.alert("Error", "No se pudieron obtener los medicamentos del servidor.");
    } finally {
      setIsLoading(false);
    }
  }, [session]);

  useFocusEffect(
    useCallback(() => {
      cargarMedicamentos();
    }, [cargarMedicamentos])
  );

  // --- 4. MODIFICAMOS LA FUNCIÓN DE BORRADO ---
  const handleDelete = async (med: MedicationListItem) => {
    Alert.alert( "Eliminar Medicamento", `¿Estás seguro de que quieres eliminar "${med.name}"?`,
        [
            { text: "Cancelar", style: "cancel" },
            { text: "Sí, Eliminar", style: "destructive", onPress: async () => {
                const success = await apiService.deleteMedication(med.id);
                if (success) {
                    // La lógica de notificaciones se quita de aquí
                    await cargarMedicamentos(); // Recargamos la lista desde el servidor
                    Alert.alert("Éxito", "Medicamento eliminado.");
                } else {
                    Alert.alert("Error", "No se pudo eliminar el medicamento del servidor.");
                }
            }}
        ]
    );
  };

  // --- 5. RENDERIZADO CONDICIONAL CON CARGA ---
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
        keyExtractor={(item) => item.id} // El ID ahora es un string
        contentContainerStyle={styles.listContainer}
        ListEmptyComponent={() => ( <View style={styles.emptyContainer}><Text style={styles.emptyText}>No tienes medicamentos registrados.</Text><Text style={styles.emptySubText}>Presiona el botón '+' para añadir el primero.</Text></View> )}
      />
      <Link href="/add-medication" asChild>
        <TouchableOpacity style={styles.fab}><Plus size={32} color="#FFFFFF" /></TouchableOpacity>
      </Link>
    </SafeAreaView>
  );
}

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