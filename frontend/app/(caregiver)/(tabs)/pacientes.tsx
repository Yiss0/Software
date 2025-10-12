import React, { useState, useCallback } from 'react';
import { View, Text, FlatList, ActivityIndicator, TouchableOpacity, StyleSheet, SafeAreaView, TextInput, Alert, Modal } from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import { useAuth } from '../../../context/AuthContext';
import { usePatient } from '../../../context/PatientContext';
import * as apiService from '../../../services/apiService';
import { Plus, X } from 'lucide-react-native';

export default function PacientesScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const { selectPatient } = usePatient();
  const [patients, setPatients] = useState<apiService.PatientForCaregiver[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [patientEmail, setPatientEmail] = useState('');
  const [isLinking, setIsLinking] = useState(false);
  const [isModalVisible, setIsModalVisible] = useState(false);
  
  // --- LÍNEA AÑADIDA PARA CORREGIR EL ERROR ---
  const [error, setError] = useState<string | null>(null);

  const loadLinkedPatients = useCallback(async () => {
    if (user?.id && user.role === 'CAREGIVER') {
      setIsLoading(true);
      setError(null); // Limpiamos errores anteriores
      try {
        const patientList = await apiService.fetchPatientsForCaregiver(user.id);
        setPatients(patientList);
      } catch (e) { 
        console.error("Error cargando pacientes:", e);
        setError('No se pudieron cargar los pacientes.');
      } finally { 
        setIsLoading(false); 
      }
    }
  }, [user]);

  useFocusEffect(
    useCallback(() => {
      loadLinkedPatients();
    }, [loadLinkedPatients])
  );

  const handleLinkPatient = async () => {
    if (!patientEmail.trim() || !user?.id) {
        Alert.alert('Email inválido', 'Por favor, ingresa el email del paciente.');
        return;
    }
    setIsLinking(true);
    try {
        await apiService.linkPatientToCaregiverByEmail(user.id, patientEmail);
        Alert.alert('Éxito', 'Paciente vinculado correctamente.');
        setPatientEmail('');
        setIsModalVisible(false);
        await loadLinkedPatients();
    } catch (error: any) {
        Alert.alert('Error al vincular', error.message);
    } finally {
        setIsLinking(false);
    }
  };

  const handleSelectPatient = (patientProfile: apiService.UserProfile) => {
    selectPatient(patientProfile);
    router.push({ 
        pathname: '/historial-paciente', 
        params: { 
            patientId: patientProfile.id,
            patientName: patientProfile.firstName
        }
    });
  };

  if (isLoading) {
    return <View style={styles.container}><ActivityIndicator size="large" color="#2563EB" /></View>;
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Mis Pacientes</Text>
      </View>
      {error && <Text style={styles.errorText}>{error}</Text>}
      <FlatList
        data={patients}
        keyExtractor={(item) => item.patient.id}
        renderItem={({ item }) => (
          <TouchableOpacity style={styles.patientCard} onPress={() => handleSelectPatient(item.patient)}>
            <Text style={styles.patientName}>{item.patient.firstName} {item.patient.lastName}</Text>
          </TouchableOpacity>
        )}
        contentContainerStyle={{ paddingHorizontal: 20 }}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>Aún no tienes pacientes vinculados.</Text>
            <Text style={styles.emptySubText}>Presiona el botón '+' para añadir el primero.</Text>
          </View>
        }
      />

      <TouchableOpacity style={styles.fab} onPress={() => setIsModalVisible(true)}>
        <Plus size={32} color="#FFFFFF" />
      </TouchableOpacity>

      <Modal
        animationType="slide"
        transparent={true}
        visible={isModalVisible}
        onRequestClose={() => setIsModalVisible(false)}
      >
        <View style={styles.modalContainer}>
            <View style={styles.modalContent}>
                <TouchableOpacity style={styles.closeButton} onPress={() => setIsModalVisible(false)}>
                    <X size={24} color="#6B7280" />
                </TouchableOpacity>
                <Text style={styles.modalTitle}>Vincular Nuevo Paciente</Text>
                <Text style={styles.modalSubtitle}>Ingresa el email del paciente. La persona ya debe tener una cuenta en PastillApp.</Text>
                <TextInput 
                  style={styles.input} 
                  placeholder="email.paciente@ejemplo.com" 
                  value={patientEmail} 
                  onChangeText={setPatientEmail} 
                  keyboardType="email-address" 
                  autoCapitalize="none" 
                />
                <TouchableOpacity style={[styles.button, isLinking && styles.buttonDisabled]} onPress={handleLinkPatient} disabled={isLinking}>
                    {isLinking ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonText}>Vincular</Text>}
                </TouchableOpacity>
            </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#F8FAFC' },
    header: { paddingHorizontal: 20, paddingVertical: 20 },
    title: { fontSize: 28, fontWeight: '700', color: '#1F2937', textAlign: 'center' },
    patientCard: { backgroundColor: 'white', padding: 20, borderRadius: 10, marginBottom: 10, elevation: 2, shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 5 },
    patientName: { fontSize: 18, fontWeight: '500' },
    emptyContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', marginTop: '40%' },
    emptyText: { fontSize: 18, fontWeight: '600', color: '#6B7280' },
    emptySubText: { fontSize: 16, color: '#9CA3AF', marginTop: 8, textAlign: 'center' },
    fab: { position: 'absolute', bottom: 30, right: 30, width: 64, height: 64, borderRadius: 32, backgroundColor: '#2563EB', justifyContent: 'center', alignItems: 'center', elevation: 8 },
    modalContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(0, 0, 0, 0.5)' },
    modalContent: { width: '90%', backgroundColor: 'white', borderRadius: 20, padding: 24, alignItems: 'center' },
    closeButton: { position: 'absolute', top: 16, right: 16 },
    modalTitle: { fontSize: 22, fontWeight: 'bold', marginBottom: 8, textAlign: 'center' },
    modalSubtitle: { fontSize: 14, color: 'gray', textAlign: 'center', marginBottom: 20 },
    input: { width: '100%', backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: '#D1D5DB', padding: 15, borderRadius: 8, fontSize: 16, marginBottom: 15 },
    button: { backgroundColor: '#2563EB', padding: 15, borderRadius: 8, alignItems: 'center', width: '100%' },
    buttonText: { color: 'white', fontSize: 16, fontWeight: 'bold' },
    buttonDisabled: { backgroundColor: '#9CA3AF' },
    errorText: { textAlign: 'center', color: 'red', marginVertical: 10, fontSize: 16 },
});
