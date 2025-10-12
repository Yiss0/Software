import React, { useState, useCallback } from 'react';
import { View, Text, FlatList, ActivityIndicator, StyleSheet, SafeAreaView, Modal, TextInput, Alert, TouchableOpacity } from 'react-native';
import { useAuth } from '../../context/AuthContext';
import { useFocusEffect } from 'expo-router';
import * as apiService from '../../services/apiService';
import { Plus, X, Phone, MessageSquare, User } from 'lucide-react-native';
import Communications from 'react-native-communications';

export default function FamiliaresScreen() {
  const { user } = useAuth();
  const [caregivers, setCaregivers] = useState<apiService.CaregiverForPatient[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [caregiverEmail, setCaregiverEmail] = useState('');
  const [isLinking, setIsLinking] = useState(false);

  const loadCaregivers = useCallback(async () => {
    if (user?.id && user.role === 'PATIENT') {
      try {
        setIsLoading(true);
        setError(null);
        const caregiverList = await apiService.fetchCaregiversForPatient(user.id);
        setCaregivers(caregiverList);
      } catch (e) {
        setError('No se pudieron cargar tus cuidadores.');
        console.error(e);
      } finally {
        setIsLoading(false);
      }
    } else {
        setIsLoading(false);
    }
  }, [user]);

  // --- CORRECCIÓN DEL ERROR DE useFocusEffect ---
  useFocusEffect(
    useCallback(() => {
        loadCaregivers();
    }, [loadCaregivers])
  );

  const handleLinkCaregiver = async () => {
    if (!caregiverEmail.trim() || !user?.id) {
        Alert.alert('Error', 'Por favor, ingresa un email válido.');
        return;
    }
    setIsLinking(true);
    try {
        const newLink = await apiService.linkCaregiverByEmail(user.id, caregiverEmail);
        setCaregivers(prev => [...prev, newLink]);
        Alert.alert('Éxito', 'Cuidador vinculado correctamente.');
        setIsModalVisible(false);
        setCaregiverEmail('');
    } catch (error: any) {
        Alert.alert('Error al vincular', error.message);
    } finally {
        setIsLinking(false);
    }
  };

  const renderCaregiverCard = ({ item }: { item: apiService.CaregiverForPatient }) => {
    const { caregiver } = item;
    const phoneNumber = caregiver.phone?.replace(/[^0-9]/g, '');

    return (
        <View style={styles.card}>
            <View style={styles.cardHeader}>
                <View style={styles.avatar}>
                    <User size={24} color="#1E40AF" />
                </View>
                <View>
                    <Text style={styles.cardName}>{caregiver.firstName} {caregiver.lastName}</Text>
                    <Text style={styles.cardRelation}>{item.relation || 'Cuidador'}</Text>
                </View>
            </View>
            <Text style={styles.cardPhone}>{caregiver.phone || 'Teléfono no disponible'}</Text>
            <View style={styles.cardActions}>
                <TouchableOpacity 
                    style={[styles.actionButton, styles.callButton, !phoneNumber && styles.buttonDisabled]}
                    onPress={() => phoneNumber && Communications.phonecall(phoneNumber, true)}
                    disabled={!phoneNumber}
                >
                    <Phone size={16} color="#FFFFFF" />
                    <Text style={styles.actionButtonText}>Llamar</Text>
                </TouchableOpacity>
                <TouchableOpacity 
                    style={[styles.actionButton, styles.messageButton, !phoneNumber && styles.buttonDisabled]}
                    onPress={() => phoneNumber && Communications.text(phoneNumber)}
                    disabled={!phoneNumber}
                >
                    <MessageSquare size={16} color="#FFFFFF" />
                    <Text style={styles.actionButtonText}>Mensaje</Text>
                </TouchableOpacity>
            </View>
        </View>
    );
  }

  if (isLoading) {
    return <View style={styles.container}><ActivityIndicator size="large" color="#0000ff" /></View>;
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Familiares y Cuidadores</Text>
      </View>
      <FlatList
        data={caregivers}
        renderItem={renderCaregiverCard}
        keyExtractor={(item) => item.caregiver.id}
        contentContainerStyle={{ paddingHorizontal: 20 }}
        ListEmptyComponent={
            <View style={styles.emptyContainer}>
                <Text style={styles.emptyText}>Aún no tienes cuidadores.</Text>
                <Text style={styles.emptySubText}>Presiona el botón '+' para añadir uno.</Text>
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
                <Text style={styles.modalTitle}>Añadir Cuidador</Text>
                <Text style={styles.modalSubtitle}>Ingresa el email de la persona que quieres que sea tu cuidador. Esa persona ya debe tener una cuenta en PastillApp.</Text>
                <TextInput
                    style={styles.input}
                    placeholder="email@ejemplo.com"
                    value={caregiverEmail}
                    onChangeText={setCaregiverEmail}
                    keyboardType="email-address"
                    autoCapitalize="none"
                />
                <TouchableOpacity style={[styles.modalActionButton, isLinking && styles.buttonDisabled]} onPress={handleLinkCaregiver} disabled={isLinking}>
                    {isLinking ? <ActivityIndicator color="#FFFFFF" /> : <Text style={styles.modalActionButtonText}>Vincular Cuidador</Text>}
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
    title: { fontSize: 28, fontWeight: '700', color: '#1F2937' },
    card: { backgroundColor: 'white', borderRadius: 16, padding: 20, marginBottom: 16, elevation: 3, shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 5 },
    cardHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 16 },
    avatar: { width: 48, height: 48, borderRadius: 24, backgroundColor: '#EBF4FF', justifyContent: 'center', alignItems: 'center', marginRight: 12 },
    cardName: { fontSize: 18, fontWeight: 'bold', color: '#1F2937' },
    cardRelation: { fontSize: 14, color: '#6B7280' },
    cardPhone: { fontSize: 16, color: '#374151', marginBottom: 20 },
    cardActions: { flexDirection: 'row', justifyContent: 'space-between', gap: 12 },
    actionButton: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', padding: 14, borderRadius: 12, gap: 8 },
    callButton: { backgroundColor: '#16A34A' },
    messageButton: { backgroundColor: '#2563EB' },
    actionButtonText: { color: 'white', fontSize: 16, fontWeight: 'bold' },
    buttonDisabled: { backgroundColor: '#9CA3AF' },
    emptyContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', marginTop: '50%' },
    emptyText: { fontSize: 18, fontWeight: '600', color: '#6B7280' },
    emptySubText: { fontSize: 16, color: '#9CA3AF', marginTop: 8 },
    fab: { position: 'absolute', bottom: 30, right: 30, width: 64, height: 64, borderRadius: 32, backgroundColor: '#2563EB', justifyContent: 'center', alignItems: 'center', elevation: 8 },
    modalContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(0, 0, 0, 0.5)' },
    modalContent: { width: '90%', backgroundColor: 'white', borderRadius: 20, padding: 24, alignItems: 'center' },
    closeButton: { position: 'absolute', top: 16, right: 16 },
    modalTitle: { fontSize: 22, fontWeight: 'bold', marginBottom: 8 },
    modalSubtitle: { fontSize: 14, color: 'gray', textAlign: 'center', marginBottom: 20 },
    input: { width: '100%', borderWidth: 1, borderColor: '#D1D5DB', borderRadius: 10, padding: 12, fontSize: 16, marginBottom: 20 },
    modalActionButton: { backgroundColor: '#16A34A', padding: 14, borderRadius: 10, width: '100%', alignItems: 'center' },
    modalActionButtonText: { color: 'white', fontWeight: 'bold', fontSize: 16 },
});