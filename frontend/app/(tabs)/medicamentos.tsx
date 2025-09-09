import { Clock, CreditCard as Edit, Pill, Plus, Trash2, X } from 'lucide-react-native';
import React, { useState } from 'react';
import {
    Modal,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

interface Medicamento {
  id: string;
  nombre: string;
  dosis: string;
  frecuencia: string;
  horarios: string[];
  instrucciones: string;
}

export default function MedicamentosScreen() {
  const [medicamentos, setMedicamentos] = useState<Medicamento[]>([
    {
      id: '1',
      nombre: 'Aspirina',
      dosis: '100mg',
      frecuencia: 'Una vez al día',
      horarios: ['08:00'],
      instrucciones: 'Tomar con alimentos'
    },
    {
      id: '2',
      nombre: 'Metformina',
      dosis: '500mg',
      frecuencia: 'Dos veces al día',
      horarios: ['08:00', '20:00'],
      instrucciones: 'Tomar antes de las comidas'
    }
  ]);

  const [modalVisible, setModalVisible] = useState(false);
  const [nuevoMedicamento, setNuevoMedicamento] = useState({
    nombre: '',
    dosis: '',
    frecuencia: '',
    horarios: [''],
    instrucciones: ''
  });

  const agregarMedicamento = () => {
    if (nuevoMedicamento.nombre && nuevoMedicamento.dosis) {
      const nuevo: Medicamento = {
        id: Date.now().toString(),
        ...nuevoMedicamento
      };
      setMedicamentos([...medicamentos, nuevo]);
      setNuevoMedicamento({
        nombre: '',
        dosis: '',
        frecuencia: '',
        horarios: [''],
        instrucciones: ''
      });
      setModalVisible(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Mis Medicamentos</Text>
        <TouchableOpacity 
          style={styles.addButton}
          onPress={() => setModalVisible(true)}
        >
          <Plus size={24} color="#FFFFFF" strokeWidth={2} />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {medicamentos.map((medicamento) => (
          <View key={medicamento.id} style={styles.medicationCard}>
            <View style={styles.medicationHeader}>
              <View style={styles.medicationIcon}>
                <Pill size={28} color="#2563EB" strokeWidth={2} />
              </View>
              <View style={styles.medicationTitleContainer}>
                <Text style={styles.medicationTitle}>{medicamento.nombre}</Text>
                <Text style={styles.medicationDose}>{medicamento.dosis}</Text>
              </View>
              <View style={styles.medicationActions}>
                <TouchableOpacity style={styles.editButton}>
                  <Edit size={20} color="#6B7280" strokeWidth={2} />
                </TouchableOpacity>
                <TouchableOpacity style={styles.deleteButton}>
                  <Trash2 size={20} color="#DC2626" strokeWidth={2} />
                </TouchableOpacity>
              </View>
            </View>

            <View style={styles.medicationDetails}>
              <Text style={styles.frequencyText}>{medicamento.frecuencia}</Text>
              
              <View style={styles.horariosContainer}>
                <Clock size={16} color="#374151" strokeWidth={2} />
                <Text style={styles.horariosText}>
                  {medicamento.horarios.join(', ')}
                </Text>
              </View>
              
              {medicamento.instrucciones && (
                <Text style={styles.instructionsText}>
                  📝 {medicamento.instrucciones}
                </Text>
              )}
            </View>
          </View>
        ))}
      </ScrollView>

      {/* Modal para agregar medicamento */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Nuevo Medicamento</Text>
              <TouchableOpacity 
                onPress={() => setModalVisible(false)}
                style={styles.closeButton}
              >
                <X size={24} color="#6B7280" strokeWidth={2} />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalBody}>
              <View style={styles.inputContainer}>
                <Text style={styles.inputLabel}>Nombre del medicamento *</Text>
                <TextInput
                  style={styles.textInput}
                  value={nuevoMedicamento.nombre}
                  onChangeText={(text) => setNuevoMedicamento({...nuevoMedicamento, nombre: text})}
                  placeholder="Ej: Aspirina"
                  placeholderTextColor="#9CA3AF"
                />
              </View>

              <View style={styles.inputContainer}>
                <Text style={styles.inputLabel}>Dosis *</Text>
                <TextInput
                  style={styles.textInput}
                  value={nuevoMedicamento.dosis}
                  onChangeText={(text) => setNuevoMedicamento({...nuevoMedicamento, dosis: text})}
                  placeholder="Ej: 100mg"
                  placeholderTextColor="#9CA3AF"
                />
              </View>

              <View style={styles.inputContainer}>
                <Text style={styles.inputLabel}>Frecuencia</Text>
                <TextInput
                  style={styles.textInput}
                  value={nuevoMedicamento.frecuencia}
                  onChangeText={(text) => setNuevoMedicamento({...nuevoMedicamento, frecuencia: text})}
                  placeholder="Ej: Una vez al día"
                  placeholderTextColor="#9CA3AF"
                />
              </View>

              <View style={styles.inputContainer}>
                <Text style={styles.inputLabel}>Instrucciones especiales</Text>
                <TextInput
                  style={[styles.textInput, styles.textArea]}
                  value={nuevoMedicamento.instrucciones}
                  onChangeText={(text) => setNuevoMedicamento({...nuevoMedicamento, instrucciones: text})}
                  placeholder="Ej: Tomar con alimentos"
                  placeholderTextColor="#9CA3AF"
                  multiline={true}
                  numberOfLines={3}
                />
              </View>
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
                onPress={agregarMedicamento}
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
  medicationCard: {
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
  medicationHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  medicationIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#EBF4FF',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  medicationTitleContainer: {
    flex: 1,
  },
  medicationTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 2,
  },
  medicationDose: {
    fontSize: 16,
    color: '#6B7280',
  },
  medicationActions: {
    flexDirection: 'row',
    gap: 12,
  },
  editButton: {
    padding: 8,
  },
  deleteButton: {
    padding: 8,
  },
  medicationDetails: {
    gap: 8,
  },
  frequencyText: {
    fontSize: 16,
    color: '#374151',
    fontWeight: '500',
  },
  horariosContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  horariosText: {
    fontSize: 16,
    color: '#374151',
    fontWeight: '600',
  },
  instructionsText: {
    fontSize: 16,
    color: '#6B7280',
    fontStyle: 'italic',
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
  textArea: {
    height: 80,
    textAlignVertical: 'top',
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