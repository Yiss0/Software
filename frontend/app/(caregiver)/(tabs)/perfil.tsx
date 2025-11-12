// frontend/app/caregiver/tabs/perfil.tsx (COMPLETAMENTE RECONSTRUIDO)

import { useFocusEffect } from 'expo-router';
import { 
  Camera, 
  Pencil as Edit,
  Save, 
  User, 
  LogOut, 
} from 'lucide-react-native'; // Se quitaron Mail y Phone
import React, { useState, useCallback } from 'react';
import { 
  Alert, 
  ScrollView, 
  StyleSheet, 
  Text, 
  TextInput, 
  TouchableOpacity, 
  View, 
  ActivityIndicator, 
  Image 
} from 'react-native';
// --- IMPORTACIÓN CORREGIDA ---
import { SafeAreaView } from 'react-native-safe-area-context'; 
import { useAuth } from '../../../context/AuthContext';
import { usePatient } from '../../../context/PatientContext';
import * as apiService from '../../../services/apiService';
import * as ImagePicker from 'expo-image-picker'; 

// El tipo de perfil es el mismo que el del paciente
type UserProfileState = {
  nombre: string;
  apellido: string;
  email: string | null;
  telefono: string | null;
  fechaNacimiento: string | null;
  direccion: string | null;
  contactoEmergencia: string | null;
  telefonoEmergencia: string | null;
  condicionesMedicas: string | null;
  alergias: string | null;
};

