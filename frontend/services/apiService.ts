// frontend/services/apiService.ts

import { API_URL } from '../constants/Config';

// --- INTERFACES Y TIPOS ---
export interface Schedule {
  id: string;
  medicationId: string;
  time: string;
  frequencyType: string;
  frequencyValue?: number;
  daysOfWeek?: string;
  endDate?: string;
}

export interface Medication {
  id: string;
  patientId: string;
  name: string;
  dosage?: string;
  quantity?: number;
  instructions?: string;
}

export type MedicationWithSchedules = Medication & { schedules: Schedule[] };

export interface NewMedicationPayload {
  name: string;
  dosage: string;
  quantity: number;
  instructions?: string;
}

export interface NewSchedulePayload {
  time: string;
  frequencyType: 'DAILY' | 'HOURLY' | 'WEEKLY';
  frequencyValue?: number;
  daysOfWeek?: string;
}

// --- NUEVO: Tipo para la respuesta de la próxima dosis ---
export interface NextDose {
  medication: Medication;
  schedule: Schedule;
  triggerDate: string; // La fecha vendrá como string en JSON
  isPostponed?: boolean;
}

// --- NUEVO: Tipo para el payload al registrar una toma ---
export interface NewIntakePayload {
  medicationId: string;
  scheduleId: string;
  scheduledFor: string;
  action: 'TAKEN' | 'SKIPPED' | 'POSTPONED';
  actionAt: string;
}

export interface UserProfile {
  id: string;
  firstName: string;
  lastName: string;
  email: string | null;
  phone: string | null;
  birthDate: string | null;
  address: string | null;
  emergencyContact: string | null;
  emergencyPhone: string | null;
  medicalConditions: string | null;
  allergies: string | null;
}


export interface UserRegistrationPayload {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  birthDate?: string;
  password?: string; // Ahora es requerido
}


// --- FUNCIONES DEL SERVICIO ---

export const fetchMedicationsByPatient = async (patientId: string): Promise<Medication[]> => {
  if (!patientId) throw new Error('El ID del paciente es requerido.');
  const requestUrl = `${API_URL}/patients/${patientId}/medications`;
  try {
    const response = await fetch(requestUrl);
    if (!response.ok) throw new Error(`Error del servidor: ${response.status}`);
    return await response.json();
  } catch (error) {
    console.error('Error al obtener los medicamentos:', error);
    throw error;
  }
};

export const fetchSchedulesForMedication = async (medicationId: string): Promise<Schedule[]> => {
  if (!medicationId) return [];
  const requestUrl = `${API_URL}/medications/${medicationId}/schedules`;
  try {
    const response = await fetch(requestUrl);
    if (!response.ok) throw new Error(`Error del servidor al obtener horarios: ${response.status}`);
    return await response.json();
  } catch (error) {
    console.error(`Error al obtener horarios para el medId ${medicationId}:`, error);
    throw error;
  }
};

export const addMedication = async (
  patientId: string,
  medicationData: NewMedicationPayload,
  schedulesData: NewSchedulePayload[]
): Promise<Medication> => {
  if (!patientId) throw new Error('El ID del paciente es requerido.');
  try {
    const medResponse = await fetch(`${API_URL}/patients/${patientId}/medications`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(medicationData),
    });
    if (!medResponse.ok) throw new Error('Falló al crear el medicamento.');
    const newMedication: Medication = await medResponse.json();
    const newMedicationId = newMedication.id;
    await Promise.all(
      schedulesData.map(schedule => {
        const schedulePayload = { ...schedule, medicationId: newMedicationId };
        return fetch(`${API_URL}/schedules`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(schedulePayload),
        });
      })
    );
    return newMedication;
  } catch (error) {
    console.error('Error al añadir el medicamento:', error);
    throw error;
  }
};

export const deleteMedication = async (medicationId: string): Promise<boolean> => {
  if (!medicationId) return false;
  const requestUrl = `${API_URL}/medications/${medicationId}`;
  try {
    const response = await fetch(requestUrl, {
      method: 'DELETE',
    });
    return response.ok;
  } catch (error) {
    console.error(`Error al eliminar el medId ${medicationId}:`, error);
    throw error;
  }
};

// --- NUEVA FUNCIÓN ---
/**
 * Obtiene la próxima dosis calculada desde el backend.
 */
export const fetchNextDose = async (patientId: string): Promise<NextDose | null> => {
  if (!patientId) return null;
  const requestUrl = `${API_URL}/patients/${patientId}/next-dose`;
  try {
    const response = await fetch(requestUrl);
    if (!response.ok) throw new Error('Error al obtener la próxima dosis.');
    return await response.json(); // Devuelve el objeto de la próxima dosis, o null
  } catch (error) {
    console.error('Error en fetchNextDose:', error);
    throw error;
  }
};

// --- NUEVA FUNCIÓN ---
/**
 * Registra una toma (TAKEN, POSTPONED) en el backend.
 */
export const logIntake = async (payload: NewIntakePayload): Promise<boolean> => {
  const requestUrl = `${API_URL}/intakes`;
  try {
    const response = await fetch(requestUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    return response.ok;
  } catch (error) {
    console.error('Error en logIntake:', error);
    throw error;
  }
};

// --- NUEVO TIPO ---
// Describe un registro de toma que incluye la información completa del medicamento
export type IntakeLogWithMedication = {
  id: string;
  action: 'TAKEN' | 'SKIPPED' | 'POSTPONED';
  actionAt: string;
  scheduledFor: string;
  medication: Medication; // Objeto de medicamento anidado
};
// --- NUEVA FUNCIÓN ---
/**
 * Obtiene el historial de tomas de un paciente desde el backend.
 */
export const fetchIntakeHistory = async (patientId: string): Promise<IntakeLogWithMedication[]> => {
  if (!patientId) return [];
  const requestUrl = `${API_URL}/patients/${patientId}/intakes`;
  try {
    const response = await fetch(requestUrl);
    if (!response.ok) throw new Error('Error al obtener el historial.');
    return await response.json();
  } catch (error) {
    console.error('Error en fetchIntakeHistory:', error);
    throw error;
  }
};

export const fetchUserProfile = async (userId: string): Promise<UserProfile | null> => {
  if (!userId) return null;
  const requestUrl = `${API_URL}/patients/${userId}`;
  try {
    const response = await fetch(requestUrl);
    if (!response.ok) throw new Error('Error al obtener el perfil del usuario.');
    return await response.json();
  } catch (error) {
    console.error('Error en fetchUserProfile:', error);
    throw error;
  }
};

export const registerUser = async (payload: UserRegistrationPayload): Promise<UserProfile> => {
  const requestUrl = `${API_URL}/patients`;
  try {
    const response = await fetch(requestUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'No se pudo registrar el usuario.');
    }
    return await response.json();
  } catch (error) {
    console.error('Error en registerUser:', error);
    throw error;
  }
};

export const loginUser = async (email: string, password: string): Promise<UserProfile | null> => {
  const requestUrl = `${API_URL}/login`;
  try {
    const response = await fetch(requestUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }) // Enviamos también la contraseña
    });
    if (!response.ok) {
      return null;
    }
    return await response.json();
  } catch (error) {
    console.error('Error en loginUser:', error);
    throw error;
  }
};