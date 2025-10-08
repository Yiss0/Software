import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, ScrollView, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Search, Users, ArrowLeft, Mail } from 'lucide-react-native';
import * as db from '../../services/database';
import { useAuth } from '../../context/AuthContext';

/**
 * PANTALLA DE SELECCIÓN DE PACIENTE PARA CUIDADORES
 * 
 * Permite a los cuidadores buscar y conectarse con el paciente
 * que van a cuidar mediante su correo electrónico.
 * 
 * Funcionalidades:
 * - Búsqueda de paciente por email
 * - Validación de existencia del paciente
 * - Establece sesión como 'cuidador' con ID del paciente
 * 
 * Viene desde: index.tsx (selección "Soy Cuidador")
 * Va hacia: aplicación principal (tabs) tras seleccionar paciente
 */
export default function SeleccionaPacienteScreen() {
  const { setSession, database } = useAuth();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);

  /**
   * FUNCIÓN DE BÚSQUEDA Y CONEXIÓN CON PACIENTE
   * 
   * Permite al cuidador conectarse con el paciente:
   * 1. Valida que se haya ingresado un email
   * 2. Busca al paciente en la base de datos por email
   * 3. Si existe, establece sesión como 'cuidador' con el ID del paciente
   * 4. Redirige automáticamente a la aplicación principal (tabs)
   * 
   * NOTA: El cuidador accede a los datos del paciente, no sus propios datos
   */
  const buscarPaciente = async () => {
    if (!email.trim()) {
      Alert.alert('Error', 'Por favor ingresa el correo del paciente');
      return;
    }

    if (!database) {
      Alert.alert('Error', 'La base de datos no está lista, intente de nuevo.');
      return;
    }

    setLoading(true);
    
    try {
      // Buscar paciente por email en la base de datos
      const pacienteFound = await db.findUserByEmail(database, email.toLowerCase().trim());

      if (!pacienteFound) {
        Alert.alert('Paciente no encontrado', 'Verifica que el correo esté correcto');
        setLoading(false);
        return;
      }

      // Establecer sesión como cuidador del paciente encontrado
      // IMPORTANTE: Guardamos el ID del paciente que el cuidador va a gestionar
      setSession(String(pacienteFound.id), 'cuidador');
      
    } catch (error) {
      console.error("Error buscando paciente:", error);
      Alert.alert('Error', 'Ocurrió un error al buscar el paciente.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView 
        style={styles.scrollView} 
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Botón de regreso */}
        <View style={styles.headerContainer}>
          <TouchableOpacity 
            style={styles.backButton}
            onPress={() => router.back()}
          >
            <ArrowLeft size={24} color="#16A34A" strokeWidth={2} />
          </TouchableOpacity>
        </View>
        
        <View style={styles.header}>
          <View style={styles.logoContainer}>
            <Users size={48} color="#16A34A" strokeWidth={2} />
          </View>
          <Text style={styles.title}>Selecciona tu Paciente</Text>
          <Text style={styles.subtitle}>
            Ingresa el correo electrónico de la persona que vas a cuidar
          </Text>
        </View>

        <View style={styles.formContainer}>
          <View style={styles.inputContainer}>
            <Text style={styles.inputLabel}>Correo del paciente</Text>
            <View style={styles.inputWrapper}>
              <Mail size={20} color="#6B7280" strokeWidth={2} />
              <TextInput
                style={styles.textInput}
                value={email}
                onChangeText={setEmail}
                placeholder="paciente@email.com"
                placeholderTextColor="#9CA3AF"
                keyboardType="email-address"
                autoCapitalize="none"
                autoComplete="email"
              />
            </View>
          </View>

          <TouchableOpacity 
            style={[styles.searchButton, loading && styles.searchButtonDisabled]}
            onPress={buscarPaciente}
            disabled={loading}
          >
            <Search size={20} color="#FFFFFF" strokeWidth={2} />
            <Text style={styles.searchButtonText}>
              {loading ? 'Buscando...' : 'Entrar'}
            </Text>
          </TouchableOpacity>
        </View>

        <View style={styles.infoContainer}>
          <Text style={styles.infoTitle}>Información importante</Text>
          <Text style={styles.infoText}>
            • Como cuidador, podrás ver el historial de medicamentos{'\n'}
            • Tendrás acceso limitado por seguridad{'\n'}
            • El paciente siempre tendrá control total de su cuenta
          </Text>
        </View>
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
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 24,
    paddingVertical: 32,
  },
  headerContainer: {
    alignItems: 'flex-start',
    marginBottom: 20,
  },
  backButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#F0FDF4',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#BBF7D0',
  },
  header: {
    alignItems: 'center',
    marginBottom: 40,
  },
  logoContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#F0FDF4',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  title: {
    fontSize: 32,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 18,
    color: '#6B7280',
    textAlign: 'center',
    paddingHorizontal: 20,
    lineHeight: 26,
  },
  formContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 28,
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 8,
  },
  inputContainer: {
    marginBottom: 24,
  },
  inputLabel: {
    fontSize: 18,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 12,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#D1D5DB',
    borderRadius: 16,
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#FFFFFF',
    gap: 16,
  },
  textInput: {
    flex: 1,
    fontSize: 18,
    color: '#1F2937',
    minHeight: 24,
  },
  searchButton: {
    backgroundColor: '#16A34A',
    borderRadius: 16,
    paddingVertical: 20,
    alignItems: 'center',
    marginBottom: 24,
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 12,
  },
  searchButtonDisabled: {
    backgroundColor: '#9CA3AF',
  },
  searchButtonText: {
    fontSize: 20,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24,
    gap: 16,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#E5E7EB',
  },
  dividerText: {
    fontSize: 16,
    color: '#6B7280',
    fontWeight: '500',
  },
  helpContainer: {
    backgroundColor: '#F0FDF4',
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#BBF7D0',
  },
  helpTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#166534',
    marginBottom: 8,
    textAlign: 'center',
  },
  helpText: {
    fontSize: 16,
    color: '#166534',
    textAlign: 'center',
    marginBottom: 16,
    lineHeight: 24,
  },
  createAccountButton: {
    backgroundColor: '#16A34A',
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 24,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  createAccountButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  infoContainer: {
    backgroundColor: '#F1F5F9',
    borderRadius: 16,
    padding: 20,
    borderLeftWidth: 4,
    borderLeftColor: '#16A34A',
  },
  infoTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 12,
  },
  infoText: {
    fontSize: 14,
    color: '#6B7280',
    lineHeight: 20,
  },
});