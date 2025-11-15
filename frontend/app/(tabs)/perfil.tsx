// frontend/app/tabs/perfil.tsx (CORREGIDO)

import { Link, useFocusEffect } from 'expo-router';
import { 
  Camera, 
  Pencil as Edit,
  Save, 
  User, 
  LogOut, 
} from 'lucide-react-native';
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
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../../context/AuthContext';
import { usePatient } from '../../context/PatientContext';
import * as apiService from '../../services/apiService';
import * as ImagePicker from 'expo-image-picker'; 
import { API_URL } from '../../constants/Config';

// --- ¡NUEVA FUNCIÓN HELPER! ---
/**
 * Formatea un string de fecha ISO (o null) a un formato DD/MM/AAAA.
 * @param isoString El string de fecha de la base de datos (ej. "2002-07-20T04:00:00.000Z")
 * @returns Un string en formato "DD/MM/AAAA" o un string vacío.
 */
const formatISODateToDMY = (isoString: string | null | undefined): string => {
  if (!isoString) return '';
  try {
    // new Date() puede parsear strings ISO directamente.
    // Esto convierte el string UTC a un objeto Date en la zona horaria local del teléfono.
    const date = new Date(isoString); 
    
    // Comprobar si la fecha es válida
    if (isNaN(date.getTime())) {
      console.warn("Fecha ISO inválida recibida:", isoString);
      return ''; 
    }

    // Usamos los métodos locales (getDate, getMonth) porque el string ISO
    // fue creado a partir de una fecha local en primer lugar (en registro.tsx).
    // Esto revierte la conversión a UTC y nos da la fecha original.
    const day = date.getDate().toString().padStart(2, '0');
    const month = (date.getMonth() + 1).toString().padStart(2, '0'); // +1 porque getMonth() es 0-indexado
    const year = date.getFullYear();

    return `${day}/${month}/${year}`;
  } catch (error) {
    console.error("Error al formatear la fecha ISO:", isoString, error);
    return ''; // Retorna vacío en caso de error
  }
};


type UserProfileState = {
  nombre: string;
  apellido: string;
  email: string | null;
  telefono: string | null;
  fechaNacimiento: string | null; // <-- Se mantiene como string, pero ahora será DD/MM/AAAA
  direccion: string | null;
  contactoEmergencia: string | null;
  telefonoEmergencia: string | null;
  condicionesMedicas: string | null;
  alergias: string | null;
};

