import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, ScrollView, Alert, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { User, Mail, Lock, Phone, Calendar, Eye, EyeOff, Pill, ArrowLeft } from 'lucide-react-native';
import * as apiService from '../../services/apiService';

/**
 * Parsea una fecha de DD/MM/AAAA a un objeto Date.
 * Retorna null si el formato es inválido o la fecha no es real.
 * @param dateStr String en formato "DD/MM/AAAA"
 */
const parseDateString = (dateStr: string): Date | null => {
  if (!dateStr || dateStr.length !== 10) {
    return null;
  }
  const parts = dateStr.split('/');
  if (parts.length !== 3) {
    return null;
  }
  
  const [day, month, year] = parts.map(Number);
  
  // Validar rangos básicos
  if (isNaN(day) || isNaN(month) || isNaN(year) || year < 1900) {
      return null;
  }

  // Los meses en JS son 0-indexados (0=Enero, 11=Diciembre)
  const date = new Date(year, month - 1, day);
  
  // Verificar si la fecha es válida (ej. 31/02/2023 no es válida)
  // Si JS "corrige" la fecha (ej. 31/02 se vuelve 03/03), los valores no coincidirán.
  if (date.getFullYear() === year && date.getMonth() === month - 1 && date.getDate() === day) {
    return date;
  }
  
  return null;
};


