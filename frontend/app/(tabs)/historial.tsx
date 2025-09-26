import { Calendar, CircleCheck as CheckCircle, Clock, Filter, CircleX as XCircle } from 'lucide-react-native';
import React, { useState, useCallback } from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View, FlatList, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from 'expo-router';
import { useAuth } from '../../context/AuthContext';
import * as db from '../../services/database';

export default function HistorialScreen() {
  const [filtroActivo, setFiltroActivo] = useState<'todos' | 'tomados' | 'omitidos'>('todos');
  const [historial, setHistorial] = useState<db.IntakeLogWithName[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { database, session } = useAuth();

  useFocusEffect(
    useCallback(() => {
      const cargarHistorial = async () => {
        setIsLoading(true);
        if (database && session) {
          try {
            const logs = await db.getIntakeLogsForUser(database, parseInt(session, 10));
            setHistorial(logs);
          } catch (e) {
            console.error(e);
          }
        }
        setIsLoading(false);
      };
      cargarHistorial();
    }, [database, session])
  );

  const historialFiltrado = historial.filter(item => {
    if (filtroActivo === 'todos') return true;
    if (filtroActivo === 'tomados') return item.estado === 'TAKEN' || item.estado === 'POSTPONED';
    if (filtroActivo === 'omitidos') return item.estado === 'SKIPPED';
    return true;
  });
  
  const getEstadoColor = (estado: string) => {
    switch (estado) {
      case 'TAKEN': return '#16A34A';
      case 'SKIPPED': return '#DC2626';
      case 'POSTPONED': return '#F59E0B';
      default: return '#6B7280';
    }
  };

  const getEstadoTexto = (estado: string) => {
    switch (estado) {
      case 'TAKEN': return 'Tomado';
      case 'SKIPPED': return 'Omitido';
      case 'POSTPONED': return 'Pospuesto';
      default: return estado;
    }
  };

  const getEstadoIcon = (estado: string) => {
    switch (estado) {
      case 'TAKEN': return <CheckCircle size={24} color="#16A34A" />;
      case 'SKIPPED': return <XCircle size={24} color="#DC2626" />;
      case 'POSTPONED': return <Clock size={24} color="#F59E0B" />;
      default: return <CheckCircle size={24} color="#6B7280" />;
    }
  };

  const renderItem = ({ item }: { item: db.IntakeLogWithName }) => (
     <View style={styles.historialCard}>
        <View style={styles.historialHeader}>
          <View style={styles.dateContainer}>
            <Calendar size={20} color="#6B7280" />
            <Text style={styles.dateText}>{new Date(item.fecha).toLocaleDateString('es-ES', { year: 'numeric', month: '2-digit', day: '2-digit' })}</Text>
          </View>
          <View style={styles.statusContainer}>
            {getEstadoIcon(item.estado)}
            <Text style={[styles.statusText, { color: getEstadoColor(item.estado) }]}>
              {getEstadoTexto(item.estado)}
            </Text>
          </View>
        </View>
        <View style={styles.medicationInfo}>
          <Text style={styles.medicationName}>{item.medicamento}</Text>
          <Text style={styles.medicationDose}>{item.dosis}</Text>
          <View style={styles.timeInfo}>
            <View style={styles.timeItem}>
              <Clock size={16} color="#6B7280" />
              <Text style={styles.timeLabel}>Planeado:</Text>
              <Text style={styles.timeValue}>{new Date(item.horaPlaneada).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</Text>
            </View>
            {(item.estado === 'TAKEN' || item.estado === 'POSTPONED') && (
              <View style={styles.timeItem}>
                <CheckCircle size={16} color="#16A34A" />
                <Text style={styles.timeLabel}>Acción:</Text>
                <Text style={styles.timeValue}>{new Date(item.horaTomada).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</Text>
              </View>
            )}
          </View>
        </View>
      </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Historial</Text>
        <TouchableOpacity style={styles.filterButton}>
          <Filter size={24} color="#2563EB" />
        </TouchableOpacity>
      </View>
      <View style={styles.filterContainer}>
        <TouchableOpacity style={[styles.filterChip, filtroActivo === 'todos' && styles.filterChipActive]} onPress={() => setFiltroActivo('todos')}>
          <Text style={[styles.filterChipText, filtroActivo === 'todos' && styles.filterChipTextActive]}>Todos</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.filterChip, filtroActivo === 'tomados' && styles.filterChipActive]} onPress={() => setFiltroActivo('tomados')}>
          <Text style={[styles.filterChipText, filtroActivo === 'tomados' && styles.filterChipTextActive]}>Tomados</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.filterChip, filtroActivo === 'omitidos' && styles.filterChipActive]} onPress={() => setFiltroActivo('omitidos')}>
          <Text style={[styles.filterChipText, filtroActivo === 'omitidos' && styles.filterChipTextActive]}>Omitidos</Text>
        </TouchableOpacity>
      </View>
      {isLoading ? (
        <ActivityIndicator size="large" color="#2563EB" style={{ flex: 1 }}/>
      ) : (
        <FlatList
          data={historialFiltrado}
          renderItem={renderItem}
          keyExtractor={(item) => item.id.toString()}
          style={styles.scrollView}
          ListEmptyComponent={<View style={styles.emptyContainer}><Text style={styles.emptyText}>Aún no hay registros en tu historial.</Text></View>}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAFC', },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 20, },
  title: { fontSize: 28, fontWeight: '700', color: '#1F2937', },
  filterButton: { width: 48, height: 48, borderRadius: 24, backgroundColor: '#FFFFFF', alignItems: 'center', justifyContent: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4, elevation: 4, },
  filterContainer: { flexDirection: 'row', paddingHorizontal: 20, gap: 12, marginBottom: 20, },
  filterChip: { paddingHorizontal: 20, paddingVertical: 12, borderRadius: 25, backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: '#D1D5DB', },
  filterChipActive: { backgroundColor: '#2563EB', borderColor: '#2563EB', },
  filterChipText: { fontSize: 16, fontWeight: '600', color: '#6B7280', },
  filterChipTextActive: { color: '#FFFFFF', },
  scrollView: { flex: 1, paddingHorizontal: 20, },
  historialCard: { backgroundColor: '#FFFFFF', borderRadius: 16, padding: 20, marginBottom: 16, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 8, elevation: 4, },
  historialHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16, },
  dateContainer: { flexDirection: 'row', alignItems: 'center', gap: 8, },
  dateText: { fontSize: 16, color: '#6B7280', fontWeight: '500', },
  statusContainer: { flexDirection: 'row', alignItems: 'center', gap: 8, },
  statusText: { fontSize: 16, fontWeight: '600', },
  medicationInfo: { gap: 8, },
  medicationName: { fontSize: 20, fontWeight: '700', color: '#1F2937', },
  medicationDose: { fontSize: 16, color: '#6B7280', },
  timeInfo: { gap: 8, marginTop: 8, },
  timeItem: { flexDirection: 'row', alignItems: 'center', gap: 8, },
  timeLabel: { fontSize: 16, color: '#6B7280', },
  timeValue: { fontSize: 16, fontWeight: '600', color: '#374151', },
  emptyContainer: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingTop: '40%' },
  emptyText: { textAlign: 'center', fontSize: 16, color: '#6B7280' },
});