export default function PerfilScreen() {
  const { user, setUser } = useAuth();
  const { selectedPatient, clearSelectedPatient } = usePatient();
  const [editando, setEditando] = useState(false);
  const [perfil, setPerfil] = useState<UserProfileState | null>(null);
  const [perfilTemporal, setPerfilTemporal] = useState<Partial<UserProfileState> | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [imageUri, setImageUri] = useState<string | null>(null); 

  const isCaregiverView = user?.role === 'CAREGIVER' && selectedPatient;
  const profileTitle = isCaregiverView ? `Perfil de ${selectedPatient?.firstName}` : "Mi Perfil";

  useFocusEffect(
    useCallback(() => {
      const cargarPerfil = async () => {
        const profileIdToLoad = isCaregiverView ? selectedPatient?.id : user?.id;

        if (!profileIdToLoad) {
          setIsLoading(false);
          return;
        }

        setIsLoading(true);
        try {
          const perfilData = await apiService.fetchUserProfile(profileIdToLoad);
          if (perfilData) {
            const adaptedProfile: UserProfileState = {
              nombre: perfilData.firstName,
              apellido: perfilData.lastName,
              email: perfilData.email,
              telefono: perfilData.phone,
              
              // --- ¡CORREGIDO AQUÍ! ---
              // Usamos la función helper para formatear la fecha antes de guardarla en el estado
              fechaNacimiento: formatISODateToDMY(perfilData.birthDate),
              
              direccion: perfilData.address,
              contactoEmergencia: perfilData.emergencyContact,
              telefonoEmergencia: perfilData.emergencyPhone,
              condicionesMedicas: perfilData.medicalConditions,
              alergias: perfilData.allergies,
            };
            setPerfil(adaptedProfile);
            setPerfilTemporal(adaptedProfile);
            let imageUrl = perfilData.profileImageUrl || null;
            console.log('[Profile Load] profileImageUrl from server:', imageUrl);
            
            // Convert relative path to absolute URL
            // If it's already a full URL, use as-is; if relative, prepend API_URL
            if (imageUrl) {
              if (!imageUrl.startsWith('http')) {
                // Relative path: prepend API_URL
                imageUrl = `${API_URL}/${imageUrl}`;
                console.log('[Profile Load] Converted relative path to absolute URL:', imageUrl);
              }
            }
            
            setImageUri(imageUrl);
          }
        } catch (error) {
          console.error("Error al cargar el perfil:", error);
          Alert.alert("Error", "No se pudo cargar el perfil desde el servidor.");
        } finally {
          setIsLoading(false);
        }
      };
      cargarPerfil();
    }, [user, selectedPatient])
  );
  
  // ... (pickImageFromGallery, takePhotoWithCamera, handleChoosePhoto se mantienen iguales) ...
  const pickImageFromGallery = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permiso denegado', 'Se necesitan permisos para acceder a la galería.');
      return;
    }

    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1], 
      quality: 0.5,
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
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.5,
    });

    if (!result.canceled) {
      setImageUri(result.assets[0].uri);
    }
  };

  const handleChoosePhoto = () => {
    Alert.alert(
      "Cambiar Foto de Perfil",
      "Selecciona una opción:",
      [
        { text: "Tomar Foto", onPress: takePhotoWithCamera },
        { text: "Elegir de la Galería", onPress: pickImageFromGallery },
        { text: "Cancelar", style: "cancel" }
      ]
    );
  };

  const guardarPerfil = async () => {
    if (!perfilTemporal) return;
    const profileIdToSave = isCaregiverView ? selectedPatient?.id : user?.id;
    if (!profileIdToSave) {
      Alert.alert('Error', 'No se pudo identificar el perfil a guardar.');
      return;
    }

    // Validaciones básicas
    if (!perfilTemporal.nombre || !perfilTemporal.apellido) {
      Alert.alert('Faltan datos', 'Por favor completa nombre y apellido.');
      return;
    }

    setIsLoading(true);
    try {
      // If there's a new local image selected, upload it first
      let uploadedProfileImageUrl: string | undefined = undefined;
      if (imageUri && !imageUri.startsWith('http')) {
        try {
          const form = new FormData();
          // @ts-ignore - React Native FormData file
          form.append('profileImage', { uri: imageUri, name: 'profile.jpg', type: 'image/jpeg' });

          const uploadResp = await fetch(`${API_URL}/patients/${profileIdToSave}/profile-image`, {
            method: 'POST',
            // Let fetch/set browser handle Content-Type including boundary
            body: form as any,
          });

          if (!uploadResp.ok) {
            const txt = await uploadResp.text().catch(() => '');
            console.warn('Upload failed:', uploadResp.status, txt);
            // Don't throw - just log and continue without image
            console.warn('Continuaremos sin guardar la imagen, pero el perfil se actualizará.');
          } else {
            const uploadedUser = await uploadResp.json();
            console.log('[Profile Image] Uploaded. Response:', uploadedUser);
            uploadedProfileImageUrl = uploadedUser.profileImageUrl || undefined;
            console.log('[Profile Image] profileImageUrl from response:', uploadedProfileImageUrl);
            
            // Convert relative path to absolute URL for display
            if (uploadedProfileImageUrl && !uploadedProfileImageUrl.startsWith('http')) {
              uploadedProfileImageUrl = `${API_URL}/${uploadedProfileImageUrl}`;
              console.log('[Profile Image] Converted to absolute URL:', uploadedProfileImageUrl);
            }
            
            // update local imageUri to the returned public URL
            if (uploadedProfileImageUrl) setImageUri(uploadedProfileImageUrl);
          }
        } catch (err) {
          console.error('Error uploading image:', err);
          console.warn('La foto no se pudo subir, pero continuaremos guardando el perfil sin cambios de imagen.');
          // Don't throw - just log and continue
        }
      }

      // Convertir fecha DD/MM/AAAA a ISO (si se ingresó)
      const parseDateString = (dateStr: string): Date | null => {
        if (!dateStr || dateStr.length !== 10) return null;
        const parts = dateStr.split('/');
        if (parts.length !== 3) return null;
        const [day, month, year] = parts.map(Number);
        if (isNaN(day) || isNaN(month) || isNaN(year)) return null;
        const date = new Date(year, month - 1, day);
        if (date.getFullYear() === year && date.getMonth() === month - 1 && date.getDate() === day) return date;
        return null;
      };

      const birthDateIso = perfilTemporal.fechaNacimiento
        ? ((): string | undefined => {
            const parsed = parseDateString(perfilTemporal.fechaNacimiento as string);
            return parsed ? parsed.toISOString() : undefined;
          })()
        : undefined;

      const payload: Partial<apiService.UserProfile> = {
        firstName: perfilTemporal.nombre || undefined,
        lastName: perfilTemporal.apellido || undefined,
        email: perfilTemporal.email || undefined,
        phone: perfilTemporal.telefono || undefined,
        birthDate: birthDateIso || undefined,
        address: perfilTemporal.direccion || undefined,
        emergencyContact: perfilTemporal.contactoEmergencia || undefined,
        emergencyPhone: perfilTemporal.telefonoEmergencia || undefined,
        medicalConditions: perfilTemporal.condicionesMedicas || undefined,
        allergies: perfilTemporal.alergias || undefined,
        profileImageUrl: uploadedProfileImageUrl || undefined,
      };

      const updated = await apiService.updateUserProfile(profileIdToSave!, payload);
      // Convertir fecha ISO a DD/MM/AAAA para mostrar
      const adapted: UserProfileState = {
        nombre: updated.firstName || '',
        apellido: updated.lastName || '',
        email: updated.email || null,
        telefono: updated.phone || null,
        fechaNacimiento: formatISODateToDMY(updated.birthDate || null),
        direccion: updated.address || null,
        contactoEmergencia: updated.emergencyContact || null,
        telefonoEmergencia: updated.emergencyPhone || null,
        condicionesMedicas: updated.medicalConditions || null,
        alergias: updated.allergies || null,
      };

      setPerfil(adapted);
      setPerfilTemporal(adapted);
      setEditando(false);

      // Si actualizamos nuestro propio perfil, actualizar contexto
      if (!isCaregiverView) {
        setUser && setUser(updated);
      }

      Alert.alert('¡Listo!', 'Tu perfil se ha actualizado correctamente.');
    } catch (error: any) {
      console.error('Error guardando perfil:', error);
      const msg = error?.message || 'Ocurrió un problema al actualizar el perfil. Intenta de nuevo más tarde.';
      Alert.alert('No se pudo guardar', msg);
    } finally {
      setIsLoading(false);
    }
  };

  const cancelarEdicion = () => {
    setPerfilTemporal(perfil);
    setEditando(false);
  };

  // --- ¡FUNCIÓN ACTUALIZADA! ---
  // Añade la máscara de formato de fecha al editar
  const actualizarCampo = (campo: keyof UserProfileState, valor: string) => {
    if (campo === 'fechaNacimiento') {
      // Reutilizamos la lógica de máscara de 'registro.tsx'
      const cleaned = valor.replace(/[^0-9]/g, '');
      let formatted = cleaned;
      
      if (cleaned.length > 2) {
        formatted = `${cleaned.slice(0, 2)}/${cleaned.slice(2)}`;
      }
      if (cleaned.length > 4) {
        formatted = `${cleaned.slice(0, 2)}/${cleaned.slice(2, 4)}/${cleaned.slice(4)}`;
      }
      const finalValue = formatted.slice(0, 10);
      
      setPerfilTemporal(prev => (prev ? { ...prev, [campo]: finalValue } : null));

    } else {
      // Maneja todos los otros campos de forma normal
      setPerfilTemporal(prev => (prev ? { ...prev, [campo]: valor } : null));
    }
  };


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

  if (isLoading || !perfilTemporal) {
    return (
        <SafeAreaView style={styles.container}>
            <ActivityIndicator size="large" color="#2563EB" style={{ flex: 1 }} />
        </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Cabecera (limpia) */}
      <View style={styles.header}>
        <Text style={styles.title}>{profileTitle}</Text>
        <View style={styles.headerActions}>
          {!isCaregiverView && (!editando ? (
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
          ))}
        </View>
      </View>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        
        {/* Sección de Foto */}
        <View style={styles.profilePhotoSection}>
          <View style={styles.profilePhoto}>
            {imageUri ? (
              <Image source={{ uri: imageUri }} style={styles.profileImage} />
            ) : (
              <User size={48} color="#6B7280" strokeWidth={2} />
            )}
          </View>
          
          {!isCaregiverView && editando && (
            <TouchableOpacity 
              style={styles.cameraButton} 
              onPress={handleChoosePhoto}
            >
              <Camera size={20} color="#FFFFFF" strokeWidth={2} />
            </TouchableOpacity>
          )}
        </View>

        {/* ... (Formulario de Información Personal) ... */}
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
            {/* --- INPUT CORREGIDO --- */}
            {/* Ahora muestra el valor formateado (DD/MM/AAAA) y usa el teclado numérico */}
            <TextInput 
              style={[styles.textInput, !editando && styles.textInputDisabled]} 
              value={perfilTemporal.fechaNacimiento || ''} 
              onChangeText={(text) => actualizarCampo('fechaNacimiento', text)} 
              placeholder="DD/MM/AAAA" 
              editable={editando}
              keyboardType="numeric" 
              maxLength={10} 
            />
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

        {/* ... (Formulario de Contacto de Emergencia) ... */}
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

        {/* ... (Formulario de Información Médica) ... */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Información Médica</Text>
          <View style={styles.inputContainer}>
            <Text style={styles.inputLabel}>Condiciones médicas</Text>
            <TextInput style={[styles.textInput, styles.textArea, !editando && styles.textInputDisabled]} value={perfilTemporal.condicionesMedicas || ''} onChangeText={(text) => actualizarCampo('condicionesMedicas', text)} multiline editable={editando} />
          </View>
          <View style={styles.inputContainer}>
            <Text style={styles.inputLabel}>Alergias</Text>
            <TextInput style={[styles.textInput, styles.textArea, !editando && styles.textInputDisabled]} value={perfilTemporal.alergias || ''} onChangeText={(text) => actualizarCampo('alergias', text)} multiline editable={editando} />
          </View>
        </View>
        
        <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
          <LogOut size={20} color="#DC2626" />
          <Text style={styles.logoutButtonText}>Cerrar Sesión</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

// --- ESTILOS (sin cambios) ---
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAFC' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 20 },
  title: { fontSize: 28, fontWeight: '700', color: '#1F2937' },
  headerActions: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  settingsButton: { padding: 8 }, 
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