import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import * as apiService from './apiService'; // Importamos los tipos de la API

/**
 * Pide al usuario los permisos necesarios para enviar notificaciones.
 * Debe llamarse al iniciar la aplicación.
 */
export async function requestNotificationPermissions() {
  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;
  if (existingStatus !== 'granted') {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }
  if (finalStatus !== 'granted') {
    alert('¡Atención! No has permitido las notificaciones. La aplicación no podrá recordarte tus medicamentos.');
    return;
  }

  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('default', {
      name: 'default',
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#FF231F7C',
    });
  }
}

/**
 * Cancela todas las notificaciones y programa una única notificación para la próxima dosis.
 * @param nextDose La próxima dosis obtenida del servidor.
 */
export async function scheduleNextDoseNotification(nextDose: apiService.NextDose | null) {
  // 1. Cancelamos todo lo anterior para asegurar que solo haya una notificación programada.
  await Notifications.cancelAllScheduledNotificationsAsync();

  // 2. Si existe una próxima dosis, la programamos.
  if (nextDose) {
    const trigger = new Date(nextDose.triggerDate);
    
    // Nos aseguramos de no programar una notificación en el pasado
    if (trigger > new Date()) {
      await Notifications.scheduleNotificationAsync({
        content: {
          title: '💊 Hora de tu medicamento',
          body: `Es hora de tomar tu ${nextDose.medication.name} (${nextDose.medication.dosage}).`,
          data: { medicationId: nextDose.medication.id },
          sound: 'default',
        },
        trigger,
      });
      console.log(`[NotificationService] Notificación programada para: ${trigger.toLocaleString()}`);
    } else {
      console.log(`[NotificationService] No se programó la notificación porque la fecha ya pasó: ${trigger.toLocaleString()}`);
    }
  } else {
    console.log("[NotificationService] No hay próximas dosis para programar.");
  }
}