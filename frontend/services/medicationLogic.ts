import * as db from './database';
import { SQLiteDatabase } from 'expo-sqlite';

export interface NextDose {
  medication: db.Medication;
  schedule: db.Schedule;
  triggerDate: Date;
  isPostponed?: boolean; // Para saber si es una dosis pospuesta
}

/**
 * Calcula la fecha y hora de la próxima toma para una regla de horario individual.
 */
function getNextTriggerDate(schedule: db.Schedule): Date | null {
  const [hour, minute] = schedule.time.split(':').map(Number);
  const now = new Date();

  switch (schedule.frequencyType) {
    case 'DAILY': {
      const nextDate = new Date();
      nextDate.setHours(hour, minute, 0, 0);
      if (nextDate <= now) {
        nextDate.setDate(now.getDate() + 1);
      }
      return nextDate;
    }
    case 'HOURLY': {
      let nextDate = new Date();
      nextDate.setHours(hour, minute, 0, 0);
      if (nextDate <= now) {
        while (nextDate <= now) {
          nextDate.setHours(nextDate.getHours() + schedule.frequencyValue);
        }
      }
      return nextDate;
    }
    case 'WEEKLY': {
      const days = schedule.daysOfWeek?.split(',').map(Number) || [];
      if (days.length === 0) return null;
      
      for (let i = 0; i < 7; i++) {
        const checkDate = new Date();
        checkDate.setDate(now.getDate() + i);
        const dayOfWeek = checkDate.getDay(); // Domingo = 0
        
        if (days.includes(dayOfWeek)) {
          const potentialNextDate = new Date(checkDate);
          potentialNextDate.setHours(hour, minute, 0, 0);
          if (potentialNextDate > now) {
            return potentialNextDate;
          }
        }
      }
      return null;
    }
  }
  return null;
}

/**
 * Revisa TODOS los medicamentos y horarios y devuelve la próxima toma más cercana en el tiempo,
 * IGNORANDO las tomas que ya fueron registradas hoy en el historial.
 */
export async function calculateNextDose(database: SQLiteDatabase, medicationsWithSchedules: (db.Medication & { schedules: db.Schedule[] })[]): Promise<NextDose | null> {
  const upcomingDoses: NextDose[] = [];
  const now = new Date();
  
  const todayStr = now.toISOString().split('T')[0];
  
  // Obtenemos todos los registros de hoy para no volver a mostrarlos
  const todaysLogs = await database.getAllAsync<db.IntakeLog>(`SELECT * FROM intake_logs WHERE date(actionAt) = ?;`, [todayStr]);

  for (const med of medicationsWithSchedules) {
    for (const schedule of med.schedules) {
      const triggerDate = getNextTriggerDate(schedule);
      if (triggerDate) {
        // Buscamos si esta toma específica (mismo medicamento, misma hora del día) ya se manejó hoy
        const logForThisDose = todaysLogs.find(log => 
            log.medicationId === med.id && 
            new Date(log.scheduledFor).getHours() === triggerDate.getHours() &&
            new Date(log.scheduledFor).getMinutes() === triggerDate.getMinutes() &&
            new Date(log.scheduledFor).toISOString().split('T')[0] === triggerDate.toISOString().split('T')[0]
        );

        if (logForThisDose) {
          // Si la toma fue POSPUESTA y la nueva hora aún no ha pasado, la consideramos como la próxima
          if (logForThisDose.action === 'POSTPONED') {
            const postponedTime = new Date(new Date(logForThisDose.actionAt).getTime() + 10 * 60000);
            if (postponedTime > now) {
              upcomingDoses.push({
                medication: med,
                schedule: schedule,
                triggerDate: postponedTime,
                isPostponed: true,
              });
            }
          }
          // Si la toma fue 'TAKEN', simplemente la ignoramos y no la añadimos a la lista.
        } else {
          // Si no hay registro para esta toma, la añadimos como una toma normal futura.
          upcomingDoses.push({
            medication: med,
            schedule: schedule,
            triggerDate: triggerDate,
          });
        }
      }
    }
  }

  if (upcomingDoses.length === 0) {
    return null;
  }

  // Ordenamos todas las posibles tomas futuras y nos quedamos con la más cercana en el tiempo
  upcomingDoses.sort((a, b) => a.triggerDate.getTime() - b.triggerDate.getTime());
  
  return upcomingDoses[0];
}