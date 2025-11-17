// frontend/app/caregiver/tabs/pacientes.tsx (CORREGIDA LA ALINEACIÓN DEL TÍTULO)

import React, { useState, useCallback, useRef } from 'react';
// --- IMPORTACIÓN CORREGIDA ---
// @ts-ignore
import { View, Text, FlatList, ActivityIndicator, TouchableOpacity, StyleSheet, TextInput, Alert, Modal } from 'react-native';
// Se quitó 'SafeAreaView' de react-native
import { SafeAreaView } from 'react-native-safe-area-context'; // Se añadió la importación correcta
// -----------------------------
import { useRouter, useFocusEffect } from 'expo-router';
import { useAuth } from '../../../context/AuthContext';
import { usePatient } from '../../../context/PatientContext';
import * as apiService from '../../../services/apiService';
import { Plus, X, User, ChevronRight } from 'lucide-react-native'; 

import * as pushService from '../../../services/pushNotificationService';
import Constants from 'expo-constants'; 

export default function PacientesScreen() {
  const router = useRouter();
  const { user } = useAuth();
  // 'selectPatient' no se usa, pero lo dejamos por si acaso
  const { selectPatient } = usePatient(); 
  const [patients, setPatients] = useState<apiService.PatientForCaregiver[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [patientEmail, setPatientEmail] = useState('');
  const [isLinking, setIsLinking] = useState(false);
  const [isModalVisible, setIsModalVisible] = useState(false);

  const pushRegistered = useRef(false);
  
  const [error, setError] = useState<string | null>(null);

  // ... (Toda la lógica: loadLinkedPatients, useFocusEffect, handleLinkPatient, handleSelectPatient se mantiene 100% igual) ...
  const loadLinkedPatients = useCallback(async () => {
    if (user?.id && user.role === 'CAREGIVER') {
      setIsLoading(true);
      setError(null); 
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
      const loadData = async () => {
        if (user?.id && user.role === 'CAREGIVER') {
          await loadLinkedPatients();
          if (!pushRegistered.current) {
            console.log("[PacientesScreen] Registrando para notificaciones push...");
            const projectId = Constants.expoConfig?.extra?.eas?.projectId; 
            
            if (projectId) {
              await pushService.registerForPushNotifications(user.id, projectId);
              pushRegistered.current = true; 
            } else {
              console.error("No se encontró 'projectId' en la configuración de Expo (extra.eas.projectId).");
              Alert.alert("Error de Configuración", "Falta el projectId de Expo en app.json, las notificaciones push no funcionarán.");
            }
          }
        }
      };

      loadData();
    }, [user, loadLinkedPatients]) 
  );

  const handleLinkPatient = async () => {
    if (!patientEmail.trim() || !user?.id) {
        Alert.alert('Email requerido', 'Por favor, ingresa el email del paciente.');
        return;
    }
    setIsLinking(true);
    try {
        await apiService.linkPatientToCaregiverByEmail(user.id, patientEmail);
        Alert.alert('Éxito', '¡Perfecto! El paciente ha sido vinculado correctamente.');
        setPatientEmail('');
        setIsModalVisible(false);
        await loadLinkedPatients();
    } catch (error: any) {
        let mensajeError = 'No se pudo vincular el paciente. Intenta de nuevo.';
        
        // Mapeo de errores técnicos a mensajes amigables
        if (error.message.includes('No se encontró')) {
            mensajeError = 'No existe un paciente con ese email. Verifica que el email sea correcto.';
        } else if (error.message.includes('vinculado')) {
            mensajeError = 'Ya estás vinculado a este paciente.';
        } else if (error.message.includes('Email')) {
            mensajeError = 'El email no es válido.';
        }
        
        Alert.alert('No se pudo vincular', mensajeError);
    } finally {
        setIsLinking(false);
    }
  };

  const handleSelectPatient = (patientProfile: apiService.UserProfile) => {
    router.push({ 
        pathname: '/(caregiver)/patient-dashboard', 
        params: { 
            patientId: patientProfile.id,
            patientName: `${patientProfile.firstName} ${patientProfile.lastName}`
        }
    });
  };

  if (isLoading) {
    return (
      <SafeAreaView style={[styles.container, styles.loadingContainer]}>
        <ActivityIndicator size="large" color="#2563EB" />
      </SafeAreaView>
    );
  }

  return (
    // Ahora <SafeAreaView> es el componente correcto
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
            <View style={styles.patientInfo}>
              <View style={styles.avatar}>
                {/* @ts-ignore */}
                <User size={20} color="#1E40AF" />
              </View>
              <Text style={styles.patientName}>{item.patient.firstName} {item.patient.lastName}</Text>
            </View>
            {/* @ts-ignore */}
            <ChevronRight size={20} color="#6B7280" />
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
        {/* @ts-ignore */}
        <Plus size={32} color="#FFFFFF" />
      </TouchableOpacity>

      {/* --- Modal --- */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={isModalVisible}
        onRequestClose={() => setIsModalVisible(false)}
      >
        <View style={styles.modalContainer}>
            <View style={styles.modalContent}>
                <TouchableOpacity style={styles.closeButton} onPress={() => setIsModalVisible(false)}>
                    {/* @ts-ignore */}
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

// ... (Los estilos 'styles' se mantienen exactamente iguales) ...
const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#F8FAFC' },
    loadingContainer: { 
      justifyContent: 'center',
      alignItems: 'center'
    },
    header: { paddingHorizontal: 20, paddingVertical: 20 },
    title: { 
      fontSize: 28, 
      fontWeight: '700', 
      color: '#1F2937', 
    },
    patientCard: { 
      backgroundColor: 'white', 
      padding: 16, 
      borderRadius: 12, 
      marginBottom: 12, 
      elevation: 3, 
      shadowColor: '#000', 
      shadowOpacity: 0.1, 
      shadowRadius: 5,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between'
    },
    patientInfo: { 
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12
    },
    avatar: { 
      width: 40,
      height: 40,
      borderRadius: 20,
      backgroundColor: '#EBF4FF',
      justifyContent: 'center',
      alignItems: 'center',
    },
    patientName: { 
      fontSize: 18, 
      fontWeight: '600', 
      color: '#1F2937' 
    },
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