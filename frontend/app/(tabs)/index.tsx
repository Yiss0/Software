import React, { useState, useCallback, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Alert, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from 'expo-router';
import { useAuth } from '../../context/AuthContext';
import * as apiService from '../../services/apiService';
import * as NotificationService from '../../services/notificationService';
import { Bell, CheckCircle, Clock } from 'lucide-react-native';

type NextDoseState = Omit<apiService.NextDose, 'triggerDate'> & { triggerDate: Date };

export default function HomeScreen() {
  const { session } = useAuth();
  const [nextDose, setNextDose] = useState<NextDoseState | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Se ejecuta solo una vez cuando el componente se monta por primera vez.
  useEffect(() => {
    NotificationService.requestNotificationPermissions();
  }, []);

  const loadNextDoseFromServer = useCallback(async () => {
    setIsLoading(true);
    try {
      if (session) {
        const nextDoseFromServer = await apiService.fetchNextDose(session);
        await NotificationService.scheduleNextDoseNotification(nextDoseFromServer);
        if (nextDoseFromServer) {
          setNextDose({
            ...nextDoseFromServer,
            triggerDate: new Date(nextDoseFromServer.triggerDate),
          });
        } else {
          setNextDose(null);
        }
      }
    } catch (error) {
        console.error("Error al cargar y programar la próxima dosis:", error);
        Alert.alert("Error de Red", "No se pudo obtener la información del servidor.");
    } finally {
        setIsLoading(false);
    }
  }, [session]);

  useFocusEffect(useCallback(() => { loadNextDoseFromServer(); }, [loadNextDoseFromServer]));

  const handleMarkAsTaken = async () => {
    console.log("--- INICIO DEPURACIÓN: handleMarkAsTaken ---");
    console.log("1. Botón 'Ya lo tomé' presionado.");

    if (!nextDose || !session || isSubmitting) {
      console.log("2. La función se detuvo en la validación inicial.");
      console.log(`- ¿Existe nextDose?: ${!!nextDose}`);
      console.log(`- ¿Existe session?: ${!!session}`);
      console.log(`- ¿Está enviando?: ${isSubmitting}`);
      console.log("--- FIN DEPURACIÓN ---");
      return;
    }
    
    console.log("2. La validación inicial fue exitosa.");
    setIsSubmitting(true);

    try {
        console.log("3. Intentando crear el payload para la API.");
        const payload: apiService.NewIntakePayload = {
            medicationId: nextDose.medication.id,
            scheduleId: nextDose.schedule.id,
            scheduledFor: nextDose.triggerDate.toISOString(),
            action: 'TAKEN',
            actionAt: new Date().toISOString(),
        };
        console.log("4. Payload creado. Enviando a la API...", payload);
        
        const success = await apiService.logIntake(payload);
        
        console.log("5. La API respondió. ¿Éxito?", success);
        
        if (success) {
            Alert.alert('¡Bien hecho!', 'Se ha registrado la toma.');
            await loadNextDoseFromServer();
        } else {
            Alert.alert('Error', 'No se pudo registrar la toma en el servidor.');
        }
    } catch (error) {
        console.error("ERROR: La llamada a la API falló dentro del bloque try-catch.", error);
        Alert.alert('Error', 'Ocurrió un error al registrar la toma. Revisa la consola.');
    } finally {
        setIsSubmitting(false);
        console.log("--- FIN DEPURACIÓN ---");
    }
  };
  
  const handlePostpone = async () => {
    if (!nextDose || !session || isSubmitting) return;
    setIsSubmitting(true);
    try {
      const payload: apiService.NewIntakePayload = {
            medicationId: nextDose.medication.id,
            scheduleId: nextDose.schedule.id,
            scheduledFor: nextDose.triggerDate.toISOString(),
            action: 'POSTPONED',
            actionAt: new Date().toISOString(),
      };
      const success = await apiService.logIntake(payload);
        if (success) {
          Alert.alert('Recordatorio pospuesto', 'La próxima toma ha sido actualizada.');
            await loadNextDoseFromServer();
        } else {
            Alert.alert('Error', 'No se pudo registrar la acción.');
        }
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
            <Text style={styles.loadingText}>Buscando próximas dosis...</Text>
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
                        style={[styles.postponeButton, (isSubmitting || nextDose?.isPostponed) && styles.buttonDisabled]}
                        onPress={handlePostpone}
                        disabled={isSubmitting || nextDose?.isPostponed}
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