export default function CaregiverProfileScreen() {
  const { user, setUser } = useAuth();
  const { clearSelectedPatient } = usePatient(); // Solo para el logout
  const [editando, setEditando] = useState(false);
  const [perfil, setPerfil] = useState<UserProfileState | null>(null);
  const [perfilTemporal, setPerfilTemporal] = useState<Partial<UserProfileState> | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [imageUri, setImageUri] = useState<string | null>(null); 

  const profileTitle = "Mi Perfil"; // Título fijo

  useFocusEffect(
    useCallback(() => {
      const cargarPerfil = async () => {
        // El cuidador solo carga su propio perfil
        const profileIdToLoad = user?.id; 

        if (!profileIdToLoad) {
          setIsLoading(false);
          return;
        }

        setIsLoading(true);
        try {
          // Usamos la misma función de API
          const perfilData = await apiService.fetchUserProfile(profileIdToLoad);
          if (perfilData) {
            const adaptedProfile: UserProfileState = {
              nombre: perfilData.firstName,
              apellido: perfilData.lastName,
              email: perfilData.email,
              telefono: perfilData.phone,
              fechaNacimiento: perfilData.birthDate,
              direccion: perfilData.address,
              contactoEmergencia: perfilData.emergencyContact,
              telefonoEmergencia: perfilData.emergencyPhone,
              condicionesMedicas: perfilData.medicalConditions,
              alergias: perfilData.allergies,
            };
            setPerfil(adaptedProfile);
            setPerfilTemporal(adaptedProfile);
            // setImageUri(perfilData.profileImageUrl || null);
          }
        } catch (error) {
          console.error("Error al cargar el perfil:", error);
          Alert.alert("Error", "No se pudo cargar el perfil desde el servidor.");
        } finally {
          setIsLoading(false);
        }
      };
      cargarPerfil();
    }, [user]) // Dependencia solo de 'user'
  );
  
  // --- Lógica de Foto (copiada del perfil del paciente) ---
  const pickImageFromGallery = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permiso denegado', 'Se necesitan permisos para acceder a la galería.');
      return;
    }
    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true, aspect: [1, 1], quality: 0.5,
    });
    if (!result.canceled) {
      setImageUri(result.assets[0].uri);
    }
  };

  const takePhotoWithCamera = async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permiso denegado', 'Se necesitan permisos para acceder a la cámara.');
      return;
    }
    let result = await ImagePicker.launchCameraAsync({
      allowsEditing: true, aspect: [1, 1], quality: 0.5,
    });
    if (!result.canceled) {
      setImageUri(result.assets[0].uri);
    }
  };

  const handleChoosePhoto = () => {
    Alert.alert(
      "Cambiar Foto de Perfil", "Selecciona una opción:",
      [
        { text: "Tomar Foto", onPress: takePhotoWithCamera },
        { text: "Elegir de la Galería", onPress: pickImageFromGallery },
        { text: "Cancelar", style: "cancel" }
      ]
    );
  };

  // --- Lógica de Edición (copiada del perfil del paciente) ---
  const guardarPerfil = async () => {
    Alert.alert("Función no conectada", "La edición de perfil se conectará en un próximo paso.");
  };

  const cancelarEdicion = () => {
    setPerfilTemporal(perfil);
    setEditando(false);
  };

  const actualizarCampo = (campo: keyof UserProfileState, valor: string) => {
    setPerfilTemporal(prev => (prev ? { ...prev, [campo]: valor } : null));
  };

  const handleLogout = () => {
    Alert.alert(
      "Cerrar Sesión", "¿Estás seguro de que quieres cerrar sesión?",
      [
        { text: "Cancelar", style: "cancel" },
        { text: "Sí, cerrar sesión", onPress: () => {
            setUser(null);
            clearSelectedPatient(); // Limpia cualquier paciente seleccionado
        }}
      ]
    );
  };

  if (isLoading || !perfilTemporal) {
    return (
        <SafeAreaView style={styles.container}>
            <ActivityIndicator size="large" color="#2563EB" style={{ flex: 1 }} />
        </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* --- Cabecera Estándar --- */}
      <View style={styles.header}>
        <Text style={styles.title}>{profileTitle}</Text>
        <View style={styles.headerActions}>
          {/* Lógica de botones de edición */}
          {!editando ? (
            <TouchableOpacity style={styles.editButton} onPress={() => setEditando(true)}>
              <Edit size={24} color="#2563EB" strokeWidth={2} />
            </TouchableOpacity>
          ) : (
            <View style={styles.editActions}>
              <TouchableOpacity style={styles.cancelButton} onPress={cancelarEdicion}>
                <Text style={styles.cancelButtonText}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.saveButton} onPress={guardarPerfil}>
                <Save size={20} color="#FFFFFF" strokeWidth={2} />
                <Text style={styles.saveButtonText}>Guardar</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      </View>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        
        {/* --- Sección de Foto --- */}
        <View style={styles.profilePhotoSection}>
          <View style={styles.profilePhoto}>
            {imageUri ? (
              <Image source={{ uri: imageUri }} style={styles.profileImage} />
            ) : (
              <User size={48} color="#6B7280" strokeWidth={2} />
            )}
          </View>
          {/* El cuidador SÍ puede editar su foto */}
          <TouchableOpacity 
            style={styles.cameraButton} 
            onPress={handleChoosePhoto}
          >
            <Camera size={20} color="#FFFFFF" strokeWidth={2} />
          </TouchableOpacity>
        </View>

        {/* --- Formulario de Perfil (campos relevantes) --- */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Información Personal</Text>
          <View style={styles.inputRow}>
            <View style={[styles.inputContainer, { flex: 1, marginRight: 8 }]}>
              <Text style={styles.inputLabel}>Nombre *</Text>
              <TextInput style={[styles.textInput, !editando && styles.textInputDisabled]} value={perfilTemporal.nombre || ''} onChangeText={(text) => actualizarCampo('nombre', text)} editable={editando} />
            </View>
            <View style={[styles.inputContainer, { flex: 1, marginLeft: 8 }]}>
              <Text style={styles.inputLabel}>Apellido *</Text>
              <TextInput style={[styles.textInput, !editando && styles.textInputDisabled]} value={perfilTemporal.apellido || ''} onChangeText={(text) => actualizarCampo('apellido', text)} editable={editando} />
            </View>
          </View>
          <View style={styles.inputContainer}>
            <Text style={styles.inputLabel}>Fecha de Nacimiento</Text>
            <TextInput style={[styles.textInput, !editando && styles.textInputDisabled]} value={perfilTemporal.fechaNacimiento || ''} onChangeText={(text) => actualizarCampo('fechaNacimiento', text)} placeholder="DD/MM/AAAA" editable={editando} />
          </View>
          <View style={styles.inputContainer}>
            <Text style={styles.inputLabel}>Teléfono</Text>
            <TextInput style={[styles.textInput, !editando && styles.textInputDisabled]} value={perfilTemporal.telefono || ''} onChangeText={(text) => actualizarCampo('telefono', text)} editable={editando} keyboardType="phone-pad" />
          </View>
          <View style={styles.inputContainer}>
            <Text style={styles.inputLabel}>Email</Text>
            <TextInput style={[styles.textInput, !editando && styles.textInputDisabled]} value={perfilTemporal.email || ''} onChangeText={(text) => actualizarCampo('email', text)} editable={editando} keyboardType="email-address" autoCapitalize="none" />
          </View>
          <View style={styles.inputContainer}>
            <Text style={styles.inputLabel}>Dirección</Text>
            <TextInput style={[styles.textInput, styles.textArea, !editando && styles.textInputDisabled]} value={perfilTemporal.direccion || ''} onChangeText={(text) => actualizarCampo('direccion', text)} multiline editable={editando} />
          </View>
        </View>

        {/* Los cuidadores también pueden tener un contacto de emergencia */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Contacto de Emergencia</Text>
          <View style={styles.inputContainer}>
            <Text style={styles.inputLabel}>Nombre del contacto</Text>
            <TextInput style={[styles.textInput, !editando && styles.textInputDisabled]} value={perfilTemporal.contactoEmergencia || ''} onChangeText={(text) => actualizarCampo('contactoEmergencia', text)} editable={editando} />
          </View>
          <View style={styles.inputContainer}>
            <Text style={styles.inputLabel}>Teléfono de emergencia</Text>
            <TextInput style={[styles.textInput, !editando && styles.textInputDisabled]} value={perfilTemporal.telefonoEmergencia || ''} onChangeText={(text) => actualizarCampo('telefonoEmergencia', text)} editable={editando} keyboardType="phone-pad" />
          </View>
        </View>

        {/* El cuidador NO necesita "Condiciones Médicas" o "Alergias" */}
        
        <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
          <LogOut size={20} color="#DC2626" />
          <Text style={styles.logoutButtonText}>Cerrar Sesión</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

// --- ESTILOS (Copiados del perfil del paciente, eliminando 'sync') ---
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAFC' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 20 },
  title: { fontSize: 28, fontWeight: '700', color: '#1F2937' }, // Título alineado a la izquierda
  headerActions: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  editButton: { padding: 8 },
  editActions: { flexDirection: 'row', gap: 8 },
  cancelButton: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 8, borderWidth: 1, borderColor: '#D1D5DB' },
  cancelButtonText: { fontSize: 16, color: '#6B7280', fontWeight: '600' },
  saveButton: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 8, borderRadius: 8, backgroundColor: '#2563EB', gap: 8 },
  saveButtonText: { fontSize: 16, color: '#FFFFFF', fontWeight: '600' },
  scrollView: { flex: 1, paddingHorizontal: 20 },
  profilePhotoSection: { alignItems: 'center', marginBottom: 32, position: 'relative' },
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
    overflow: 'hidden', 
  },
  profileImage: {
    width: '100%',
    height: '100%',
  },
  cameraButton: { position: 'absolute', bottom: 0, right: '35%', width: 40, height: 40, borderRadius: 20, backgroundColor: '#2563EB', alignItems: 'center', justifyContent: 'center', borderWidth: 3, borderColor: '#FFFFFF', },
  section: { backgroundColor: '#FFFFFF', borderRadius: 16, padding: 20, marginBottom: 20, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 8, elevation: 4, },
  sectionTitle: { fontSize: 20, fontWeight: '700', color: '#1F2937', marginBottom: 16 },
  inputRow: { flexDirection: 'row' },
  inputContainer: { marginBottom: 16 },
  inputLabel: { fontSize: 16, fontWeight: '600', color: '#374151', marginBottom: 8 },
  textInput: { borderWidth: 1, borderColor: '#D1D5DB', borderRadius: 12, padding: 16, fontSize: 16, color: '#1F2937', backgroundColor: '#FFFFFF' },
  textInputDisabled: { backgroundColor: '#F9FAFB', color: '#6B7280' },
  textArea: { height: 80, textAlignVertical: 'top' },
  logoutButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', padding: 16, borderRadius: 12, backgroundColor: '#FEE2E2', marginBottom: 20, gap: 8 },
  logoutButtonText: { fontSize: 16, fontWeight: 'bold', color: '#DC2626' },
});