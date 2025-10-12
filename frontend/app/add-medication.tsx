import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, Alert, FlatList, Keyboard, ScrollView, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { useAuth } from '../context/AuthContext';
import { usePatient } from '../context/PatientContext';
import * as apiService from '../services/apiService';
import { Clock, Plus, Trash2 } from 'lucide-react-native';

type ScheduleInput = apiService.NewSchedulePayload;

const convertLocalTimeToUTCString = (localTime: string): string => {
  if (!/^\d{2}:\d{2}$/.test(localTime)) return localTime;
  const [hours, minutes] = localTime.split(':').map(Number);
  const date = new Date();
  date.setHours(hours, minutes, 0, 0);
  const utcHours = String(date.getUTCHours()).padStart(2, '0');
  const utcMinutes = String(date.getUTCMinutes()).padStart(2, '0');
  return `${utcHours}:${utcMinutes}`;
};

// --- FUNCIÓN AÑADIDA DE VUELTA ---
const convertUTCTimeToLocalString = (utcTime: string): string => {
    if (!/^\d{2}:\d{2}$/.test(utcTime)) return utcTime;
    const [hours, minutes] = utcTime.split(':').map(Number);
    const date = new Date();
    date.setUTCHours(hours, minutes, 0, 0);
    const localHours = String(date.getHours()).padStart(2, '0');
    const localMinutes = String(date.getMinutes()).padStart(2, '0');
    return `${localHours}:${localMinutes}`;
};

const formatTimeToAMPM = (time: string) => {
    if (!/^\d{2}:\d{2}$/.test(time)) return time;
    const [hoursStr, minutes] = time.split(':');
    const hours = parseInt(hoursStr, 10);
    const suffix = hours >= 12 ? 'p. m.' : 'a. m.';
    const formattedHour = hours % 12 === 0 ? 12 : hours % 12;
    return `${String(formattedHour).padStart(2, '0')}:${minutes} ${suffix}`;
};

