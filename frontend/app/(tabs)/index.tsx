// frontend/app/(tabs)/index.tsx (CORREGIDO CON LÓGICA UTC)

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
import { useFocusEffect, router } from "expo-router";
import { useAuth } from "../../context/AuthContext";
import { usePatient } from "../../context/PatientContext";
import * as apiService from "../../services/apiService";
import * as NotificationService from "../../services/notificationService";
import {
  Bell,
  CheckCircle,
  Clock,
  History,
  ClipboardList,
} from "lucide-react-native";

type NextDoseState = Omit<apiService.NextDose, "triggerDate"> & {
  triggerDate: Date;
};

// --- FUNCIÓN AÑADIDA ---
// Convierte un string de hora UTC (ej: "02:30") a hora local (ej: "23:30")
const convertUTCTimeToLocalString = (utcTime: string): string => {
  if (!/^\d{2}:\d{2}$/.test(utcTime)) return utcTime;
  const [hours, minutes] = utcTime.split(':').map(Number);
  const date = new Date();
  date.setUTCHours(hours, minutes, 0, 0); // Establece la hora como UTC
  
  const localHours = String(date.getHours()).padStart(2, '0'); // Obtiene la hora local
  const localMinutes = String(date.getMinutes()).padStart(2, '0');
  
  return `${localHours}:${localMinutes}`;
};
// -------------------------


/**
 * Formatea un string de 24h (ej: "23:24") a un formato local (ej: "11:24 p. m.")
 * Esta función AHORA recibe la hora local convertida.
 */
