import * as Notifications from 'expo-notifications';
import * as db from './database';
import { SQLiteDatabase } from 'expo-sqlite';
import * as MedicationLogic from './medicationLogic';

/**
 * La ÚNICA función para gestionar las alarmas.
 * Cancela todo lo anterior, calcula la próxima dosis real y programa una única notificación para ella.
 */
export async function rescheduleAllNotifications(database: SQLiteDatabase, userId: number) {
  // 1. Cancelamos todas las notificaciones pendientes para empezar de cero.
  await Notifications.cancelAllScheduledNotificationsAsync();

  // 2. Obtenemos los medicamentos y sus horarios de la BD.
  const meds = await db.getMedicationsWithSchedules(database, userId);
  
  // 3. Usamos nuestra lógica inteligente para calcular la próxima dosis real.
  const nextDose = await MedicationLogic.calculateNextDose(database, meds);

  // 4. Si existe una próxima dosis, programamos una única notificación para ella.
  if (nextDose) {
    const trigger = nextDose.triggerDate as any; // Usamos 'as any' para evitar el error de tipos
    
    await Notifications.scheduleNotificationAsync({
      content: {
        title: '💊 Hora de tu medicamento',
        body: `Es hora de tomar tu ${nextDose.medication.name} (${nextDose.medication.dosage}).`,
        data: { medicationId: nextDose.medication.id },
        sound: 'default',
      },
      trigger,
    });
    console.log(`Reprogramación completa. Próxima notificación: ${nextDose.triggerDate.toLocaleString()}`);
  } else {
    console.log("Reprogramación completa. No hay próximas dosis para programar.");
  }
}