export default function AddMedicationScreen() {
  const { user } = useAuth();
  const { selectedPatient } = usePatient();
  const [name, setName] = useState('');
  const [dosage, setDosage] = useState('');
  const [quantity, setQuantity] = useState('');
  const [instructions, setInstructions] = useState('');
  const [loading, setLoading] = useState(false);
  const [schedules, setSchedules] = useState<ScheduleInput[]>([]);
  const [scheduleInput, setScheduleInput] = useState<Partial<ScheduleInput>>({
    time: '',
    frequencyType: 'DAILY',
    frequencyValue: 1,
  });
  const [selectedDays, setSelectedDays] = useState<Set<number>>(new Set());

  const handleTimeChange = (text: string) => {
    const cleaned = text.replace(/[^0-9]/g, '');
    let formatted = cleaned;
    if (cleaned.length > 2) {
      formatted = `${cleaned.slice(0, 2)}:${cleaned.slice(2)}`;
    }
    setScheduleInput(prev => ({ ...prev, time: formatted.slice(0, 5) }));
  };

  const handleAddTime = () => {
    const time = scheduleInput.time || '';
    const [hours, minutes] = time.split(':').map(Number);

    if (!/^\d{2}:\d{2}$/.test(time) || hours > 23 || minutes > 59) {
      Alert.alert('Hora incorrecta', 'Por favor, ingrese una hora válida en formato HH:MM (ej: 08:00 o 14:30).');
      return;
    }
    
    const utcTime = convertLocalTimeToUTCString(time);

    if (schedules.some(s => s.time === utcTime)) {
      Alert.alert('Hora duplicada', 'Este horario ya ha sido añadido.');
      return;
    }

    const newSchedule: ScheduleInput = { 
        time: utcTime,
        frequencyType: scheduleInput.frequencyType!, 
        frequencyValue: scheduleInput.frequencyType === 'HOURLY' ? scheduleInput.frequencyValue! : 1, 
        daysOfWeek: scheduleInput.frequencyType === 'WEEKLY' ? Array.from(selectedDays).join(',') : undefined, 
    };
    
    setSchedules([...schedules, newSchedule].sort((a, b) => a.time.localeCompare(b.time)));
    setScheduleInput({ time: '', frequencyType: 'DAILY', frequencyValue: 1 });
    setSelectedDays(new Set());
    Keyboard.dismiss();
  };

  const handleRemoveSchedule = (index: number) => {
    setSchedules(schedules.filter((_, i) => i !== index));
  };

  const handleSave = async () => {
    const patientIdToAddFor = user?.role === 'CAREGIVER' ? selectedPatient?.id : user?.id;

    if (!name || !dosage || !quantity) { Alert.alert('Campos incompletos', 'Por favor, complete nombre, dosis y cantidad.'); return; }
    if (schedules.length === 0) { Alert.alert('Sin horarios', 'Por favor, añada al menos un horario.'); return; }
    if (!patientIdToAddFor) { Alert.alert('Error', 'No se ha encontrado el perfil del paciente.'); return; }
    
    if (user?.role === 'CAREGIVER') {
      Alert.alert('Acción no permitida', 'Los cuidadores solo pueden visualizar la información, no añadir nuevos medicamentos.');
      return;
    }
    
    setLoading(true);
    try {
      const newMedPayload: apiService.NewMedicationPayload = { 
        name, 
        dosage, 
        quantity: parseInt(quantity, 10), 
        instructions 
      };

      const newMed = await apiService.addMedication(patientIdToAddFor, newMedPayload, schedules);

      if (newMed && newMed.id) {
        Alert.alert('Éxito', 'Medicamento guardado en el servidor.');
        router.back();
      } else {
        throw new Error("No se pudo guardar el medicamento en el servidor.");
      }
    } catch (error) {
      console.error(error);
      Alert.alert('Error', 'No se pudo guardar el medicamento.');
    } finally {
      setLoading(false);
    }
  };

const getFrequencyText = (schedule: ScheduleInput): string => {
    // 1. Tomamos la hora UTC guardada (ej. "23:30")
    const utcTime = schedule.time;
    // 2. La convertimos de vuelta a la hora local (ej. "20:30")
    const localTime = convertUTCTimeToLocalString(utcTime);
    // 3. Formateamos la hora local para mostrarla
    const formattedTime = formatTimeToAMPM(localTime);

    switch (schedule.frequencyType) {
        case 'DAILY': return `Cada día a las ${formattedTime}`;
        case 'HOURLY': return `Cada ${schedule.frequencyValue} horas (desde ${formattedTime})`;
        case 'WEEKLY': const dayNames = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb']; const days = schedule.daysOfWeek?.split(',').map(d => dayNames[parseInt(d, 10)]).join(', ') || 'días no seleccionados'; return `Semanal (${days}) a las ${formattedTime}`;
        default: return '';
    }
  }

  const toggleDay = (dayIndex: number) => {
    const newDays = new Set(selectedDays);
    if (newDays.has(dayIndex)) { newDays.delete(dayIndex); } else { newDays.add(dayIndex); }
    setSelectedDays(newDays);
  };

  const weekDays = ['D', 'L', 'M', 'X', 'J', 'V', 'S'];

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView keyboardShouldPersistTaps="handled">
        <View style={styles.header}>
            <Text style={styles.title}>Añadir Medicamento</Text>
        </View>

        <View style={styles.form}>
            <Text style={styles.inputLabel}>Nombre del Medicamento *</Text>
            <TextInput style={styles.textInput} value={name} onChangeText={setName} placeholder="Ej: Paracetamol" />

            <Text style={styles.inputLabel}>Dosis *</Text>
            <TextInput style={styles.textInput} value={dosage} onChangeText={setDosage} placeholder="Ej: 500mg" />

            <Text style={styles.inputLabel}>Cantidad de Pastillas *</Text>
            <TextInput style={styles.textInput} value={quantity} onChangeText={setQuantity} placeholder="Ej: 30" keyboardType="numeric" />

            <Text style={styles.inputLabel}>Instrucciones (Opcional)</Text>
            <TextInput style={[styles.textInput, styles.textArea]} value={instructions} onChangeText={setInstructions} placeholder="Ej: Tomar con comida..." multiline />
            
            <Text style={styles.sectionTitle}>Horarios y Frecuencia</Text>
            
            <Text style={styles.inputLabel}>Frecuencia</Text>
            <View style={styles.freqContainer}>
                <TouchableOpacity style={[styles.freqButton, scheduleInput.frequencyType === 'DAILY' && styles.freqButtonActive]} onPress={() => setScheduleInput({ frequencyType: 'DAILY', time: '', frequencyValue: 1 })}><Text style={[styles.freqButtonText, scheduleInput.frequencyType === 'DAILY' && styles.freqButtonTextActive]}>Cada Día</Text></TouchableOpacity>
                <TouchableOpacity style={[styles.freqButton, scheduleInput.frequencyType === 'WEEKLY' && styles.freqButtonActive]} onPress={() => setScheduleInput({ frequencyType: 'WEEKLY', time: '', frequencyValue: 1 })}><Text style={[styles.freqButtonText, scheduleInput.frequencyType === 'WEEKLY' && styles.freqButtonTextActive]}>Días Específicos</Text></TouchableOpacity>
                <TouchableOpacity style={[styles.freqButton, scheduleInput.frequencyType === 'HOURLY' && styles.freqButtonActive]} onPress={() => setScheduleInput({ frequencyType: 'HOURLY', time: '', frequencyValue: 8 })}><Text style={[styles.freqButtonText, scheduleInput.frequencyType === 'HOURLY' && styles.freqButtonTextActive]}>Intervalo Horas</Text></TouchableOpacity>
            </View>

            {scheduleInput.frequencyType === 'WEEKLY' && (
                <>
                    <Text style={styles.inputLabel}>Seleccione los días</Text>
                    <View style={styles.weekContainer}>
                        {weekDays.map((day, index) => (
                            <TouchableOpacity key={index} style={[styles.dayButton, selectedDays.has(index) && styles.dayButtonActive]} onPress={() => toggleDay(index)}>
                                <Text style={[styles.dayButtonText, selectedDays.has(index) && styles.dayButtonTextActive]}>{day}</Text>
                            </TouchableOpacity>
                        ))}
                    </View>
                </>
            )}

            {scheduleInput.frequencyType === 'HOURLY' && (
                <>
                    <Text style={styles.inputLabel}>Cada (horas)</Text>
                    <TextInput style={styles.textInput} value={String(scheduleInput.frequencyValue)} onChangeText={text => setScheduleInput(prev => ({ ...prev, frequencyValue: parseInt(text.replace(/[^0-9]/g, ''), 10) || 1 }))} keyboardType="numeric" />
                </>
            )}

            <Text style={styles.inputLabel}>Hora de la toma (o de inicio)</Text>
            <TextInput style={styles.textInput} value={scheduleInput.time} onChangeText={handleTimeChange} placeholder="HH:MM" maxLength={5} keyboardType="numeric" />
            
            <TouchableOpacity style={styles.addButton} onPress={handleAddTime}>
                <Plus size={20} color="#FFFFFF" />
                <Text style={styles.addButtonText}>Añadir Horario</Text>
            </TouchableOpacity>
        </View>

        <FlatList
            data={schedules}
            keyExtractor={(item, index) => `${item.time}-${index}`}
            renderItem={({ item, index }) => (
              <View style={styles.scheduleItem}>
                <Clock size={20} color="#2563EB" />
                <Text style={styles.scheduleText}>{getFrequencyText(item)}</Text>
                <TouchableOpacity onPress={() => handleRemoveSchedule(index)}>
                  <Trash2 size={20} color="#EF4444" />
                </TouchableOpacity>
              </View>
            )}
            ListHeaderComponent={() => schedules.length > 0 ? <Text style={styles.sectionTitle}>Horarios a Guardar</Text> : null}
            ListHeaderComponentStyle={{ paddingHorizontal: 20 }}
            scrollEnabled={false} 
        />
      </ScrollView>

      <View style={styles.footer}>
        <TouchableOpacity style={styles.cancelButton} onPress={() => router.back()}>
            <Text style={styles.cancelButtonText}>Cancelar</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.saveButton, loading && styles.saveButtonDisabled]} onPress={handleSave} disabled={loading}>
            {loading ? <ActivityIndicator color="#FFFFFF" size="small" /> : <Text style={styles.saveButtonText}>Guardar</Text>}
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAFC' },
  header: { padding: 20 },
  title: { fontSize: 24, fontWeight: 'bold' },
  form: { paddingHorizontal: 20 },
  inputLabel: { fontSize: 16, fontWeight: '600', color: '#374151', marginBottom: 8, marginTop: 16 },
  sectionTitle: { fontSize: 18, fontWeight: '700', color: '#1F2937', marginTop: 24, marginBottom: 8, borderTopWidth: 1, borderTopColor: '#E5E7EB', paddingTop: 16 },
  textInput: { borderWidth: 1, borderColor: '#D1D5DB', borderRadius: 12, padding: 16, fontSize: 16, backgroundColor: '#FFFFFF' },
  textArea: { height: 100, textAlignVertical: 'top' },
  freqContainer: { flexDirection: 'row', gap: 8 },
  freqButton: { flex: 1, paddingVertical: 12, borderRadius: 12, alignItems: 'center', backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: '#D1D5DB' },
  freqButtonActive: { backgroundColor: '#EBF4FF', borderColor: '#2563EB' },
  freqButtonText: { fontSize: 14, fontWeight: '600', color: '#374151' },
  freqButtonTextActive: { color: '#1E40AF' },
  weekContainer: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 8 },
  dayButton: { width: 40, height: 40, borderRadius: 20, justifyContent: 'center', alignItems: 'center', backgroundColor: '#F3F4F6', borderWidth: 1, borderColor: '#D1D5DB' },
  dayButtonActive: { backgroundColor: '#2563EB', borderColor: '#2563EB' },
  dayButtonText: { fontSize: 16, fontWeight: 'bold', color: '#374151' },
  dayButtonTextActive: { color: '#FFFFFF' },
  addButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', padding: 16, backgroundColor: '#2563EB', borderRadius: 12, gap: 8, marginTop: 16 },
  addButtonText: { color: '#FFFFFF', fontWeight: 'bold', fontSize: 16 },
  scheduleItem: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#EBF4FF', padding: 12, borderRadius: 8, marginHorizontal: 20, marginTop: 12, justifyContent: 'space-between' },
  scheduleText: { flex: 1, fontSize: 16, fontWeight: '600', color: '#1E40AF', marginLeft: 8 },
  footer: { flexDirection: 'row', padding: 20, borderTopWidth: 1, borderTopColor: '#E5E7EB', backgroundColor: '#FFFFFF' },
  cancelButton: { flex: 1, padding: 16, borderRadius: 12, alignItems: 'center', marginRight: 8, borderWidth: 1, borderColor: '#D1D5DB' },
  cancelButtonText: { fontSize: 16, fontWeight: 'bold', color: '#374151' },
  saveButton: { flex: 1, padding: 16, borderRadius: 12, alignItems: 'center', backgroundColor: '#16A34A', marginLeft: 8 },
  saveButtonDisabled: { backgroundColor: '#9CA3AF' },
  saveButtonText: { fontSize: 16, fontWeight: 'bold', color: '#FFFFFF' },
});