import AsyncStorage from '@react-native-async-storage/async-storage';
import { Bell, Camera, CreditCard as Edit, Save, Settings, User } from 'lucide-react-native';
import React, { useEffect, useState } from 'react';
import {
    Alert,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

interface PerfilUsuario {
  nombre: string;
  apellidos: string;
  fechaNacimiento: string;
  telefono: string;
  email: string;
  direccion: string;
  contactoEmergencia: string;
  telefonoEmergencia: string;
  condicionesMedicas: string;
  alergias: string;
}

export default function PerfilScreen() {
  const [editando, setEditando] = useState(false);
  const [perfil, setPerfil] = useState<PerfilUsuario>({
    nombre: '',
    apellidos: '',
    fechaNacimiento: '',
    telefono: '',
    email: '',
    direccion: '',
    contactoEmergencia: '',
    telefonoEmergencia: '',
    condicionesMedicas: '',
    alergias: ''
  });

  const [perfilTemporal, setPerfilTemporal] = useState<PerfilUsuario>(perfil);

  useEffect(() => {
    cargarPerfil();
  }, []);

  const cargarPerfil = async () => {
    try {
      const perfilGuardado = await AsyncStorage.getItem('perfilUsuario');
      if (perfilGuardado) {
        const perfilData = JSON.parse(perfilGuardado);
        setPerfil(perfilData);
        setPerfilTemporal(perfilData);
      }
    } catch (error) {
      console.error('Error al cargar perfil:', error);
    }
  };

  const guardarPerfil = async () => {
    try {
      await AsyncStorage.setItem('perfilUsuario', JSON.stringify(perfilTemporal));
      setPerfil(perfilTemporal);
      setEditando(false);
      Alert.alert('Éxito', 'Perfil guardado correctamente');
    } catch (error) {
      console.error('Error al guardar perfil:', error);
      Alert.alert('Error', 'No se pudo guardar el perfil');
    }
  };

  const cancelarEdicion = () => {
    setPerfilTemporal(perfil);
    setEditando(false);
  };

  const actualizarCampo = (campo: keyof PerfilUsuario, valor: string) => {
    setPerfilTemporal(prev => ({
      ...prev,
      [campo]: valor
    }));
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Mi Perfil</Text>
        <View style={styles.headerActions}>
          <TouchableOpacity style={styles.settingsButton}>
            <Settings size={24} color="#6B7280" strokeWidth={2} />
          </TouchableOpacity>
          {!editando ? (
            <TouchableOpacity 
              style={styles.editButton}
              onPress={() => setEditando(true)}
            >
              <Edit size={24} color="#2563EB" strokeWidth={2} />
            </TouchableOpacity>
          ) : (
            <View style={styles.editActions}>
              <TouchableOpacity 
                style={styles.cancelButton}
                onPress={cancelarEdicion}
              >
                <Text style={styles.cancelButtonText}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={styles.saveButton}
                onPress={guardarPerfil}
              >
                <Save size={20} color="#FFFFFF" strokeWidth={2} />
                <Text style={styles.saveButtonText}>Guardar</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      </View>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Foto de perfil */}
        <View style={styles.profilePhotoSection}>
          <View style={styles.profilePhoto}>
            <User size={48} color="#6B7280" strokeWidth={2} />
          </View>
          <TouchableOpacity style={styles.cameraButton}>
            <Camera size={20} color="#FFFFFF" strokeWidth={2} />
          </TouchableOpacity>
        </View>

        {/* Información personal */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Información Personal</Text>
          
          <View style={styles.inputRow}>
            <View style={[styles.inputContainer, { flex: 1, marginRight: 8 }]}>
              <Text style={styles.inputLabel}>Nombre *</Text>
              <TextInput
                style={[styles.textInput, !editando && styles.textInputDisabled]}
                value={perfilTemporal.nombre}
                onChangeText={(text) => actualizarCampo('nombre', text)}
                placeholder="Ingrese su nombre"
                placeholderTextColor="#9CA3AF"
                editable={editando}
              />
            </View>
            
            <View style={[styles.inputContainer, { flex: 1, marginLeft: 8 }]}>
              <Text style={styles.inputLabel}>Apellidos *</Text>
              <TextInput
                style={[styles.textInput, !editando && styles.textInputDisabled]}
                value={perfilTemporal.apellidos}
                onChangeText={(text) => actualizarCampo('apellidos', text)}
                placeholder="Ingrese sus apellidos"
                placeholderTextColor="#9CA3AF"
                editable={editando}
              />
            </View>
          </View>

          <View style={styles.inputContainer}>
            <Text style={styles.inputLabel}>Fecha de Nacimiento</Text>
            <TextInput
              style={[styles.textInput, !editando && styles.textInputDisabled]}
              value={perfilTemporal.fechaNacimiento}
              onChangeText={(text) => actualizarCampo('fechaNacimiento', text)}
              placeholder="DD/MM/AAAA"
              placeholderTextColor="#9CA3AF"
              editable={editando}
            />
          </View>

          <View style={styles.inputContainer}>
            <Text style={styles.inputLabel}>Teléfono</Text>
            <TextInput
              style={[styles.textInput, !editando && styles.textInputDisabled]}
              value={perfilTemporal.telefono}
              onChangeText={(text) => actualizarCampo('telefono', text)}
              placeholder="+34 612 345 678"
              placeholderTextColor="#9CA3AF"
              keyboardType="phone-pad"
              editable={editando}
            />
          </View>

          <View style={styles.inputContainer}>
            <Text style={styles.inputLabel}>Email</Text>
            <TextInput
              style={[styles.textInput, !editando && styles.textInputDisabled]}
              value={perfilTemporal.email}
              onChangeText={(text) => actualizarCampo('email', text)}
              placeholder="email@ejemplo.com"
              placeholderTextColor="#9CA3AF"
              keyboardType="email-address"
              editable={editando}
            />
          </View>

          <View style={styles.inputContainer}>
            <Text style={styles.inputLabel}>Dirección</Text>
            <TextInput
              style={[styles.textInput, styles.textArea, !editando && styles.textInputDisabled]}
              value={perfilTemporal.direccion}
              onChangeText={(text) => actualizarCampo('direccion', text)}
              placeholder="Ingrese su dirección completa"
              placeholderTextColor="#9CA3AF"
              multiline={true}
              numberOfLines={2}
              editable={editando}
            />
          </View>
        </View>

        {/* Contacto de emergencia */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Contacto de Emergencia</Text>
          
          <View style={styles.inputContainer}>
            <Text style={styles.inputLabel}>Nombre del contacto</Text>
            <TextInput
              style={[styles.textInput, !editando && styles.textInputDisabled]}
              value={perfilTemporal.contactoEmergencia}
              onChangeText={(text) => actualizarCampo('contactoEmergencia', text)}
              placeholder="Nombre completo"
              placeholderTextColor="#9CA3AF"
              editable={editando}
            />
          </View>

          <View style={styles.inputContainer}>
            <Text style={styles.inputLabel}>Teléfono de emergencia</Text>
            <TextInput
              style={[styles.textInput, !editando && styles.textInputDisabled]}
              value={perfilTemporal.telefonoEmergencia}
              onChangeText={(text) => actualizarCampo('telefonoEmergencia', text)}
              placeholder="+34 612 345 678"
              placeholderTextColor="#9CA3AF"
              keyboardType="phone-pad"
              editable={editando}
            />
          </View>
        </View>

        {/* Información médica */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Información Médica</Text>
          
          <View style={styles.inputContainer}>
            <Text style={styles.inputLabel}>Condiciones médicas</Text>
            <TextInput
              style={[styles.textInput, styles.textArea, !editando && styles.textInputDisabled]}
              value={perfilTemporal.condicionesMedicas}
              onChangeText={(text) => actualizarCampo('condicionesMedicas', text)}
              placeholder="Diabetes, hipertensión, etc."
              placeholderTextColor="#9CA3AF"
              multiline={true}
              numberOfLines={3}
              editable={editando}
            />
          </View>

          <View style={styles.inputContainer}>
            <Text style={styles.inputLabel}>Alergias</Text>
            <TextInput
              style={[styles.textInput, styles.textArea, !editando && styles.textInputDisabled]}
              value={perfilTemporal.alergias}
              onChangeText={(text) => actualizarCampo('alergias', text)}
              placeholder="Penicilina, mariscos, etc."
              placeholderTextColor="#9CA3AF"
              multiline={true}
              numberOfLines={3}
              editable={editando}
            />
          </View>
        </View>

        {/* Configuración de notificaciones */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Notificaciones</Text>
          
          <TouchableOpacity style={styles.notificationOption}>
            <Bell size={24} color="#2563EB" strokeWidth={2} />
            <View style={styles.notificationInfo}>
              <Text style={styles.notificationTitle}>Recordatorios de medicamentos</Text>
              <Text style={styles.notificationSubtitle}>Recibir alertas cuando sea hora de tomar medicamentos</Text>
            </View>
            <View style={styles.switch}>
              <View style={styles.switchActive} />
            </View>
          </TouchableOpacity>
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
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: '#1F2937',
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  settingsButton: {
    padding: 8,
  },
  editButton: {
    padding: 8,
  },
  editActions: {
    flexDirection: 'row',
    gap: 8,
  },
  cancelButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#D1D5DB',
  },
  cancelButtonText: {
    fontSize: 16,
    color: '#6B7280',
    fontWeight: '600',
  },
  saveButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: '#2563EB',
    gap: 8,
  },
  saveButtonText: {
    fontSize: 16,
    color: '#FFFFFF',
    fontWeight: '600',
  },
  scrollView: {
    flex: 1,
    paddingHorizontal: 20,
  },
  profilePhotoSection: {
    alignItems: 'center',
    marginBottom: 32,
    position: 'relative',
  },
  profilePhoto: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 4,
    borderColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  cameraButton: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#2563EB',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 3,
    borderColor: '#FFFFFF',
  },
  section: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 16,
  },
  inputRow: {
    flexDirection: 'row',
  },
  inputContainer: {
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
  },
  textInput: {
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    color: '#1F2937',
    backgroundColor: '#FFFFFF',
  },
  textInputDisabled: {
    backgroundColor: '#F9FAFB',
    color: '#6B7280',
  },
  textArea: {
    height: 80,
    textAlignVertical: 'top',
  },
  notificationOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    gap: 16,
  },
  notificationInfo: {
    flex: 1,
  },
  notificationTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 4,
  },
  notificationSubtitle: {
    fontSize: 14,
    color: '#6B7280',
  },
  switch: {
    width: 48,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#2563EB',
    padding: 2,
    justifyContent: 'center',
    alignItems: 'flex-end',
  },
  switchActive: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#FFFFFF',
  },
});