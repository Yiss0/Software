import { Bell, CircleCheck as CheckCircle, Clock, MessageCircle, Pill, Plus, Circle as XCircle } from 'lucide-react-native';
import React, { useState } from 'react';
import {
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

interface Medicamento {
  id: string;
  nombre: string;
  dosis: string;
  hora: string;
  tomado: boolean;
  tipo: 'urgente' | 'normal';
}

export default function HomeScreen() {
  const [medicamentosHoy] = useState<Medicamento[]>([
    {
      id: '1',
      nombre: 'Aspirina',
      dosis: '100mg',
      hora: '08:00',
      tomado: true,
      tipo: 'normal'
    },
    {
      id: '2',
      nombre: 'Metformina',
      dosis: '500mg',
      hora: '14:30',
      tomado: false,
      tipo: 'urgente'
    },
    {
      id: '3',
      nombre: 'Atorvastatina',
      dosis: '20mg',
      hora: '20:00',
      tomado: false,
      tipo: 'normal'
    }
  ]);

  const confirmarToma = (id: string) => {
    Alert.alert(
      'Confirmar toma',
      '¿Ha tomado este medicamento?',
      [
        { text: 'No', style: 'cancel' },
        { text: 'Sí', onPress: () => console.log('Medicamento confirmado') }
      ]
    );
  };

  const posponerToma = (id: string) => {
    Alert.alert(
      'Posponer medicamento',
      '¿Por cuánto tiempo desea posponer?',
      [
        { text: 'Cancelar', style: 'cancel' },
        { text: '5 minutos', onPress: () => console.log('Pospuesto 5 min') },
        { text: '15 minutos', onPress: () => console.log('Pospuesto 15 min') }
      ]
    );
  };

  const medicamentosPendientes = medicamentosHoy.filter(m => !m.tomado);
  const medicamentosTomados = medicamentosHoy.filter(m => m.tomado);

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.greeting}>¡Buenos días!</Text>
          <Text style={styles.subtitle}>Es hora de cuidar su salud</Text>
          <TouchableOpacity style={styles.assistantButton}>
            <MessageCircle size={24} color="#FFFFFF" strokeWidth={2} />
            <Text style={styles.assistantButtonText}>Asistente IA</Text>
          </TouchableOpacity>
        </View>

        {/* Próximo medicamento */}
        {medicamentosPendientes.length > 0 && (
          <View style={styles.nextMedicationCard}>
            <View style={styles.cardHeader}>
              <Bell size={28} color="#DC2626" strokeWidth={2} />
              <Text style={styles.nextMedicationTitle}>Próximo Medicamento</Text>
            </View>
            
            <View style={styles.medicationInfo}>
              <Text style={styles.medicationName}>{medicamentosPendientes[0].nombre}</Text>
              <Text style={styles.medicationDose}>{medicamentosPendientes[0].dosis}</Text>
              <View style={styles.timeContainer}>
                <Clock size={20} color="#374151" strokeWidth={2} />
                <Text style={styles.medicationTime}>{medicamentosPendientes[0].hora}</Text>
              </View>
            </View>

            <View style={styles.actionButtons}>
              <TouchableOpacity 
                style={[styles.actionButton, styles.confirmButton]}
                onPress={() => confirmarToma(medicamentosPendientes[0].id)}
              >
                <CheckCircle size={24} color="#FFFFFF" strokeWidth={2} />
                <Text style={styles.confirmButtonText}>Ya lo tomé</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={[styles.actionButton, styles.postponeButton]}
                onPress={() => posponerToma(medicamentosPendientes[0].id)}
              >
                <Clock size={24} color="#FFFFFF" strokeWidth={2} />
                <Text style={styles.postponeButtonText}>Posponer</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* Resumen del día */}
        <View style={styles.summaryCard}>
          <Text style={styles.summaryTitle}>Resumen de Hoy</Text>
          
          <View style={styles.summaryStats}>
            <View style={styles.statItem}>
              <View style={[styles.statCircle, { backgroundColor: '#16A34A' }]}>
                <CheckCircle size={32} color="#FFFFFF" strokeWidth={2} />
              </View>
              <Text style={styles.statNumber}>{medicamentosTomados.length}</Text>
              <Text style={styles.statLabel}>Tomados</Text>
            </View>
            
            <View style={styles.statItem}>
              <View style={[styles.statCircle, { backgroundColor: '#DC2626' }]}>
                <XCircle size={32} color="#FFFFFF" strokeWidth={2} />
              </View>
              <Text style={styles.statNumber}>{medicamentosPendientes.length}</Text>
              <Text style={styles.statLabel}>Pendientes</Text>
            </View>
            
            <View style={styles.statItem}>
              <View style={[styles.statCircle, { backgroundColor: '#2563EB' }]}>
                <Pill size={32} color="#FFFFFF" strokeWidth={2} />
              </View>
              <Text style={styles.statNumber}>{medicamentosHoy.length}</Text>
              <Text style={styles.statLabel}>Total</Text>
            </View>
          </View>
        </View>

        {/* Lista de medicamentos del día */}
        <View style={styles.medicationList}>
          <Text style={styles.listTitle}>Medicamentos de Hoy</Text>
          
          {medicamentosHoy.map((medicamento) => (
            <View key={medicamento.id} style={styles.medicationItem}>
              <View style={styles.medicationIcon}>
                <Pill 
                  size={24} 
                  color={medicamento.tomado ? '#16A34A' : '#6B7280'} 
                  strokeWidth={2} 
                />
              </View>
              
              <View style={styles.medicationDetails}>
                <Text style={styles.medicationItemName}>{medicamento.nombre}</Text>
                <Text style={styles.medicationItemDose}>{medicamento.dosis}</Text>
                <Text style={styles.medicationItemTime}>{medicamento.hora}</Text>
              </View>
              
              <View style={styles.medicationStatus}>
                {medicamento.tomado ? (
                  <CheckCircle size={28} color="#16A34A" strokeWidth={2} />
                ) : (
                  <TouchableOpacity
                    style={styles.takeButton}
                    onPress={() => confirmarToma(medicamento.id)}
                  >
                    <Text style={styles.takeButtonText}>Tomar</Text>
                  </TouchableOpacity>
                )}
              </View>
            </View>
          ))}
        </View>

        {/* Botón flotante para agregar medicamento */}
        <TouchableOpacity style={styles.fab}>
          <Plus size={28} color="#FFFFFF" strokeWidth={2} />
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  scrollView: {
    flex: 1,
    paddingHorizontal: 20,
  },
  header: {
    paddingVertical: 24,
    alignItems: 'center',
  },
  greeting: {
    fontSize: 32,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 18,
    color: '#6B7280',
    marginBottom: 20,
  },
  assistantButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#2563EB',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 25,
    gap: 8,
  },
  assistantButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  nextMedicationCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 24,
    marginBottom: 20,
    borderLeftWidth: 4,
    borderLeftColor: '#DC2626',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    gap: 12,
  },
  nextMedicationTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#DC2626',
  },
  medicationInfo: {
    marginBottom: 20,
  },
  medicationName: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 4,
  },
  medicationDose: {
    fontSize: 18,
    color: '#6B7280',
    marginBottom: 8,
  },
  timeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  medicationTime: {
    fontSize: 20,
    fontWeight: '600',
    color: '#374151',
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 12,
    gap: 8,
  },
  confirmButton: {
    backgroundColor: '#16A34A',
  },
  confirmButtonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '600',
  },
  postponeButton: {
    backgroundColor: '#F59E0B',
  },
  postponeButtonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '600',
  },
  summaryCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 24,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  summaryTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 20,
    textAlign: 'center',
  },
  summaryStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  statItem: {
    alignItems: 'center',
    flex: 1,
  },
  statCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  statNumber: {
    fontSize: 28,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 16,
    color: '#6B7280',
    fontWeight: '500',
  },
  medicationList: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 24,
    marginBottom: 100,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  listTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 20,
  },
  medicationItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
    gap: 16,
  },
  medicationIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  medicationDetails: {
    flex: 1,
  },
  medicationItemName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 2,
  },
  medicationItemDose: {
    fontSize: 16,
    color: '#6B7280',
    marginBottom: 2,
  },
  medicationItemTime: {
    fontSize: 16,
    color: '#374151',
    fontWeight: '500',
  },
  medicationStatus: {
    minWidth: 80,
    alignItems: 'center',
  },
  takeButton: {
    backgroundColor: '#16A34A',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  takeButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  fab: {
    position: 'absolute',
    bottom: 20,
    right: 20,
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#2563EB',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
});