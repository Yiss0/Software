import { CreditCard as Edit, MessageSquare, Phone, Plus, Trash2, Users, X } from 'lucide-react-native';
import React, { useState } from 'react';
import {
    Linking,
    Modal,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

interface Familiar {
  id: string;
  nombre: string;
  relacion: string;
  telefono: string;
  email: string;
  esContactoEmergencia: boolean;
}

export default function FamiliaresScreen() {
  const [familiares, setFamiliares] = useState<Familiar[]>([
    {
      id: '1',
      nombre: 'María González',
      relacion: 'Hija',
      telefono: '+34 612 345 678',
      email: 'maria@email.com',
      esContactoEmergencia: true
    },
    {
      id: '2',
      nombre: 'Dr. Carlos Ruiz',
      relacion: 'Médico de cabecera',
      telefono: '+34 91 234 567',
      email: 'dr.ruiz@clinica.com',
      esContactoEmergencia: true
    }
  ]);

  const [modalVisible, setModalVisible] = useState(false);
  const [nuevoFamiliar, setNuevoFamiliar] = useState({
    nombre: '',
    relacion: '',
    telefono: '',
    email: '',
    esContactoEmergencia: false
  });

  const llamar = (telefono: string) => {
    Linking.openURL(`tel:${telefono}`);
  };

  const enviarMensaje = (telefono: string) => {
    Linking.openURL(`sms:${telefono}`);
  };

  const agregarFamiliar = () => {
    if (nuevoFamiliar.nombre && nuevoFamiliar.telefono) {
      const nuevo: Familiar = {
        id: Date.now().toString(),
        ...nuevoFamiliar
      };
      setFamiliares([...familiares, nuevo]);
      setNuevoFamiliar({
        nombre: '',
        relacion: '',
        telefono: '',
        email: '',
        esContactoEmergencia: false
      });
      setModalVisible(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Familiares y Cuidadores</Text>
        <TouchableOpacity 
          style={styles.addButton}
          onPress={() => setModalVisible(true)}
        >
          <Plus size={24} color="#FFFFFF" strokeWidth={2} />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Contactos de emergencia */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Contactos de Emergencia</Text>
          {familiares
            .filter(f => f.esContactoEmergencia)
            .map((familiar) => (
              <View key={familiar.id} style={[styles.contactCard, styles.emergencyCard]}>
                <View style={styles.contactHeader}>
                  <View style={styles.contactIcon}>
                    <Users size={28} color="#DC2626" strokeWidth={2} />
                  </View>
                  <View style={styles.contactInfo}>
                    <Text style={styles.contactName}>{familiar.nombre}</Text>
                    <Text style={styles.contactRelation}>{familiar.relacion}</Text>
                    <Text style={styles.contactPhone}>{familiar.telefono}</Text>
                  </View>
                </View>
                
                <View style={styles.contactActions}>
                  <TouchableOpacity 
                    style={[styles.actionButton, styles.callButton]}
                    onPress={() => llamar(familiar.telefono)}
                  >
                    <Phone size={20} color="#FFFFFF" strokeWidth={2} />
                    <Text style={styles.callButtonText}>Llamar</Text>
                  </TouchableOpacity>
                  
                  <TouchableOpacity 
                    style={[styles.actionButton, styles.messageButton]}
                    onPress={() => enviarMensaje(familiar.telefono)}
                  >
                    <MessageSquare size={20} color="#FFFFFF" strokeWidth={2} />
                    <Text style={styles.messageButtonText}>Mensaje</Text>
                  </TouchableOpacity>
                </View>
              </View>
            ))}
        </View>

        {/* Otros contactos */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Otros Contactos</Text>
          {familiares
            .filter(f => !f.esContactoEmergencia)
            .map((familiar) => (
              <View key={familiar.id} style={styles.contactCard}>
                <View style={styles.contactHeader}>
                  <View style={styles.contactIcon}>
                    <Users size={28} color="#2563EB" strokeWidth={2} />
                  </View>
                  <View style={styles.contactInfo}>
                    <Text style={styles.contactName}>{familiar.nombre}</Text>
                    <Text style={styles.contactRelation}>{familiar.relacion}</Text>
                    <Text style={styles.contactPhone}>{familiar.telefono}</Text>
                  </View>
                  <View style={styles.contactEditActions}>
                    <TouchableOpacity style={styles.editIconButton}>
                      <Edit size={20} color="#6B7280" strokeWidth={2} />
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.deleteIconButton}>
                      <Trash2 size={20} color="#DC2626" strokeWidth={2} />
                    </TouchableOpacity>
                  </View>
                </View>
                
                <View style={styles.contactActions}>
                  <TouchableOpacity 
                    style={[styles.actionButton, styles.callButton]}
                    onPress={() => llamar(familiar.telefono)}
                  >
                    <Phone size={20} color="#FFFFFF" strokeWidth={2} />
                    <Text style={styles.callButtonText}>Llamar</Text>
                  </TouchableOpacity>
                  
                  <TouchableOpacity 
                    style={[styles.actionButton, styles.messageButton]}
                    onPress={() => enviarMensaje(familiar.telefono)}
                  >
                    <MessageSquare size={20} color="#FFFFFF" strokeWidth={2} />
                    <Text style={styles.messageButtonText}>Mensaje</Text>
                  </TouchableOpacity>
                </View>
              </View>
            ))}
        </View>
      </ScrollView>

      {/* Modal para agregar familiar */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Nuevo Contacto</Text>
              <TouchableOpacity 
                onPress={() => setModalVisible(false)}
                style={styles.closeButton}
              >
                <X size={24} color="#6B7280" strokeWidth={2} />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalBody}>
              <View style={styles.inputContainer}>
                <Text style={styles.inputLabel}>Nombre completo *</Text>
                <TextInput
                  style={styles.textInput}
                  value={nuevoFamiliar.nombre}
                  onChangeText={(text) => setNuevoFamiliar({...nuevoFamiliar, nombre: text})}
                  placeholder="Ej: María González"
                  placeholderTextColor="#9CA3AF"
                />
              </View>

              <View style={styles.inputContainer}>
                <Text style={styles.inputLabel}>Relación</Text>
                <TextInput
                  style={styles.textInput}
                  value={nuevoFamiliar.relacion}
                  onChangeText={(text) => setNuevoFamiliar({...nuevoFamiliar, relacion: text})}
                  placeholder="Ej: Hija, Médico, Cuidador"
                  placeholderTextColor="#9CA3AF"
                />
              </View>

              <View style={styles.inputContainer}>
                <Text style={styles.inputLabel}>Teléfono *</Text>
                <TextInput
                  style={styles.textInput}
                  value={nuevoFamiliar.telefono}
                  onChangeText={(text) => setNuevoFamiliar({...nuevoFamiliar, telefono: text})}
                  placeholder="+34 612 345 678"
                  placeholderTextColor="#9CA3AF"
                  keyboardType="phone-pad"
                />
              </View>

              <View style={styles.inputContainer}>
                <Text style={styles.inputLabel}>Email</Text>
                <TextInput
                  style={styles.textInput}
                  value={nuevoFamiliar.email}
                  onChangeText={(text) => setNuevoFamiliar({...nuevoFamiliar, email: text})}
                  placeholder="email@ejemplo.com"
                  placeholderTextColor="#9CA3AF"
                  keyboardType="email-address"
                />
              </View>

              <TouchableOpacity 
                style={styles.emergencyToggle}
                onPress={() => setNuevoFamiliar({
                  ...nuevoFamiliar, 
                  esContactoEmergencia: !nuevoFamiliar.esContactoEmergencia
                })}
              >
                <View style={[
                  styles.checkbox, 
                  nuevoFamiliar.esContactoEmergencia && styles.checkboxChecked
                ]}>
                  {nuevoFamiliar.esContactoEmergencia && (
                    <Text style={styles.checkmark}>✓</Text>
                  )}
                </View>
                <Text style={styles.emergencyLabel}>
                  Contacto de emergencia
                </Text>
              </TouchableOpacity>
            </ScrollView>

            <View style={styles.modalFooter}>
              <TouchableOpacity 
                style={styles.cancelButton}
                onPress={() => setModalVisible(false)}
              >
                <Text style={styles.cancelButtonText}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={styles.saveButton}
                onPress={agregarFamiliar}
              >
                <Text style={styles.saveButtonText}>Guardar</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
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
  addButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#2563EB',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
  scrollView: {
    flex: 1,
    paddingHorizontal: 20,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 16,
  },
  contactCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  emergencyCard: {
    borderLeftWidth: 4,
    borderLeftColor: '#DC2626',
  },
  contactHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  contactIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#FEF2F2',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  contactInfo: {
    flex: 1,
  },
  contactName: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 2,
  },
  contactRelation: {
    fontSize: 16,
    color: '#6B7280',
    marginBottom: 2,
  },
  contactPhone: {
    fontSize: 16,
    color: '#374151',
    fontWeight: '500',
  },
  contactEditActions: {
    flexDirection: 'row',
    gap: 8,
  },
  editIconButton: {
    padding: 8,
  },
  deleteIconButton: {
    padding: 8,
  },
  contactActions: {
    flexDirection: 'row',
    gap: 12,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 12,
    gap: 8,
  },
  callButton: {
    backgroundColor: '#16A34A',
  },
  callButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  messageButton: {
    backgroundColor: '#2563EB',
  },
  messageButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 0,
    margin: 20,
    maxHeight: '80%',
    width: '90%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: '#1F2937',
  },
  closeButton: {
    padding: 8,
  },
  modalBody: {
    padding: 20,
  },
  inputContainer: {
    marginBottom: 20,
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
  emergencyToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginTop: 8,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderWidth: 2,
    borderColor: '#D1D5DB',
    borderRadius: 6,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxChecked: {
    backgroundColor: '#2563EB',
    borderColor: '#2563EB',
  },
  checkmark: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
  emergencyLabel: {
    fontSize: 16,
    color: '#374151',
    fontWeight: '500',
  },
  modalFooter: {
    flexDirection: 'row',
    gap: 12,
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  cancelButton: {
    flex: 1,
    paddingVertical: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#D1D5DB',
    alignItems: 'center',
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#6B7280',
  },
  saveButton: {
    flex: 1,
    paddingVertical: 16,
    borderRadius: 12,
    backgroundColor: '#2563EB',
    alignItems: 'center',
  },
  saveButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
});