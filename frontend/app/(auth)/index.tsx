import React from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity 
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Users, User, Heart } from 'lucide-react-native';

/**
 * PANTALLA PRINCIPAL DE AUTENTICACIÓN
 * 
 * Esta es la primera pantalla que ve el usuario al abrir la aplicación.
 * Permite seleccionar si es:
 * - Usuario: Persona que gestiona sus propios medicamentos
 * - Cuidador: Persona que ayuda a gestionar medicamentos de otra persona
 * 
 * Navega hacia:
 * - Usuario → login-form.tsx (login tradicional)
 * - Cuidador → selecciona-paciente.tsx (búsqueda de paciente)
 */
export default function SelectUserScreen() {
  /**
   * FUNCIÓN DE NAVEGACIÓN SEGÚN TIPO DE USUARIO
   * 
   * Dirige a diferentes flujos según el tipo seleccionado:
   * - 'usuario': Personas que gestionan sus propios medicamentos
   *              → Redirige a login-form.tsx
   * - 'cuidador': Personas que ayudan a gestionar medicamentos de otros
   *               → Redirige a selecciona-paciente.tsx
   */
  const selectUserType = (type: 'usuario' | 'cuidador') => {
    if (type === 'usuario') {
      // Usuario normal va al login tradicional
      router.push('/(auth)/login-form');
    } else {
      // Cuidador va a seleccionar paciente
      router.push('/(auth)/selecciona-paciente');
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <View style={styles.logoContainer}>
          <Heart size={48} color="#2563EB" strokeWidth={2} />
        </View>
        <Text style={styles.title}>PastillApp</Text>
        <Text style={styles.subtitle}>
          Tu compañero confiable para el cuidado de la salud
        </Text>
      </View>

      <View style={styles.content}>
        <Text style={styles.questionText}>¿Quién va a usar la aplicación?</Text>
        
        <View style={styles.optionsContainer}>
          <TouchableOpacity 
            style={styles.optionCard}
            onPress={() => selectUserType('usuario')}
          >
            <View style={styles.optionIcon}>
              <User size={48} color="#2563EB" strokeWidth={2} />
            </View>
            <Text style={styles.optionTitle}>Soy el Usuario</Text>
            <Text style={styles.optionDescription}>
              Voy a gestionar mis propios medicamentos y recordatorios
            </Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.optionCard}
            onPress={() => selectUserType('cuidador')}
          >
            <View style={styles.optionIcon}>
              <Users size={48} color="#16A34A" strokeWidth={2} />
            </View>
            <Text style={styles.optionTitle}>Soy Cuidador</Text>
            <Text style={styles.optionDescription}>
              Voy a ayudar a gestionar los medicamentos de otra persona
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  header: {
    alignItems: 'center',
    paddingTop: 40,
    paddingBottom: 40,
  },
  logoContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#EBF4FF',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  title: {
    fontSize: 36,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 12,
  },
  subtitle: {
    fontSize: 18,
    color: '#6B7280',
    textAlign: 'center',
    paddingHorizontal: 40,
    lineHeight: 26,
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
    justifyContent: 'flex-start',
    paddingTop: 20,
  },
  questionText: {
    fontSize: 24,
    fontWeight: '600',
    color: '#1F2937',
    textAlign: 'center',
    marginBottom: 16,
    lineHeight: 32,
  },
  optionsContainer: {
    flexDirection: 'row',
    gap: 16,
    justifyContent: 'space-between',
  },
  optionCard: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 24,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 6,
    borderWidth: 2,
    borderColor: 'transparent',
    minHeight: 200,
    justifyContent: 'center',
  },
  optionIcon: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#F8FAFC',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  optionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 8,
    textAlign: 'center',
  },
  optionDescription: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 20,
  },
});