import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, Alert, FlatList, Keyboard, ScrollView, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';
import { useAuth } from '../context/AuthContext';
import * as db from '../services/database';
import * as NotificationService from '../services/notificationService';
import { Clock, Plus, Trash2 } from 'lucide-react-native';

type ScheduleInput = Omit<db.Schedule, 'id' | 'medicationId'>;

export default function EditMedicationScreen() {
  const { database, session } = useAuth();
  const params = useLocalSearchParams<{ medId: string }>();
  const medId = parseInt(params.medId || '0', 10);
  
  const [isLoading, setIsLoading] = useState(true);
  const [name, setName] = useState('');
  const [dosage, setDosage] = useState('');
  const [quantity, setQuantity] = useState('');
  const [instructions, setInstructions] = useState('');
  const [schedules, setSchedules] = useState<ScheduleInput[]>([]);
  
  const [scheduleInput, setScheduleInput] = useState<Partial<ScheduleInput>>({ time: '', frequencyType: 'DAILY', frequencyValue: 1 });
  const [selectedDays, setSelectedDays] = useState<Set<number>>(new Set());

  useEffect(() => {
    if (!database || !medId) return;
    const loadMedicationData = async () => {
        setIsLoading(true);
        const medData = await db.getMedicationById(database, medId);
        if (medData) {
            setName(medData.name);
            setDosage(medData.dosage);
            setQuantity(String(medData.quantity));
            setInstructions(medData.instructions || '');
            setSchedules(medData.schedules.map(s => ({
                time: s.time,
                frequencyType: s.frequencyType,
                frequencyValue: s.frequencyValue,
                daysOfWeek: s.daysOfWeek,
                endDate: s.endDate,
            })));
        } else {
            Alert.alert("Error", "No se pudo encontrar el medicamento.", [{ text: "OK", onPress: () => router.back() }]);
        }
        setIsLoading(false);
    };
    loadMedicationData();
  }, [database, medId]);

  const handleUpdate = async () => {
    if (!name || !dosage || !quantity) { Alert.alert('Campos incompletos', 'Por favor, complete nombre, dosis y cantidad.'); return; }
    if (schedules.length === 0) { Alert.alert('Sin horarios', 'Por favor, añada al menos un horario.'); return; }
    if (!database || !session) { Alert.alert('Error', 'No se ha podido acceder a la base de datos o a la sesión.'); return; }

    const updatedMed = { name, dosage, quantity: parseInt(quantity, 10), instructions };
    const success = await db.updateMedicationWithSchedules(database, medId, updatedMed, schedules);
    
    if (success) {
        await NotificationService.rescheduleAllNotifications(database, parseInt(session));
        Alert.alert("Éxito", "Medicamento actualizado correctamente.");
        router.back();
    } else {
        Alert.alert("Error", "No se pudo actualizar el medicamento.");
    }
  };
  
  const handleTimeChange = (text: string) => {
    const cleaned = text.replace(/[^0-9]/g, '');
    let formatted = cleaned;
    if (cleaned.length > 2) { formatted = `${cleaned.slice(0, 2)}:${cleaned.slice(2)}`; }
    setScheduleInput(prev => ({ ...prev, time: formatted.slice(0, 5) }));
  };

  const handleAddTime = () => {
    if (!/^\d{2}:\d{2}$/.test(scheduleInput.time || '')) { Alert.alert('Formato incorrecto', 'Por favor, ingrese la hora en formato HH:MM.'); return; }
    const newSchedule: ScheduleInput = { time: scheduleInput.time!, frequencyType: scheduleInput.frequencyType!, frequencyValue: scheduleInput.frequencyType === 'HOURLY' ? scheduleInput.frequencyValue! : 1, daysOfWeek: scheduleInput.frequencyType === 'WEEKLY' ? Array.from(selectedDays).join(',') : undefined, };
    setSchedules([...schedules, newSchedule]);
    setScheduleInput({ time: '', frequencyType: 'DAILY', frequencyValue: 1 });
    setSelectedDays(new Set());
    Keyboard.dismiss();
  };

  const handleRemoveSchedule = (index: number) => { setSchedules(schedules.filter((_, i) => i !== index)); };
  
  const getFrequencyText = (schedule: ScheduleInput): string => {
    switch (schedule.frequencyType) {
        case 'DAILY': return `Cada día a las ${schedule.time}`;
        case 'HOURLY': return `Cada ${schedule.frequencyValue} horas (desde ${schedule.time})`;
        case 'WEEKLY': const dayNames = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb']; const days = schedule.daysOfWeek?.split(',').map(d => dayNames[parseInt(d, 10)]).join(', ') || 'días no seleccionados'; return `Semanal (${days}) a las ${schedule.time}`;
        default: return '';
    }
  }
  
  const toggleDay = (dayIndex: number) => {
    const newDays = new Set(selectedDays);
    if (newDays.has(dayIndex)) { newDays.delete(dayIndex); } else { newDays.add(dayIndex); }
    setSelectedDays(newDays);
  };

  const weekDays = ['D', 'L', 'M', 'X', 'J', 'V', 'S'];

  if (isLoading) {
    return (
        <SafeAreaView style={styles.container}>
            <ActivityIndicator size="large" color="#2563EB" style={{ flex: 1, justifyContent: 'center' }} />
        </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
        <ScrollView keyboardShouldPersistTaps="handled">
            <View style={styles.header}><Text style={styles.title}>Editar Medicamento</Text></View>
            <View style={styles.form}>
                <Text style={styles.inputLabel}>Nombre del Medicamento *</Text>
                <TextInput style={styles.textInput} value={name} onChangeText={setName} />
                <Text style={styles.inputLabel}>Dosis *</Text>
                <TextInput style={styles.textInput} value={dosage} onChangeText={setDosage} />
                <Text style={styles.inputLabel}>Cantidad de Pastillas *</Text>
                <TextInput style={styles.textInput} value={quantity} onChangeText={setQuantity} keyboardType="numeric" />
                <Text style={styles.inputLabel}>Instrucciones (Opcional)</Text>
                <TextInput style={[styles.textInput, styles.textArea]} value={instructions} onChangeText={setInstructions} multiline />
                <Text style={styles.sectionTitle}>Horarios y Frecuencia</Text>
                <Text style={styles.inputLabel}>Frecuencia</Text>
                <View style={styles.freqContainer}>
                    <TouchableOpacity style={[styles.freqButton, scheduleInput.frequencyType === 'DAILY' && styles.freqButtonActive]} onPress={() => setScheduleInput({ frequencyType: 'DAILY', time: '', frequencyValue: 1 })}><Text style={[styles.freqButtonText, scheduleInput.frequencyType === 'DAILY' && styles.freqButtonTextActive]}>Cada Día</Text></TouchableOpacity>
                    <TouchableOpacity style={[styles.freqButton, scheduleInput.frequencyType === 'WEEKLY' && styles.freqButtonActive]} onPress={() => setScheduleInput({ frequencyType: 'WEEKLY', time: '', frequencyValue: 1 })}><Text style={[styles.freqButtonText, scheduleInput.frequencyType === 'WEEKLY' && styles.freqButtonTextActive]}>Días Específicos</Text></TouchableOpacity>
                    <TouchableOpacity style={[styles.freqButton, scheduleInput.frequencyType === 'HOURLY' && styles.freqButtonActive]} onPress={() => setScheduleInput({ frequencyType: 'HOURLY', time: '', frequencyValue: 8 })}><Text style={[styles.freqButtonText, scheduleInput.frequencyType === 'HOURLY' && styles.freqButtonTextActive]}>Intervalo Horas</Text></TouchableOpacity>
                </View>
                {scheduleInput.frequencyType === 'WEEKLY' && ( <> <Text style={styles.inputLabel}>Seleccione los días</Text> <View style={styles.weekContainer}> {weekDays.map((day, index) => ( <TouchableOpacity key={index} style={[styles.dayButton, selectedDays.has(index) && styles.dayButtonActive]} onPress={() => toggleDay(index)}> <Text style={[styles.dayButtonText, selectedDays.has(index) && styles.dayButtonTextActive]}>{day}</Text> </TouchableOpacity> ))} </View> </> )}
                {scheduleInput.frequencyType === 'HOURLY' && ( <> <Text style={styles.inputLabel}>Cada (horas)</Text> <TextInput style={styles.textInput} value={String(scheduleInput.frequencyValue)} onChangeText={text => setScheduleInput(prev => ({ ...prev, frequencyValue: parseInt(text.replace(/[^0-9]/g, ''), 10) || 1 }))} keyboardType="numeric" /> </> )}
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
                ListHeaderComponent={() => schedules.length > 0 ? <Text style={styles.sectionTitle}>Horarios Guardados</Text> : null}
                ListHeaderComponentStyle={{ paddingHorizontal: 20 }}
                scrollEnabled={false} 
            />
        </ScrollView>
        <View style={styles.footer}>
            <TouchableOpacity style={styles.cancelButton} onPress={() => router.back()}><Text style={styles.cancelButtonText}>Cancelar</Text></TouchableOpacity>
            <TouchableOpacity style={styles.saveButton} onPress={handleUpdate}><Text style={styles.saveButtonText}>Guardar Cambios</Text></TouchableOpacity>
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
  saveButtonText: { fontSize: 16, fontWeight: 'bold', color: '#FFFFFF' },
});