const formatScheduleTime = (timeString: string): string => {
  try {
    // timeString ahora es hora local (ej: "23:24")
    const [hour, minute] = timeString.split(":").map(Number);
    const date = new Date();
    date.setHours(hour, minute); // Se establece como hora local
    return date.toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch (e) {
    console.error("Error formateando la hora:", e);
    return timeString; // Devuelve el string original si falla
  }
};

export default function HomeScreen() {
  const { user } = useAuth();
  const { selectedPatient } = usePatient();

  const [nextDose, setNextDose] = useState<NextDoseState | null>(null);
  const [remainingDoses, setRemainingDoses] = useState<NextDoseState[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    NotificationService.requestNotificationPermissions();
  }, []);

  const loadHomeScreenData = useCallback(async () => {
    const patientIdToShow =
      user?.role === "CAREGIVER" ? selectedPatient?.id : user?.id;

    if ((user?.role === "CAREGIVER" && !selectedPatient) || !patientIdToShow) {
      setNextDose(null);
      setRemainingDoses([]);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    try {
      const [nextDoseFromServer, remainingDosesFromServer] = await Promise.all([
        apiService.fetchNextDose(patientIdToShow),
        apiService.fetchRemainingDosesToday(patientIdToShow),
      ]);

      // (Los console.log de debugging pueden quedarse o quitarse, no afectan)
      console.log("==============================================");
      console.log("PASO 1: DATOS CRUDOS DE LA API (HOME)");
      console.log("NEXT DOSE (API):", JSON.stringify(nextDoseFromServer, null, 2));
      console.log("REMAINING (API):", JSON.stringify(remainingDosesFromServer, null, 2));
      console.log("==============================================");

      await NotificationService.scheduleNextDoseNotification(nextDoseFromServer);

      if (nextDoseFromServer) {
        setNextDose({
          ...nextDoseFromServer,
          triggerDate: new Date(nextDoseFromServer.triggerDate),
        });
      } else {
        setNextDose(null);
      }

      if (remainingDosesFromServer && remainingDosesFromServer.length > 0) {
        const filteredRemaining = remainingDosesFromServer.filter(
          (dose) => {
            if (!nextDoseFromServer) return true;
            return dose.schedule.id !== nextDoseFromServer.schedule.id;
          }
        );
        
        console.log("==============================================");
        console.log("PASO 2: DATOS FILTRADOS (HOME)");
        console.log("LISTA 'REMAINING' FILTRADA:", JSON.stringify(filteredRemaining, null, 2));
        console.log("==============================================");


        setRemainingDoses(
          filteredRemaining.map((dose) => ({
            ...dose,
            triggerDate: new Date(dose.triggerDate),
          }))
        );
      } else {
        setRemainingDoses([]);
      }
    } catch (error) {
      console.error("Error al cargar los datos del home screen:", error);
      Alert.alert(
        "Error de Red",
        "No se pudo obtener la información del servidor."
      );
    } finally {
      setIsLoading(false);
    }
  }, [user, selectedPatient]);

  useFocusEffect(
    useCallback(() => {
      loadHomeScreenData();
    }, [loadHomeScreenData])
  );
  
  const handleMarkAsTaken = async () => {
    const patientIdToShow =
      user?.role === "CAREGIVER" ? selectedPatient?.id : user?.id;
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
        await loadHomeScreenData();
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
    const patientIdToShow =
      user?.role === "CAREGIVER" ? selectedPatient?.id : user?.id;
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
        Alert.alert(
          "Recordatorio pospuesto",
          "La próxima toma ha sido actualizada."
        );
        await loadHomeScreenData();
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

  if (user?.role === "CAREGIVER" && !selectedPatient) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <View>
            <Text style={styles.greeting}>Modo Cuidador</Text>
            <Text style={styles.subtitle}>
              Ve a la pestaña 'Pacientes' para seleccionar un perfil y ver su
              próxima dosis.
            </Text>
          </View>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView>
        {/* El Header con el botón de Historial se mantiene igual */}
        <View style={styles.header}>
          <View>
            <Text style={styles.greeting}>¡Buenos días!</Text>
            <Text style={styles.subtitle}>Es hora de cuidar tu salud</Text>
          </View>
          <TouchableOpacity
            style={styles.historyButton}
            onPress={() => router.push("/historial")}
          >
            <History size={26} color="#2563EB" />
          </TouchableOpacity>
        </View>

        {!nextDose ? (
          <View style={styles.noMedsCard}>
            <Text style={styles.noMedsText}>¡Todo en orden!</Text>
            <Text style={styles.noMedsSubText}>
              No tienes medicamentos programados por ahora.
            </Text>
          </View>
        ) : (
          // Tarjeta de Próxima Dosis
          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <Bell size={20} color="#DC2626" />
              <Text style={styles.cardTitle}>Próximo Medicamento</Text>
            </View>
            <Text style={styles.medName}>{nextDose.medication.name}</Text>
            <Text style={styles.medDosage}>{nextDose.medication.dosage}</Text>
            <View style={styles.timeContainer}>
              <Clock size={20} color="#4B5563" />
              
              {/* --- ¡ESTA ES LA LÍNEA CORREGIDA! --- */}
              {/* 1. nextDose.schedule.time es UTC (ej: "02:30")
                2. convertUTCTimeToLocalString("02:30") -> "23:30"
                3. formatScheduleTime("23:30") -> "11:30 p. m."
              */}
              <Text style={styles.medTime}>
                {formatScheduleTime(
                  convertUTCTimeToLocalString(nextDose.schedule.time)
                )}
              </Text>
              
            </View>
            <View style={styles.actionsContainer}>
              <TouchableOpacity
                style={[
                  styles.takenButton,
                  (isSubmitting || user?.role === "CAREGIVER") &&
                    styles.buttonDisabled,
                ]}
                onPress={handleMarkAsTaken}
                disabled={isSubmitting || user?.role === "CAREGIVER"}
              >
                <CheckCircle size={20} color="#FFFFFF" />
                <Text style={styles.actionButtonText}>Ya lo tomé</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.postponeButton,
                  (isSubmitting ||
                    nextDose?.isPostponed ||
                    user?.role === "CAREGIVER") &&
                    styles.buttonDisabled,
                ]}
                onPress={handlePostpone}
                disabled={
                  isSubmitting ||
                  nextDose?.isPostponed ||
                  user?.role === "CAREGIVER"
                }
              >
                <Clock size={20} color="#374151" />
                <Text style={styles.actionButtonTextDark}>Posponer</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* Tarjeta de Dosis Restantes */}
        {remainingDoses.length > 0 && (
          <View style={styles.remainingCard}>
            <View style={styles.remainingCardHeader}>
              <ClipboardList size={20} color="#4B5563" />
              <Text style={styles.remainingCardTitle}>Restantes del día</Text>
            </View>
            <View style={styles.remainingList}>
              {remainingDoses.map((dose) => (
                <View key={dose.schedule.id} style={styles.remainingItem}>
                  <View>
                    <Text style={styles.remainingMedName}>
                      {dose.medication.name}
                    </Text>
                    <Text style={styles.remainingMedDosage}>
                      {dose.medication.dosage}
                    </Text>
                  </View>
                  
                  {/* --- ¡ESTA ES LA LÍNEA CORREGIDA! --- */}
                  <Text style={styles.remainingMedTime}>
                    {formatScheduleTime(
                      convertUTCTimeToLocalString(dose.schedule.time)
                    )}
                  </Text>
                  
                </View>
              ))}
            </View>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

// ... (Todos los estilos 'styles' se mantienen exactamente igual) ...
const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#F8FAFC",
  },
  loadingText: { marginTop: 10, fontSize: 16, color: "#6B7280" },
  container: { flex: 1, backgroundColor: "#F8FAFC" },
  header: {
    paddingHorizontal: 20,
    paddingVertical: 20,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  historyButton: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: "#FFFFFF",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "#E2E8F0",
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
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
    marginHorizontal: 20,
    marginTop: 20,
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
  },
  noMedsText: { fontSize: 18, fontWeight: "600", color: "#6B7280" },
  noMedsSubText: {
    fontSize: 16,
    color: "#9CA3AF",
    marginTop: 8,
    textAlign: "center",
  },
  remainingCard: {
    backgroundColor: "#FFFFFF",
    marginHorizontal: 20,
    marginTop: 24,
    borderRadius: 16,
    padding: 20,
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
  },
  remainingCardHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#E5E7EB",
    paddingBottom: 12,
  },
  remainingCardTitle: {
    marginLeft: 8,
    fontSize: 16,
    fontWeight: "bold",
    color: "#374151",
  },
  remainingList: {
    gap: 16,
  },
  remainingItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  remainingMedName: {
    fontSize: 18,
    fontWeight: "600",
    color: "#1F2937",
  },
  remainingMedDosage: {
    fontSize: 14,
    color: "#6B7280",
  },
  remainingMedTime: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#2563EB",
  },
});