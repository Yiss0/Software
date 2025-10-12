import React, { useState, useCallback, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
  ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useFocusEffect } from "expo-router";
import { useAuth } from "../../context/AuthContext";
import { usePatient } from "../../context/PatientContext";
import * as apiService from "../../services/apiService";
import * as NotificationService from "../../services/notificationService";
import { Bell, CheckCircle, Clock } from "lucide-react-native";

type NextDoseState = Omit<apiService.NextDose, "triggerDate"> & {
  triggerDate: Date;
};

export default function HomeScreen() {
  const { user } = useAuth();
  const { selectedPatient } = usePatient();
  
  const [nextDose, setNextDose] = useState<NextDoseState | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Pide permisos de notificación solo una vez
  useEffect(() => {
    NotificationService.requestNotificationPermissions();
  }, []);

  const loadNextDoseFromServer = useCallback(async () => {
    const patientIdToShow = user?.role === 'CAREGIVER' ? selectedPatient?.id : user?.id;

    if ((user?.role === 'CAREGIVER' && !selectedPatient) || !patientIdToShow) {
      setNextDose(null);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    try {
      const nextDoseFromServer = await apiService.fetchNextDose(patientIdToShow);
      
      console.log(" index.tsx | 1. Recibido de apiService:", nextDoseFromServer);
      // La notificación se programa con la fecha UTC, el servicio se encarga del resto
      await NotificationService.scheduleNextDoseNotification(nextDoseFromServer);
      
      if (nextDoseFromServer) {
        setNextDose({
          ...nextDoseFromServer,
          // Convertimos el string UTC a un objeto Date. Este objeto es la "verdad universal".
          triggerDate: new Date(nextDoseFromServer.triggerDate),
        });
      } else {
        setNextDose(null);
      }
    } catch (error) {
      console.error("Error al cargar y programar la próxima dosis:", error);
      Alert.alert("Error de Red", "No se pudo obtener la información del servidor.");
    } finally {
      setIsLoading(false);
    }
  }, [user, selectedPatient]);

  useFocusEffect(
    useCallback(() => {
      loadNextDoseFromServer();
    }, [loadNextDoseFromServer])
  );

  const handleMarkAsTaken = async () => {
    const patientIdToShow = user?.role === 'CAREGIVER' ? selectedPatient?.id : user?.id;
    if (!nextDose || !patientIdToShow || isSubmitting) return;

    setIsSubmitting(true);
    try {
      const payload: apiService.NewIntakePayload = {
        medicationId: nextDose.medication.id,
        scheduleId: nextDose.schedule.id,
        scheduledFor: nextDose.triggerDate.toISOString(),
        action: "TAKEN",
        actionAt: new Date().toISOString(),
      };
      const success = await apiService.logIntake(payload);
      if (success) {
        Alert.alert("¡Bien hecho!", "Se ha registrado la toma.");
        await loadNextDoseFromServer();
      } else {
        Alert.alert("Error", "No se pudo registrar la toma.");
      }
    } catch (error) {
      console.error("Error en handleMarkAsTaken:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handlePostpone = async () => {
    const patientIdToShow = user?.role === 'CAREGIVER' ? selectedPatient?.id : user?.id;
    if (!nextDose || !patientIdToShow || isSubmitting) return;

    setIsSubmitting(true);
    try {
      const payload: apiService.NewIntakePayload = {
        medicationId: nextDose.medication.id,
        scheduleId: nextDose.schedule.id,
        scheduledFor: nextDose.triggerDate.toISOString(),
        action: "POSTPONED",
        actionAt: new Date().toISOString(),
      };
      const success = await apiService.logIntake(payload);
      if (success) {
        Alert.alert("Recordatorio pospuesto", "La próxima toma ha sido actualizada.");
        await loadNextDoseFromServer();
      } else {
        Alert.alert("Error", "No se pudo posponer la toma.");
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

  // Si es un cuidador y no ha seleccionado paciente, muestra un mensaje
  if (user?.role === 'CAREGIVER' && !selectedPatient) {
    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.header}>
                <Text style={styles.greeting}>Modo Cuidador</Text>
                <Text style={styles.subtitle}>Ve a la pestaña 'Pacientes' para seleccionar un perfil y ver su próxima dosis.</Text>
            </View>
        </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView>
        <View style={styles.header}>
          <Text style={styles.greeting}>¡Buenos días!</Text>
          <Text style={styles.subtitle}>Es hora de cuidar tu salud</Text>
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
              <Text style={styles.medTime}>
                {/* ¡CORRECCIÓN DE HORA! toLocaleTimeString() muestra la hora local */}
                {nextDose.triggerDate.toLocaleTimeString([], {
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </Text>
            </View>
            <View style={styles.actionsContainer}>
              <TouchableOpacity
                style={[ styles.takenButton, (isSubmitting || user?.role === 'CAREGIVER') && styles.buttonDisabled ]}
                onPress={handleMarkAsTaken}
                disabled={isSubmitting || user?.role === 'CAREGIVER'}
              >
                <CheckCircle size={20} color="#FFFFFF" />
                <Text style={styles.actionButtonText}>Ya lo tomé</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[ styles.postponeButton, (isSubmitting || nextDose?.isPostponed || user?.role === 'CAREGIVER') && styles.buttonDisabled ]}
                onPress={handlePostpone}
                disabled={isSubmitting || nextDose?.isPostponed || user?.role === 'CAREGIVER'}
              >
                <Clock size={20} color="#374151" />
                <Text style={styles.actionButtonTextDark}>Posponer</Text>
              </TouchableOpacity>
            </View>
          </View>
        ) : (
          <View style={styles.noMedsCard}>
            <Text style={styles.noMedsText}>¡Todo en orden!</Text>
            <Text style={styles.noMedsSubText}>
              No tienes medicamentos programados por ahora.
            </Text>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#F8FAFC",
  },
  loadingText: { marginTop: 10, fontSize: 16, color: "#6B7280" },
  container: { flex: 1, backgroundColor: "#F8FAFC" },
  header: { paddingHorizontal: 20, paddingVertical: 20 },
  greeting: { fontSize: 28, fontWeight: "bold", color: "#1F2937" },
  subtitle: { fontSize: 18, color: "#6B7280", marginTop: 4 },
  card: {
    backgroundColor: "#FFFFFF",
    marginHorizontal: 20,
    borderRadius: 16,
    padding: 20,
    borderLeftWidth: 6,
    borderLeftColor: "#EF4444",
    elevation: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  cardHeader: { flexDirection: "row", alignItems: "center", marginBottom: 12 },
  cardTitle: {
    marginLeft: 8,
    fontSize: 16,
    fontWeight: "bold",
    color: "#DC2626",
  },
  medName: { fontSize: 24, fontWeight: "bold", color: "#1F2937" },
  medDosage: { fontSize: 16, color: "#6B7280", marginVertical: 4 },
  timeContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 12,
    backgroundColor: "#F3F4F6",
    alignSelf: "flex-start",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  medTime: {
    marginLeft: 8,
    fontSize: 16,
    fontWeight: "bold",
    color: "#374151",
  },
  actionsContainer: { flexDirection: "row", marginTop: 20, gap: 12 },
  takenButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    padding: 16,
    backgroundColor: "#16A34A",
    borderRadius: 12,
    gap: 8,
  },
  postponeButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    padding: 16,
    backgroundColor: "#FBBF24",
    borderRadius: 12,
    gap: 8,
  },
  actionButtonText: { fontSize: 16, fontWeight: "bold", color: "#FFFFFF" },
  actionButtonTextDark: { fontSize: 16, fontWeight: "bold", color: "#374151" },
  buttonDisabled: { backgroundColor: "#9CA3AF" },
  noMedsCard: {
    alignItems: "center",
    justifyContent: "center",
    padding: 40,
    marginTop: 20,
  },
  noMedsText: { fontSize: 18, fontWeight: "600", color: "#6B7280" },
  noMedsSubText: { fontSize: 16, color: "#9CA3AF", marginTop: 8 },
});