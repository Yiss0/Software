import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, ScrollView, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { User, Mail, Lock, Phone, Calendar, Eye, EyeOff, Pill, ArrowLeft } from 'lucide-react-native';
import * as apiService from '../../services/apiService';

export default function RegistroScreen() {
  const [formData, setFormData] = useState({
    nombre: '',
    apellido: '',
    email: '',
    telefono: '',
    fechaNacimiento: '',
    password: '',
    confirmPassword: ''
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleInputChange = (field: keyof typeof formData, value: string) => {
    if (field === 'telefono') {
      const cleaned = value.replace(/[^0-9]/g, '');
      const truncated = cleaned.slice(0, 8);
      let formatted = truncated;
      if (truncated.length > 4) {
        formatted = `${truncated.slice(0, 4)} ${truncated.slice(4)}`;
      }
      setFormData(prev => ({ ...prev, [field]: formatted }));
    } else if (field === 'fechaNacimiento') {
      const cleaned = value.replace(/[^0-9]/g, '');
      let formatted = cleaned;
      if (cleaned.length > 2) {
        formatted = `${cleaned.slice(0, 2)}/${cleaned.slice(2)}`;
      }
      if (cleaned.length > 4) {
        formatted = `${cleaned.slice(0, 2)}/${cleaned.slice(2, 4)}/${cleaned.slice(4)}`;
      }
      setFormData(prev => ({ ...prev, [field]: formatted.slice(0, 10) }));
    }
    else {
      setFormData(prev => ({ ...prev, [field]: value }));
    }
  };

  const validateForm = () => {
    const { nombre, apellido, email, telefono, password, confirmPassword } = formData;
    if (!nombre || !apellido || !email || !telefono || !password || !confirmPassword) {
      Alert.alert('Error', 'Por favor complete todos los campos obligatorios');
      return false;
    }
    if (password !== confirmPassword) {
      Alert.alert('Error', 'Las contraseñas no coinciden');
      return false;
    }
    if (password.length < 6) {
      Alert.alert('Error', 'La contraseña debe tener al menos 6 caracteres');
      return false;
    }
    return true;
  };

  const handleRegister = async () => {
    if (!validateForm()) return;
    setLoading(true);
    try {
      const payload: apiService.UserRegistrationPayload = {
        firstName: formData.nombre,
        lastName: formData.apellido,
        email: formData.email.toLowerCase().trim(),
        phone: `+569${formData.telefono.replace(/\s/g, '')}`,
        birthDate: formData.fechaNacimiento,
        password: formData.password,
      };

      const newUser = await apiService.registerUser(payload);
      
      if (newUser && newUser.id) {
        Alert.alert(
          'Registro exitoso',
          'Su cuenta ha sido creada correctamente. Ahora inicie sesión.',
          [{ text: 'Ir a Login', onPress: () => router.replace('/(auth)/login') }]
        );
      } else {
        Alert.alert('Error de registro', 'No se pudo crear la cuenta.');
      }
    } catch (error) {
      console.error(error);
      Alert.alert('Error', 'No se pudo crear la cuenta. Es posible que el correo ya esté en uso.');
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
        <View style={styles.header}>
          <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
              <ArrowLeft size={24} color="#2563EB" strokeWidth={2} />
          </TouchableOpacity>
          <View style={styles.logoContainer}>
            <Pill size={48} color="#2563EB" strokeWidth={2} />
          </View>
          <Text style={styles.title}>Crear Cuenta</Text>
          <Text style={styles.subtitle}>Complete sus datos para comenzar</Text>
        </View>

        <View style={styles.formContainer}>
          <Text style={styles.sectionTitle}>Información Personal</Text>
          <View style={styles.inputRow}>
            <View style={[styles.inputContainer, styles.halfWidth]}>
              <Text style={styles.inputLabel}>Nombre *</Text>
              <View style={styles.inputWrapper}>
                <User size={20} color="#6B7280" strokeWidth={2} />
                <TextInput style={styles.textInput} value={formData.nombre} onChangeText={(text) => handleInputChange('nombre', text)} placeholder="Su nombre" placeholderTextColor="#9CA3AF" autoCapitalize="words" />
              </View>
            </View>
            <View style={[styles.inputContainer, styles.halfWidth]}>
              <Text style={styles.inputLabel}>Apellido *</Text>
              <View style={styles.inputWrapper}>
                <User size={20} color="#6B7280" strokeWidth={2} />
                <TextInput style={styles.textInput} value={formData.apellido} onChangeText={(text) => handleInputChange('apellido', text)} placeholder="Su apellido" placeholderTextColor="#9CA3AF" autoCapitalize="words" />
              </View>
            </View>
          </View>
          <View style={styles.inputContainer}>
            <Text style={styles.inputLabel}>Correo electrónico *</Text>
            <View style={styles.inputWrapper}>
              <Mail size={20} color="#6B7280" strokeWidth={2} />
              <TextInput style={styles.textInput} value={formData.email} onChangeText={(text) => handleInputChange('email', text)} placeholder="ejemplo@correo.com" placeholderTextColor="#9CA3AF" keyboardType="email-address" autoCapitalize="none" autoComplete="email" />
            </View>
          </View>
          <View style={styles.inputContainer}>
            <Text style={styles.inputLabel}>Teléfono *</Text>
            <View style={styles.inputWrapper}>
              <Phone size={20} color="#6B7280" strokeWidth={2} />
              <Text style={styles.phonePrefix}>+56 9</Text>
              <TextInput style={styles.phoneInput} value={formData.telefono} onChangeText={(text) => handleInputChange('telefono', text)} placeholder="1234 5678" placeholderTextColor="#9CA3AF" keyboardType="phone-pad" maxLength={9} />
            </View>
          </View>
          <View style={styles.inputContainer}>
            <Text style={styles.inputLabel}>Fecha de nacimiento</Text>
            <View style={styles.inputWrapper}>
              <Calendar size={20} color="#6B7280" strokeWidth={2} />
              <TextInput style={styles.textInput} value={formData.fechaNacimiento} onChangeText={(text) => handleInputChange('fechaNacimiento', text)} placeholder="DD/MM/AAAA" placeholderTextColor="#9CA3AF" keyboardType="numeric" maxLength={10} />
            </View>
          </View>

          <Text style={styles.sectionTitle}>Seguridad</Text>
          <View style={styles.inputContainer}>
            <Text style={styles.inputLabel}>Contraseña *</Text>
            <View style={styles.inputWrapper}>
              <Lock size={20} color="#6B7280" strokeWidth={2} />
              <TextInput style={styles.textInput} value={formData.password} onChangeText={(text) => handleInputChange('password', text)} placeholder="Mínimo 6 caracteres" placeholderTextColor="#9CA3AF" secureTextEntry={!showPassword} autoCapitalize="none" />
              <TouchableOpacity onPress={() => setShowPassword(!showPassword)} style={styles.eyeButton}>
                {showPassword ? <EyeOff size={20} color="#6B7280" strokeWidth={2} /> : <Eye size={20} color="#6B7280" strokeWidth={2} />}
              </TouchableOpacity>
            </View>
          </View>
          <View style={styles.inputContainer}>
            <Text style={styles.inputLabel}>Confirmar contraseña *</Text>
            <View style={styles.inputWrapper}>
              <Lock size={20} color="#6B7280" strokeWidth={2} />
              <TextInput style={styles.textInput} value={formData.confirmPassword} onChangeText={(text) => handleInputChange('confirmPassword', text)} placeholder="Repita su contraseña" placeholderTextColor="#9CA3AF" secureTextEntry={!showConfirmPassword} autoCapitalize="none" />
              <TouchableOpacity onPress={() => setShowConfirmPassword(!showConfirmPassword)} style={styles.eyeButton}>
                {showConfirmPassword ? <EyeOff size={20} color="#6B7280" strokeWidth={2} /> : <Eye size={20} color="#6B7280" strokeWidth={2} />}
              </TouchableOpacity>
            </View>
          </View>

          <TouchableOpacity style={[styles.registerButton, loading && styles.registerButtonDisabled]} onPress={handleRegister} disabled={loading}>
            <Text style={styles.registerButtonText}>{loading ? 'Creando cuenta...' : 'Crear mi cuenta'}</Text>
          </TouchableOpacity>
          
          <View style={styles.loginContainer}>
            <Text style={styles.loginText}>
              ¿Ya tiene una cuenta?{' '}
              <Text style={styles.loginLinkText} onPress={() => router.push('/(auth)/login')}>
                Iniciar sesión
              </Text>
            </Text>
          </View>
        </View>

        <View style={styles.privacyContainer}>
          <Text style={styles.privacyText}>Al crear una cuenta, acepta nuestros términos de servicio y política de privacidad. Sus datos médicos están protegidos y encriptados.</Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAFC', },
  scrollView: { flex: 1, },
  scrollContent: { flexGrow: 1, paddingHorizontal: 24, paddingVertical: 32, },
  header: { alignItems: 'center', marginBottom: 32, position: 'relative', },
  backButton: { position: 'absolute', left: 0, top: 0, width: 48, height: 48, borderRadius: 24, backgroundColor: '#FFFFFF', alignItems: 'center', justifyContent: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1,  shadowRadius: 4,  elevation: 4, },
  logoContainer: {  width: 80,  height: 80,   borderRadius: 40,   backgroundColor: '#EBF4FF',   alignItems: 'center',   justifyContent: 'center',   marginBottom: 20,   marginTop: 20, },
  title: {   fontSize: 32,   fontWeight: '700',  color: '#1F2937',   marginBottom: 8, },
  subtitle: {   fontSize: 18,   color: '#6B7280',   textAlign: 'center', },
  formContainer: {  backgroundColor: '#FFFFFF',   borderRadius: 20,   padding: 28,  marginBottom: 24,   shadowColor: '#000',  shadowOffset: { width: 0, height: 4 },  shadowOpacity: 0.1,   shadowRadius: 12,   elevation: 8, },
  sectionTitle: {   fontSize: 20,   fontWeight: '700',  color: '#1F2937',   marginBottom: 20,   marginTop: 8, },
  inputRow: {   flexDirection: 'row',   gap: 16, },
  inputContainer: {   marginBottom: 20, },
  halfWidth: {  flex: 1, },
  inputLabel: {   fontSize: 16,   fontWeight: '600',  color: '#374151',   marginBottom: 8, },
  inputWrapper: {   flexDirection: 'row',   alignItems: 'center',   borderWidth: 2,   borderColor: '#D1D5DB',   borderRadius: 12,   paddingHorizontal: 16,  backgroundColor: '#FFFFFF',   gap: 12, },
  phonePrefix: { fontSize: 16, color: '#1F2937', paddingVertical: 14, },
  phoneInput: { flex: 1, fontSize: 16, color: '#1F2937', minHeight: 20, paddingVertical: 14, },
  textInput: {  flex: 1,  fontSize: 16,   color: '#1F2937',   minHeight: 20, paddingVertical: 14 },
  eyeButton: {  padding: 4, },
  registerButton: {   backgroundColor: '#16A34A',   borderRadius: 16,   paddingVertical: 18,  alignItems: 'center',   marginTop: 12,  marginBottom: 24, },
  registerButtonDisabled: {   backgroundColor: '#9CA3AF', },
  registerButtonText: {   fontSize: 18,   fontWeight: '700',  color: '#FFFFFF', },
  loginContainer: {   flexDirection: 'row',   justifyContent: 'center',   alignItems: 'center',   gap: 8, },
  loginText: {  fontSize: 16,   color: '#6B7280', },
  loginLinkText: {  fontSize: 16,   color: '#2563EB',   fontWeight: '600', },
  privacyContainer: {   backgroundColor: '#F0F9FF',   borderRadius: 12,   padding: 20,  borderWidth: 1,   borderColor: '#BAE6FD', },
  privacyText: {  fontSize: 14,   color: '#0369A1',   textAlign: 'center',  lineHeight: 20, },
});