export default function RegistroScreen() {
  const [formData, setFormData] = useState({
    nombre: '',
    apellido: '',
    email: '',
    telefono: '',
    fechaNacimiento: '', // Se mantiene como string DD/MM/AAAA para el input
    password: '',
    confirmPassword: ''
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [role, setRole] = useState<'PATIENT' | 'CAREGIVER'>('PATIENT');

  const handleInputChange = (field: keyof typeof formData, value: string) => {
    if (field === 'telefono') {
      const cleaned = value.replace(/[^0-9]/g, ''); // Solo números
      const truncated = cleaned.slice(0, 8);
      let formatted = truncated;
      if (truncated.length > 4) {
        formatted = `${truncated.slice(0, 4)} ${truncated.slice(4)}`;
      }
      setFormData(prev => ({ ...prev, [field]: formatted }));
    } else if (field === 'fechaNacimiento') {
      // Corrección: Regex de [^0-g] a [^0-9]
      const cleaned = value.replace(/[^0-9]/g, '');
      let formatted = cleaned;
      
      if (cleaned.length > 2) {
        formatted = `${cleaned.slice(0, 2)}/${cleaned.slice(2)}`;
      }
      if (cleaned.length > 4) {
        formatted = `${cleaned.slice(0, 2)}/${cleaned.slice(2, 4)}/${cleaned.slice(4)}`;
      }
      // Limitar a 10 caracteres (DD/MM/AAAA)
      setFormData(prev => ({ ...prev, [field]: formatted.slice(0, 10) }));
    }
    else {
      setFormData(prev => ({ ...prev, [field]: value }));
    }
  };

  const validateForm = () => {
    // Añadimos fechaNacimiento a la desestructuración
    const { nombre, apellido, email, telefono, password, confirmPassword, fechaNacimiento } = formData;
    
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
    
    // --- NUEVA VALIDACIÓN DE FECHA ---
    // La fecha es opcional (no tiene *), pero si se ingresa, debe ser válida.
    if (fechaNacimiento) {
      if (fechaNacimiento.length !== 10) {
        Alert.alert('Error de formato', 'La fecha de nacimiento debe tener el formato DD/MM/AAAA');
        return false;
      }
      
      const parsedDate = parseDateString(fechaNacimiento);
      
      if (!parsedDate) {
        Alert.alert('Error de fecha', 'La fecha de nacimiento no es válida (ej. 31/02/2023). Por favor, revise el día, mes y año.');
        return false;
      }

      const today = new Date();
      const minDate = new Date();
      // Permitimos un máximo de 120 años de edad
      minDate.setFullYear(today.getFullYear() - 120); 

      if (parsedDate > today) {
        Alert.alert('Error de fecha', 'La fecha de nacimiento no puede ser en el futuro.');
        return false;
      }
      if (parsedDate < minDate) {
        Alert.alert('Error de fecha', 'La fecha de nacimiento no es válida (demasiado antigua).');
        return false;
      }
    }
    // --- FIN VALIDACIÓN DE FECHA ---

    return true;
  };

  const handleRegister = async () => {
    if (!validateForm()) return;
    
    setLoading(true);

    // --- CORRECCIÓN DE FECHA ---
    // Convertir la fecha del formato DD/MM/AAAA a un objeto Date válido
    const parsedDate = parseDateString(formData.fechaNacimiento);

    try {
      const payload: Omit<apiService.UserRegistrationPayload, 'password'> & { password?: string; role: string } = {
        firstName: formData.nombre,
        lastName: formData.apellido,
        email: formData.email.toLowerCase().trim(),
        phone: `+569${formData.telefono.replace(/\s/g, '')}`,
        
        // Enviar la fecha en formato ISO si es válida, de lo contrario enviar undefined
        // para que Prisma no intente guardar un string inválido.
        birthDate: parsedDate ? parsedDate.toISOString() : undefined,
        
        password: formData.password,
        role: role,
      };

      const newUser = await apiService.registerUser(payload as apiService.UserRegistrationPayload);
      
      if (newUser && newUser.id) {
        Alert.alert(
          'Registro exitoso',
          'Su cuenta ha sido creada correctamente. Ahora inicie sesión.',
          [{ text: 'Ir a Login', onPress: () => router.replace('/(auth)/login') }]
        );
      } else {
        Alert.alert('Error de registro', 'No se pudo crear la cuenta.');
      }
    } catch (error: any) {
      console.error('Error en handleRegister:', error);
      // Intentar dar un mensaje más específico si el backend lo envía
      const apiError = error.response?.data?.error || error.message;
      Alert.alert('Error', `No se pudo crear la cuenta. ${apiError}`);
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
              <ArrowLeft size={24} color="#2563EB" strokeWidth={2.5} />
          </TouchableOpacity>
          <View style={styles.logoContainer}>
            <Pill size={48} color="#2563EB" strokeWidth={2} />
          </View>
          <Text style={styles.title}>Crear Cuenta</Text>
          <Text style={styles.subtitle}>Complete sus datos para comenzar</Text>
        </View>

        <View style={styles.formContainer}>
          <Text style={styles.sectionTitle}>Tipo de Cuenta</Text>
          <View style={styles.roleSelectorContainer}>
            <TouchableOpacity 
              style={[styles.roleButton, role === 'PATIENT' && styles.roleButtonActive]}
              onPress={() => setRole('PATIENT')}
            >
              <Text style={[styles.roleButtonText, role === 'PATIENT' && styles.roleButtonTextActive]}>Soy Paciente</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={[styles.roleButton, role === 'CAREGIVER' && styles.roleButtonActive]}
              onPress={() => setRole('CAREGIVER')}
            >
              <Text style={[styles.roleButtonText, role === 'CAREGIVER' && styles.roleButtonTextActive]}>Soy Cuidador</Text>
            </TouchableOpacity>
          </View>

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
             {/* Sigue siendo opcional, por eso no tiene * */}
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
               {/* Corrección: Mostrar EyeOff cuando showPassword es true */}
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
               {/* Corrección: Mostrar EyeOff cuando showConfirmPassword es true */}
               <TouchableOpacity onPress={() => setShowConfirmPassword(!showConfirmPassword)} style={styles.eyeButton}>
                {showConfirmPassword ? <EyeOff size={20} color="#6B7280" strokeWidth={2} /> : <Eye size={20} color="#6B7280" strokeWidth={2} />}
               </TouchableOpacity>
             </View>
           </View>

          <TouchableOpacity style={[styles.registerButton, loading && styles.registerButtonDisabled]} onPress={handleRegister} disabled={loading}>
            {loading ? <ActivityIndicator color="#FFFFFF"/> : <Text style={styles.registerButtonText}>Crear mi cuenta</Text>}
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
      </ScrollView>
    </SafeAreaView>
  );
}

// Los estilos permanecen sin cambios
const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#F8FAFC' },
    scrollView: { flex: 1 },
    scrollContent: { flexGrow: 1, paddingHorizontal: 24, paddingVertical: 32 },
    header: { alignItems: 'center', marginBottom: 32, position: 'relative' },
    backButton: { 
      position: 'absolute', 
      left: 0, 
      top: 10, // Ajustado para centrar mejor con el logo
      zIndex: 10,
      // Estilos de botón de ícono
      width: 44, 
      height: 44, 
      borderRadius: 22, 
      backgroundColor: '#FFFFFF', 
      alignItems: 'center', 
      justifyContent: 'center', 
      elevation: 4,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 4,
    },
    logoContainer: { width: 80, height: 80, borderRadius: 40, backgroundColor: '#EBF4FF', alignItems: 'center', justifyContent: 'center', marginBottom: 20, marginTop: 20 },
    title: { fontSize: 32, fontWeight: '700', color: '#1F2937', marginBottom: 8 },
    subtitle: { fontSize: 18, color: '#6B7280', textAlign: 'center' },
    formContainer: { 
      backgroundColor: '#FFFFFF', 
      borderRadius: 20, 
      padding: 28, 
      marginBottom: 24, 
      elevation: 8,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.05,
      shadowRadius: 15,
    },
    sectionTitle: { fontSize: 20, fontWeight: '700', color: '#1F2937', marginBottom: 20, marginTop: 8 },
    inputRow: { flexDirection: 'row', gap: 16 },
    inputContainer: { marginBottom: 20 },
    halfWidth: { flex: 1 },
    inputLabel: { fontSize: 16, fontWeight: '600', color: '#374151', marginBottom: 8 },
    inputWrapper: { 
      flexDirection: 'row', 
      alignItems: 'center', 
      borderWidth: 1, // Reducido para un look más limpio
      borderColor: '#D1D5DB', 
      borderRadius: 12, 
      paddingHorizontal: 16, 
      backgroundColor: '#F9FAFB', // Ligero fondo para el input
      gap: 12 
    },
    // Podríamos añadir un estado :focus visualmente si quisiéramos, pero requiere más lógica
    phonePrefix: { fontSize: 16, color: '#1F2937', paddingVertical: 14, fontWeight: '500' },
    phoneInput: { flex: 1, fontSize: 16, color: '#1F2937', minHeight: 20, paddingVertical: 14, letterSpacing: 0.5 },
    textInput: { flex: 1, fontSize: 16, color: '#1F2937', minHeight: 20, paddingVertical: 14 },
    eyeButton: { padding: 4 }, // Área de toque
    registerButton: { 
      backgroundColor: '#16A34A', // Verde de éxito
      borderRadius: 16, 
      paddingVertical: 18, 
      alignItems: 'center', 
      marginTop: 12, 
      marginBottom: 24,
      elevation: 3,
      shadowColor: '#16A34A',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.3,
      shadowRadius: 5,
    },
    registerButtonDisabled: { backgroundColor: '#9CA3AF', elevation: 0 },
    registerButtonText: { fontSize: 18, fontWeight: '700', color: '#FFFFFF' },
    loginContainer: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 8 },
    loginText: { fontSize: 16, color: '#6B7280' },
    loginLinkText: { fontSize: 16, color: '#2563EB', fontWeight: '600' },
    roleSelectorContainer: { flexDirection: 'row', marginBottom: 24, borderWidth: 1, borderColor: '#D1D5DB', borderRadius: 12, overflow: 'hidden' },
    roleButton: { flex: 1, padding: 16, alignItems: 'center', backgroundColor: '#F9FAFB' },
    roleButtonActive: { backgroundColor: '#2563EB' },
    roleButtonText: { fontSize: 16, fontWeight: '600', color: '#374151' },
    roleButtonTextActive: { color: '#FFFFFF' },
});