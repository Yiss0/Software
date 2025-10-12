import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import * as apiService from './apiService';

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

export async function scheduleNextDoseNotification(nextDose: apiService.NextDose | null) {
  await Notifications.cancelAllScheduledNotificationsAsync();

  if (nextDose) {
    console.log(" notificationService | 1. Recibido en scheduleNextDoseNotification:", nextDose);
    const triggerDate = new Date(nextDose.triggerDate);
    const now = new Date();

    if (triggerDate > now) {
      // --- ¡LA SOLUCIÓN DEFINITIVA! ---
      // 1. Calculamos la diferencia en milisegundos entre el futuro (la hora de la toma) y el ahora.
      const delayInMilliseconds = triggerDate.getTime() - now.getTime();
      
      // 2. Convertimos esa diferencia a segundos.
      const secondsUntilTrigger = delayInMilliseconds / 1000;

      console.log(` notificationService | 4. Segundos calculados para la alarma: ${secondsUntilTrigger} (aprox. ${Math.round(secondsUntilTrigger/60)} minutos)`)

      await Notifications.scheduleNotificationAsync({
        content: {
          title: '💊 Hora de tu medicamento',
          body: `Es hora de tomar tu ${nextDose.medication.name} (${nextDose.medication.dosage}).`,
          data: { medicationId: nextDose.medication.id },
          sound: 'default',
        },
        // 3. Le decimos a la notificación que se dispare en exactamente esa cantidad de segundos.
        // Este método es inmune a los problemas de zona horaria.
        trigger: {
          seconds: secondsUntilTrigger,
        },
      });
      
      console.log(`[NotificationService] La hora de la toma es ${triggerDate.toLocaleString('es-CL')}. La notificación sonará en ${Math.round(secondsUntilTrigger / 60)} minutos.`);
    } else {
      console.log(`[NotificationService] No se programó la notificación porque la fecha ya pasó.`);
    }
  } else {
    console.log("[NotificationService] No hay próximas dosis para programar.");
  }
}