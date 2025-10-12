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

export interface NextDose {
  medication: Medication;
  schedule: Schedule;
  triggerDate: string; 
  isPostponed?: boolean;
}

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
  role: 'PATIENT' | 'CAREGIVER'; // Agregamos el rol para distinguirlos
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
  password?: string;
}

export type IntakeLogWithMedication = {
  id: string;
  action: 'TAKEN' | 'SKIPPED' | 'POSTPONED';
  actionAt: string;
  scheduledFor: string;
  medication: Medication;
};

// --- NUEVO: INTERFACES PARA CUIDADORES ---
export interface PatientForCaregiver {
  id: string; 
  relation: string | null;
  patient: UserProfile; 
}

export interface CaregiverForPatient {
  id: string; 
  relation: string | null;
  caregiver: UserProfile; 
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

export const fetchNextDose = async (patientId: string): Promise<NextDose | null> => {
  if (!patientId) return null;
  const requestUrl = `${API_URL}/patients/${patientId}/next-dose`;
  try {
    const response = await fetch(requestUrl);
    if (!response.ok) throw new Error('Error al obtener la próxima dosis.');
    const data = await response.json();
    
    // --- AÑADE ESTA LÍNEA AQUÍ ---
    console.log(" apiService | Datos crudos recibidos del backend:", data);

    return data;
    return await response.json(); 
  } catch (error) {
    console.error('Error en fetchNextDose:', error);
    throw error;
  }
};

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
  // Usamos un endpoint genérico si lo tienes, o mantenemos el de pacientes
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
  // --- CAMBIO CLAVE ---
  // Nos aseguramos de que apunte al nuevo endpoint genérico de registro
  const requestUrl = `${API_URL}/users/register`; 
  
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
    // Si el error es de parseo de JSON, es porque recibimos HTML.
    if (error instanceof SyntaxError) {
        throw new Error("El servidor respondió con un formato inesperado. Verifica que el endpoint del backend es correcto.");
    }
    throw error;
  }
};

export const loginUser = async (email: string, password: string): Promise<UserProfile | null> => {
  const requestUrl = `${API_URL}/login`;
  try {
    const response = await fetch(requestUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
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


// --- NUEVO: FUNCIONES COMPLETAS PARA LA API DE CUIDADORES ---

export const fetchPatientsForCaregiver = async (caregiverId: string): Promise<PatientForCaregiver[]> => {
  if (!caregiverId) return [];
  const requestUrl = `${API_URL}/caregivers/${caregiverId}/patients`;
  try {
    const response = await fetch(requestUrl);
    if (!response.ok) {
      throw new Error(`Error del servidor: ${response.status}`);
    }
    return await response.json();
  } catch (error) {
    console.error('Error en fetchPatientsForCaregiver:', error);
    throw error;
  }
};

export const fetchCaregiversForPatient = async (patientId: string): Promise<CaregiverForPatient[]> => {
    if (!patientId) return [];
    const requestUrl = `${API_URL}/patients/${patientId}/caregivers`;
    try {
      const response = await fetch(requestUrl);
      if (!response.ok) {
        throw new Error(`Error del servidor: ${response.status}`);
      }
      return await response.json();
    } catch (error) {
      console.error('Error en fetchCaregiversForPatient:', error);
      throw error;
    }
};

export const linkPatientToCaregiver = async (caregiverId: string, patientId: string, relation: string): Promise<boolean> => {
    const requestUrl = `${API_URL}/caregivers/${caregiverId}/patients`;
    try {
        const response = await fetch(requestUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ patientId, relation }),
        });
        return response.ok;
    } catch (error) {
        console.error('Error en linkPatientToCaregiver:', error);
        throw error;
    }
};

export const linkPatientToCaregiverByEmail = async (caregiverId: string, patientEmail: string): Promise<any> => {
    const requestUrl = `${API_URL}/caregivers/${caregiverId}/link-patient`;
    const response = await fetch(requestUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ patientEmail })
    });
    if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error);
    }
    return response.json();
};

export const unlinkPatientFromCaregiver = async (caregiverId: string, patientId: string): Promise<boolean> => {
    const requestUrl = `${API_URL}/caregivers/${caregiverId}/patients/${patientId}`;
    try {
        const response = await fetch(requestUrl, { method: 'DELETE' });
        return response.ok;
    } catch (error) {
        console.error('Error en unlinkPatientFromCaregiver:', error);
        throw error;
    }
};

export const linkCaregiverByEmail = async (patientId: string, caregiverEmail: string): Promise<CaregiverForPatient> => {
  const requestUrl = `${API_URL}/patients/${patientId}/link-caregiver`;
  const response = await fetch(requestUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ caregiverEmail }),
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.error || 'No se pudo vincular al cuidador.');
  }
  return await response.json();
};