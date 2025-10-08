import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, ScrollView, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Link, router } from 'expo-router';
import { Eye, EyeOff, User, Lock, Pill, ArrowLeft } from 'lucide-react-native';
import * as db from '../../services/database';
import { useAuth } from '../../context/AuthContext';

/**
 * PANTALLA DE LOGIN TRADICIONAL
 * 
 * Formulario de inicio de sesión para usuarios normales que gestionan
 * sus propios medicamentos.
 * 
 * Funcionalidades:
 * - Autenticación con email y contraseña
 * - Validación contra la base de datos
 * - Establece sesión como 'usuario'
 * - Enlace para registro de nuevos usuarios
 * 
 * Viene desde: index.tsx (selección "Soy el Usuario")
 * Va hacia: aplicación principal (tabs) tras login exitoso
 */
export default function LoginFormScreen() {
  const { setSession, database } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  /**
   * FUNCIÓN DE AUTENTICACIÓN DE USUARIOS
   * 
   * Procesa el login tradicional:
   * 1. Valida que los campos estén completos
   * 2. Busca al usuario en la base de datos por email
   * 3. Verifica la contraseña hasheada
   * 4. Establece la sesión como 'usuario' si todo es correcto
   * 5. Redirige automáticamente a la aplicación principal (tabs)
   */
  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert('Error', 'Por favor complete todos los campos');
      return;
    }

    if (!database) {
      Alert.alert('Error', 'La base de datos no está lista, intente de nuevo.');
      return;
    }

    setLoading(true);
    
    try {
      // Buscar usuario por email en la base de datos
      const userFound = await db.findUserByEmail(database, email.toLowerCase().trim());

      if (!userFound) {
        Alert.alert('Error', 'El correo electrónico o la contraseña son incorrectos.');
        setLoading(false);
        return;
      }

      // Verificar contraseña hasheada
      const isPasswordCorrect = await db.verifyPassword(password, userFound.password_hash);

      if (isPasswordCorrect) {
        // Establecer sesión como usuario normal
        setSession(String(userFound.id), 'usuario'); 
      } else {
        Alert.alert('Error', 'El correo electrónico o la contraseña son incorrectos.');
      }
    } catch (error) {
      console.error("Error en el login:", error);
      Alert.alert('Error', 'Ocurrió un error inesperado.');
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
            <ArrowLeft size={24} color="#2563EB" strokeWidth={2} />
          </TouchableOpacity>
        </View>
        
        <View style={styles.header}>
          <View style={styles.logoContainer}>
            <Pill size={48} color="#2563EB" strokeWidth={2} />
          </View>
          <Text style={styles.title}>PastillApp</Text>
          <Text style={styles.subtitle}>Bienvenido de vuelta</Text>
        </View>

        <View style={styles.formContainer}>
          <View style={styles.inputContainer}>
            <Text style={styles.inputLabel}>Correo electrónico</Text>
            <View style={styles.inputWrapper}>
              <User size={20} color="#6B7280" strokeWidth={2} />
              <TextInput
                style={styles.textInput}
                value={email}
                onChangeText={setEmail}
                placeholder="tu@email.com"
                placeholderTextColor="#9CA3AF"
                keyboardType="email-address"
                autoCapitalize="none"
                autoComplete="email"
              />
            </View>
          </View>

          <View style={styles.inputContainer}>
            <Text style={styles.inputLabel}>Contraseña</Text>
            <View style={styles.inputWrapper}>
              <Lock size={20} color="#6B7280" strokeWidth={2} />
              <TextInput
                style={styles.textInput}
                value={password}
                onChangeText={setPassword}
                placeholder="Tu contraseña"
                placeholderTextColor="#9CA3AF"
                secureTextEntry={!showPassword}
                autoComplete="password"
              />
              <TouchableOpacity 
                onPress={() => setShowPassword(!showPassword)}
                style={styles.eyeButton}
              >
                {showPassword ? 
                  <EyeOff size={20} color="#6B7280" strokeWidth={2} /> : 
                  <Eye size={20} color="#6B7280" strokeWidth={2} />
                }
              </TouchableOpacity>
            </View>
          </View>

          <TouchableOpacity style={styles.forgotPassword}>
            <Text style={styles.forgotPasswordText}>¿Olvidaste tu contraseña?</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={[styles.loginButton, loading && styles.loginButtonDisabled]}
            onPress={handleLogin}
            disabled={loading}
          >
            <Text style={styles.loginButtonText}>
              {loading ? 'Iniciando sesión...' : 'Iniciar Sesión'}
            </Text>
          </TouchableOpacity>

          <View style={styles.divider}>
            <View style={styles.dividerLine} />
            <Text style={styles.dividerText}>O</Text>
            <View style={styles.dividerLine} />
          </View>

          <View style={styles.registerContainer}>
            <Text style={styles.registerText}>¿No tienes cuenta?</Text>
            <Link href={{ pathname: '/(auth)/registro', params: { tipo: 'usuario' } }} asChild>
              <TouchableOpacity style={styles.registerButton}>
                <Text style={styles.registerButtonText}>Crear cuenta</Text>
              </TouchableOpacity>
            </Link>
          </View>
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
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  header: {
    alignItems: 'center',
    marginBottom: 40,
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
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 20,
    color: '#6B7280',
    textAlign: 'center',
  },
  formContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 28,
    marginBottom: 32,
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
  eyeButton: {
    padding: 4,
  },
  forgotPassword: {
    alignItems: 'flex-end',
    marginBottom: 32,
  },
  forgotPasswordText: {
    fontSize: 16,
    color: '#2563EB',
    fontWeight: '500',
  },
  loginButton: {
    backgroundColor: '#2563EB',
    borderRadius: 16,
    paddingVertical: 20,
    alignItems: 'center',
    marginBottom: 24,
  },
  loginButtonDisabled: {
    backgroundColor: '#9CA3AF',
  },
  loginButtonText: {
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
  registerContainer: {
    alignItems: 'center',
    gap: 12,
  },
  registerText: {
    fontSize: 18,
    color: '#6B7280',
  },
  registerButton: {
    borderWidth: 2,
    borderColor: '#2563EB',
    borderRadius: 16,
    paddingVertical: 16,
    paddingHorizontal: 32,
  },
  registerButtonText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#2563EB',
  },
});