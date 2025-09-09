import { Calendar, CircleCheck as CheckCircle, Clock, Filter, Circle as XCircle } from 'lucide-react-native';
import React, { useState } from 'react';
import {
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

interface HistorialItem {
  id: string;
  medicamento: string;
  dosis: string;
  horaPlaneada: string;
  horaTomada?: string;
  fecha: string;
  estado: 'tomado' | 'omitido' | 'pospuesto';
  notas?: string;
}

export default function HistorialScreen() {
  const [filtroActivo, setFiltroActivo] = useState<'todos' | 'tomados' | 'omitidos'>('todos');
  
  const [historial] = useState<HistorialItem[]>([
    {
      id: '1',
      medicamento: 'Aspirina',
      dosis: '100mg',
      horaPlaneada: '08:00',
      horaTomada: '08:05',
      fecha: '2025-01-20',
      estado: 'tomado'
    },
    {
      id: '2',
      medicamento: 'Metformina',
      dosis: '500mg',
      horaPlaneada: '14:30',
      horaTomada: '14:45',
      fecha: '2025-01-20',
      estado: 'tomado',
      notas: 'Tomado con la comida'
    },
    {
      id: '3',
      medicamento: 'Atorvastatina',
      dosis: '20mg',
      horaPlaneada: '20:00',
      fecha: '2025-01-19',
      estado: 'omitido',
      notas: 'Se olvidó tomar'
    },
    {
      id: '4',
      medicamento: 'Aspirina',
      dosis: '100mg',
      horaPlaneada: '08:00',
      horaTomada: '08:00',
      fecha: '2025-01-19',
      estado: 'tomado'
    },
    {
      id: '5',
      medicamento: 'Metformina',
      dosis: '500mg',
      horaPlaneada: '14:30',
      horaTomada: '15:00',
      fecha: '2025-01-19',
      estado: 'pospuesto',
      notas: 'Pospuesto 30 minutos'
    }
  ]);

  const historialFiltrado = historial.filter(item => {
    if (filtroActivo === 'todos') return true;
    if (filtroActivo === 'tomados') return item.estado === 'tomado' || item.estado === 'pospuesto';
    if (filtroActivo === 'omitidos') return item.estado === 'omitido';
    return true;
  });

  const getEstadoColor = (estado: string) => {
    switch (estado) {
      case 'tomado': return '#16A34A';
      case 'omitido': return '#DC2626';
      case 'pospuesto': return '#F59E0B';
      default: return '#6B7280';
    }
  };

  const getEstadoTexto = (estado: string) => {
    switch (estado) {
      case 'tomado': return 'Tomado';
      case 'omitido': return 'Omitido';
      case 'pospuesto': return 'Pospuesto';
      default: return estado;
    }
  };

  const getEstadoIcon = (estado: string) => {
    switch (estado) {
      case 'tomado': 
        return <CheckCircle size={24} color="#16A34A" strokeWidth={2} />;
      case 'omitido': 
        return <XCircle size={24} color="#DC2626" strokeWidth={2} />;
      case 'pospuesto': 
        return <Clock size={24} color="#F59E0B" strokeWidth={2} />;
      default: 
        return <CheckCircle size={24} color="#6B7280" strokeWidth={2} />;
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Historial</Text>
        <TouchableOpacity style={styles.filterButton}>
          <Filter size={24} color="#2563EB" strokeWidth={2} />
        </TouchableOpacity>
      </View>

      {/* Filtros */}
      <View style={styles.filterContainer}>
        <TouchableOpacity
          style={[
            styles.filterChip,
            filtroActivo === 'todos' && styles.filterChipActive
          ]}
          onPress={() => setFiltroActivo('todos')}
        >
          <Text style={[
            styles.filterChipText,
            filtroActivo === 'todos' && styles.filterChipTextActive
          ]}>
            Todos
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[
            styles.filterChip,
            filtroActivo === 'tomados' && styles.filterChipActive
          ]}
          onPress={() => setFiltroActivo('tomados')}
        >
          <Text style={[
            styles.filterChipText,
            filtroActivo === 'tomados' && styles.filterChipTextActive
          ]}>
            Tomados
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[
            styles.filterChip,
            filtroActivo === 'omitidos' && styles.filterChipActive
          ]}
          onPress={() => setFiltroActivo('omitidos')}
        >
          <Text style={[
            styles.filterChipText,
            filtroActivo === 'omitidos' && styles.filterChipTextActive
          ]}>
            Omitidos
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {historialFiltrado.map((item) => (
          <View key={item.id} style={styles.historialCard}>
            <View style={styles.historialHeader}>
              <View style={styles.dateContainer}>
                <Calendar size={20} color="#6B7280" strokeWidth={2} />
                <Text style={styles.dateText}>{item.fecha}</Text>
              </View>
              <View style={styles.statusContainer}>
                {getEstadoIcon(item.estado)}
                <Text style={[
                  styles.statusText,
                  { color: getEstadoColor(item.estado) }
                ]}>
                  {getEstadoTexto(item.estado)}
                </Text>
              </View>
            </View>

            <View style={styles.medicationInfo}>
              <Text style={styles.medicationName}>{item.medicamento}</Text>
              <Text style={styles.medicationDose}>{item.dosis}</Text>
              
              <View style={styles.timeInfo}>
                <View style={styles.timeItem}>
                  <Clock size={16} color="#6B7280" strokeWidth={2} />
                  <Text style={styles.timeLabel}>Planeado:</Text>
                  <Text style={styles.timeValue}>{item.horaPlaneada}</Text>
                </View>
                
                {item.horaTomada && (
                  <View style={styles.timeItem}>
                    <CheckCircle size={16} color="#16A34A" strokeWidth={2} />
                    <Text style={styles.timeLabel}>Tomado:</Text>
                    <Text style={styles.timeValue}>{item.horaTomada}</Text>
                  </View>
                )}
              </View>

              {item.notas && (
                <View style={styles.notesContainer}>
                  <Text style={styles.notesText}>📝 {item.notas}</Text>
                </View>
              )}
            </View>
          </View>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: '#1F2937',
  },
  filterButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 4,
  },
  filterContainer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    gap: 12,
    marginBottom: 20,
  },
  filterChip: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 25,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#D1D5DB',
  },
  filterChipActive: {
    backgroundColor: '#2563EB',
    borderColor: '#2563EB',
  },
  filterChipText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#6B7280',
  },
  filterChipTextActive: {
    color: '#FFFFFF',
  },
  scrollView: {
    flex: 1,
    paddingHorizontal: 20,
  },
  historialCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  historialHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  dateContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  dateText: {
    fontSize: 16,
    color: '#6B7280',
    fontWeight: '500',
  },
  statusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  statusText: {
    fontSize: 16,
    fontWeight: '600',
  },
  medicationInfo: {
    gap: 8,
  },
  medicationName: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1F2937',
  },
  medicationDose: {
    fontSize: 16,
    color: '#6B7280',
  },
  timeInfo: {
    gap: 8,
    marginTop: 8,
  },
  timeItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  timeLabel: {
    fontSize: 16,
    color: '#6B7280',
  },
  timeValue: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
  },
  notesContainer: {
    marginTop: 12,
    padding: 12,
    backgroundColor: '#F9FAFB',
    borderRadius: 8,
  },
  notesText: {
    fontSize: 16,
    color: '#6B7280',
    fontStyle: 'italic',
  },
});