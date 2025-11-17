import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import * as apiService from './apiService';

/**
 * Pide permisos y crea los canales de notificación.
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
    // 1. Canal por defecto
    await Notifications.setNotificationChannelAsync('default', {
      name: 'Recordatorios de Medicamentos',
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#FF231F7C',
      sound: 'default',
    });

    // 2. Canal de Alarma
    await Notifications.setNotificationChannelAsync('alarm-channel', {
      name: 'Alarmas de Medicamentos',
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 500, 200, 500, 200, 500],
      sound: 'alarm.mp3', // Asegúrate de que este archivo exista en /assets/sounds/
      lightColor: '#FF0000',
    });
  }
}

/**
 * Programa la notificación local Y registra la toma como 'PENDING' en el backend.
 */
export async function scheduleNextDoseNotification(nextDose: apiService.NextDose | null) {
  await Notifications.cancelAllScheduledNotificationsAsync();

  if (!nextDose) {
    console.log("[NotificationService] No hay próximas dosis para programar.");
    return;
  }

  const alertType = nextDose.schedule.alertType || 'NOTIFICATION';
  const triggerDate = new Date(nextDose.triggerDate);
  const now = new Date();

  if (triggerDate > now) {
    const secondsUntilTrigger = (triggerDate.getTime() - now.getTime()) / 1000;
    console.log(`[NotificationService] nextDose: med=${nextDose.medication.id} schedule=${nextDose.schedule.id} trigger=${triggerDate.toISOString()} secondsUntil=${secondsUntilTrigger}`);

    let notificationContent: Notifications.NotificationContentInput;

    if (alertType === 'ALARM') {
      console.log("[NotificationService] Programando una ALARMA.");
      notificationContent = {
        title: '¡ALARMA! ⏰ Es hora de tu medicamento',
        body: `¡Es hora de tomar tu ${nextDose.medication.name} (${nextDose.medication.dosage})!`,
        data: { medicationId: nextDose.medication.id },
        priority: Notifications.AndroidNotificationPriority.MAX,
        sound: Platform.OS === 'ios' ? 'alarm.mp3' : 'alarm-channel',
      };
    } else {
      console.log("[NotificationService] Programando una NOTIFICACIÓN estándar.");
      notificationContent = {
        title: '💊 Hora de tu medicamento',
        body: `Es hora de tomar tu ${nextDose.medication.name} (${nextDose.medication.dosage}).`,
        data: { medicationId: nextDose.medication.id },
        sound: 'default',
      };
    }

    try {
      // 1. Programa la notificación local
      await Notifications.scheduleNotificationAsync({
        content: notificationContent,
        trigger: { seconds: secondsUntilTrigger },
      });

      console.log(`[NotificationService] Notificación (${alertType}) programada para ${triggerDate.toLocaleString('es-CL')}.`);

      // 2. Llama al backend para crear el registro PENDING
      // Usamos toISOString() para enviar la fecha en formato UTC estándar
      await apiService.logPendingIntake(
        nextDose.medication.id,
        nextDose.schedule.id,
        triggerDate.toISOString() 
      );
      
      console.log("[NotificationService] Registro 'PENDING' creado en el backend.");

    } catch (error) {
      console.error("[NotificationService] Error al programar o registrar PENDING:", error);
    }

  } else {
    console.log(`[NotificationService] No se programó la notificación porque la fecha (${triggerDate.toLocaleString('es-CL')}) ya pasó.`);
  }
}