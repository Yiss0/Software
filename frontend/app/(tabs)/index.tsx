import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Alert, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from 'expo-router';
import { useAuth } from '../../context/AuthContext';
import * as db from '../../services/database';
import * as MedicationLogic from '../../services/medicationLogic';
import * as NotificationService from '../../services/notificationService';
import * as Notifications from 'expo-notifications';
import { Bell, CheckCircle, Clock } from 'lucide-react-native';

export default function HomeScreen() {
  const { database, session } = useAuth();
  const [nextDose, setNextDose] = useState<MedicationLogic.NextDose | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const loadNextDoseAndSchedule = useCallback(async () => {
    setIsLoading(true);
    try {
      if (database && session) {
        // Esta función ahora calcula Y reprograma las notificaciones
        await NotificationService.rescheduleAllNotifications(database, parseInt(session, 10));
        // Después de reprogramar, volvemos a cargar la próxima dosis para la UI
        const meds = await db.getMedicationsWithSchedules(database, parseInt(session, 10));
        const next = await MedicationLogic.calculateNextDose(database, meds);
        setNextDose(next);
      }
    } catch (error) {
        console.error("Error crítico al cargar y programar la próxima dosis:", error);
    } finally {
        setIsLoading(false);
    }
  }, [database, session]);

  useFocusEffect(useCallback(() => { loadNextDoseAndSchedule(); }, [loadNextDoseAndSchedule]));

  const handleMarkAsTaken = async () => {
    if (!database || !nextDose || !session || isSubmitting) return;
    setIsSubmitting(true);
    try {
        const log: Omit<db.IntakeLog, 'id'> = {
            medicationId: nextDose.medication.id,
            scheduledFor: nextDose.triggerDate.toISOString(),
            action: 'TAKEN',
            actionAt: new Date().toISOString(),
        };
        const success = await db.logIntake(database, log);
        if (success) {
            Alert.alert('¡Bien hecho!', 'Se ha registrado la toma.');
            // Volvemos a cargar y reprogramar todo
            await loadNextDoseAndSchedule();
        } else {
            Alert.alert('Error', 'No se pudo registrar la toma.');
        }
    } catch (error) {
        console.error("Error en handleMarkAsTaken:", error);
    } finally {
        setIsSubmitting(false);
    }
  };
  
  const handlePostpone = async () => {
    if (!database || !nextDose || !session || isSubmitting) return;
    setIsSubmitting(true);
    try {
        const log: Omit<db.IntakeLog, 'id'> = {
            medicationId: nextDose.medication.id,
            scheduledFor: nextDose.triggerDate.toISOString(),
            action: 'POSTPONED',
            actionAt: new Date().toISOString(),
        };
        await db.logIntake(database, log);
        
        // Volvemos a cargar y reprogramar todo, la lógica ya considerará la posposición
        await loadNextDoseAndSchedule();

        Alert.alert('Recordatorio pospuesto', 'La próxima toma ha sido actualizada.');
    } catch (error) {
        console.error("Error en handlePostpone:", error);
    } finally {
        setIsSubmitting(false);
    }
  };
  
  if (isLoading) {
    return (
        <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#2563EB" />
            <Text style={styles.loadingText}>Cargando tus medicamentos...</Text>
        </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView>
        <View style={styles.header}>
            <Text style={styles.greeting}>¡Buenos días!</Text>
            <Text style={styles.subtitle}>Es hora de cuidar su salud</Text>
        </View>

        {nextDose ? (
            <View style={styles.card}>
                <View style={styles.cardHeader}>
                    <Bell size={20} color="#DC2626" />
                    <Text style={styles.cardTitle}>Próximo Medicamento</Text>
                </View>
                <Text style={styles.medName}>{nextDose.medication.name}</Text>
                <Text style={styles.medDosage}>{nextDose.medication.dosage}</Text>
                <View style={styles.timeContainer}>
                    <Clock size={20} color="#4B5563" />
                    <Text style={styles.medTime}>{nextDose.triggerDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</Text>
                </View>
                <View style={styles.actionsContainer}>
                    <TouchableOpacity 
                        style={[styles.takenButton, isSubmitting && styles.buttonDisabled]} 
                        onPress={handleMarkAsTaken}
                        disabled={isSubmitting}
                    >
                        <CheckCircle size={20} color="#FFFFFF" />
                        <Text style={styles.actionButtonText}>Ya lo tomé</Text>
                    </TouchableOpacity>
                    <TouchableOpacity 
                        style={[styles.postponeButton, isSubmitting && styles.buttonDisabled]}
                        onPress={handlePostpone}
                        disabled={isSubmitting}
                    >
                        <Clock size={20} color="#374151" />
                        <Text style={styles.actionButtonTextDark}>Posponer</Text>
                    </TouchableOpacity>
                </View>
            </View>
        ) : (
            <View style={styles.noMedsCard}>
                <Text style={styles.noMedsText}>¡Todo en orden!</Text>
                <Text style={styles.noMedsSubText}>No tienes medicamentos programados por ahora.</Text>
            </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#F8FAFC' },
  loadingText: { marginTop: 10, fontSize: 16, color: '#6B7280' },
  container: { flex: 1, backgroundColor: '#F8FAFC' },
  header: { paddingHorizontal: 20, paddingVertical: 20 },
  greeting: { fontSize: 28, fontWeight: 'bold', color: '#1F2937' },
  subtitle: { fontSize: 18, color: '#6B7280', marginTop: 4 },
  card: { backgroundColor: '#FFFFFF', marginHorizontal: 20, borderRadius: 16, padding: 20, borderLeftWidth: 6, borderLeftColor: '#EF4444', elevation: 4, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4 },
  cardHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  cardTitle: { marginLeft: 8, fontSize: 16, fontWeight: 'bold', color: '#DC2626' },
  medName: { fontSize: 24, fontWeight: 'bold', color: '#1F2937' },
  medDosage: { fontSize: 16, color: '#6B7280', marginVertical: 4 },
  timeContainer: { flexDirection: 'row', alignItems: 'center', marginTop: 12, backgroundColor: '#F3F4F6', alignSelf: 'flex-start', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8 },
  medTime: { marginLeft: 8, fontSize: 16, fontWeight: 'bold', color: '#374151' },
  actionsContainer: { flexDirection: 'row', marginTop: 20, gap: 12 },
  takenButton: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', padding: 16, backgroundColor: '#16A34A', borderRadius: 12, gap: 8 },
  postponeButton: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', padding: 16, backgroundColor: '#FBBF24', borderRadius: 12, gap: 8 },
  actionButtonText: { fontSize: 16, fontWeight: 'bold', color: '#FFFFFF' },
  actionButtonTextDark: { fontSize: 16, fontWeight: 'bold', color: '#374151' },
  buttonDisabled: { backgroundColor: '#9CA3AF' },
  noMedsCard: { alignItems: 'center', justifyContent: 'center', padding: 40, marginTop: 20 },
  noMedsText: { fontSize: 18, fontWeight: '600', color: '#6B7280' },
  noMedsSubText: { fontSize: 16, color: '#9CA3AF', marginTop: 8 },
});