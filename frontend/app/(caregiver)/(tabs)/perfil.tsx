import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, SafeAreaView, Alert } from 'react-native';
import { useAuth } from '../../../context/AuthContext';
import { usePatient } from '../../../context/PatientContext';
import { User, Mail, Phone, LogOut } from 'lucide-react-native';

export default function CaregiverProfileScreen() {
  const { user, setUser } = useAuth();
  const { clearSelectedPatient } = usePatient();

  const handleLogout = () => {
    Alert.alert(
      "Cerrar Sesión",
      "¿Estás seguro de que quieres cerrar sesión?",
      [
        { text: "Cancelar", style: "cancel" },
        { text: "Sí, cerrar sesión", onPress: () => {
            setUser(null);
            clearSelectedPatient();
        }}
      ]
    );
  };

  // Si por alguna razón no hay datos del usuario, muestra un mensaje.
  if (!user) {
    return (
      <SafeAreaView style={styles.container}>
        <Text>No se pudo cargar la información del perfil.</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Mi Perfil</Text>
      </View>

      <View style={styles.profileCard}>
        <View style={styles.avatar}>
          <User size={48} color="#1E40AF" />
        </View>
        <Text style={styles.name}>{user.firstName} {user.lastName}</Text>
        <Text style={styles.role}>Cuidador</Text>

        <View style={styles.infoSection}>
          <View style={styles.infoRow}>
            <Mail size={20} color="#6B7280" />
            <Text style={styles.infoText}>{user.email || 'No especificado'}</Text>
          </View>
          <View style={styles.infoRow}>
            <Phone size={20} color="#6B7280" />
            <Text style={styles.infoText}>{user.phone || 'No especificado'}</Text>
          </View>
        </View>
      </View>
      
      <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
        <LogOut size={20} color="#DC2626" />
        <Text style={styles.logoutButtonText}>Cerrar Sesión</Text>
      </TouchableOpacity>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
    alignItems: 'center',
  },
  header: {
    width: '100%',
    padding: 20,
    alignItems: 'center',
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: '#1F2937',
  },
  profileCard: {
    width: '90%',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
    marginTop: 20,
    elevation: 4,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 10,
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#EBF4FF',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  name: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#1F2937',
  },
  role: {
    fontSize: 16,
    color: '#2563EB',
    fontWeight: '600',
    marginTop: 4,
    marginBottom: 24,
    backgroundColor: '#EBF4FF',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
    overflow: 'hidden',
  },
  infoSection: {
    width: '100%',
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
    paddingTop: 24,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  infoText: {
    fontSize: 16,
    color: '#374151',
    marginLeft: 12,
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    borderRadius: 12,
    backgroundColor: '#FEE2E2',
    marginTop: 32,
    width: '90%',
    gap: 8,
  },
  logoutButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#DC2626',
  },
});