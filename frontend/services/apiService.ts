// frontend/services/apiService.ts (CORREGIDO CON TIMEZONE)

import { API_URL } from '../constants/Config';

// --- INTERFACES (Sin cambios) ---
// ... (Todas tus interfaces: Schedule, Medication, NextDose, etc. son correctas) ...
export interface Schedule {
  id: string;
  medicationId: string;
  time: string;
  frequencyType: string;
  frequencyValue?: number;
  daysOfWeek?: string;
  endDate?: string;
  alertType: AlertType; 
}
export interface Medication {
  id: string;
  patientId: string;
  name: string;
  dosage?: string;
  quantity?: number;
  instructions?: string;
  type?: 'PILL' | 'SYRUP' | 'INHALER';
}
export type MedicationWithSchedules = Medication & { schedules: Schedule[] };
export type AlertType = 'NOTIFICATION' | 'ALARM';
export interface NewMedicationPayload {
  name: string;
  dosage: string;
  quantity: number;
  instructions?: string;
  type: 'PILL' | 'SYRUP' | 'INHALER'; 
}
export interface NewSchedulePayload {
  time: string;
  frequencyType: 'DAILY' | 'HOURLY' | 'WEEKLY';
  frequencyValue?: number;
  daysOfWeek?: string;
  alertType: AlertType;
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
  action: 'TAKEN' | 'SKIPPED' | 'POSTPONED' | 'CONFIRMED';
  actionAt: string;
}
export interface UserProfile {
  id: string;
  firstName: string;
  lastName: string;
  email: string | null;
  phone: string | null;
  role: 'PATIENT' | 'CAREGIVER';
  birthDate: string | null;
  address: string | null;
  emergencyContact: string | null;
  emergencyPhone: string | null;
  medicalConditions: string | null;
  allergies: string | null;
  profileImageUrl?: string | null;
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
export interface PatientDashboard {
  patient: UserProfile & {
    medications: MedicationWithSchedules[];
  };
  todaysIntakes: IntakeLogWithMedication[];
}

export type UpdateMedicationPayload = {
  medication: {
    name: string;
    dosage?: string | null;
    quantity?: number | null;
    presentation?: string | null;
    instructions?: string | null;
    color?: string | null;
    type?: string;
  };
  schedules: NewSchedulePayload[]; 
};

// --- FUNCIONES DEL SERVICIO ---
// ... (fetchMedicationsByPatient, fetchSchedulesForMedication, addMedication, deleteMedication se mantienen igual) ...
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


// --- FUNCIÓN MODIFICADA ---
export const fetchNextDose = async (patientId: string): Promise<NextDose | null> => {
  if (!patientId) return null;
  
  // 1. Obtener el offset de la zona horaria del dispositivo EN MINUTOS
  // Para UTC-3 (Chile), esto devolverá 180
  const tzOffsetMinutes = new Date().getTimezoneOffset();
  
  // 2. Añadir el offset como query parameter
  const requestUrl = `${API_URL}/patients/${patientId}/next-dose?tzOffsetMinutes=${tzOffsetMinutes}`;
  
  try {
    const response = await fetch(requestUrl);
    if (!response.ok) throw new Error('Error al obtener la próxima dosis.');
    const data = await response.json();
    
    console.log(" apiService | Datos crudos recibidos del backend:", data);
    return data; 
  } catch (error) {
    console.error('Error en fetchNextDose:', error);
    throw error;
  }
};

// ... (logIntake, logPendingIntake, fetchIntakeHistory, etc. se mantienen igual) ...
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
export const logPendingIntake = async (
  medicationId: string, 
  scheduleId: string, 
  scheduledFor: string
): Promise<boolean> => {
  const requestUrl = `${API_URL}/intakes/pending`;
  try {
    const response = await fetch(requestUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ medicationId, scheduleId, scheduledFor })
    });
    return response.ok;
  } catch (error) {
    console.error('Error en logPendingIntake:', error);
    return false;
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
/**
 * Actualiza el perfil de un usuario/paciente.
 * Retorna el perfil actualizado.
 */
export const updateUserProfile = async (userId: string, payload: Partial<UserProfile>): Promise<UserProfile> => {
  if (!userId) throw new Error('El ID del usuario es requerido.');
  const candidatePaths = [
    `/patients/${userId}`,
    `/patients/${userId}/profile`,
    `/patients/profile/${userId}`,
    `/users/${userId}`,
    `/users/${userId}/profile`,
    `/profiles/${userId}`,
  ];

  let lastErr: any = null;
  for (const path of candidatePaths) {
    const url = `${API_URL}${path}`;
    // Try PUT then PATCH for each candidate URL
    for (const method of ['PUT', 'PATCH']) {
      try {
  console.warn(`[apiService] intentando ${method} ${url}`);
        const res = await fetch(url, {
          method,
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });

        if (res.ok) {
          return await res.json();
        }

        // If 404, continue trying other methods/endpoints
        const text = await res.text().catch(() => '');
        let parsedMsg: any = null;
        try {
          parsedMsg = JSON.parse(text || '{}');
        } catch (e) {
          // ignore
        }
        const errMsg = parsedMsg?.error || parsedMsg?.message || `Error del servidor: ${res.status}`;
        console.warn(`[apiService] ${method} ${url} devolvió ${res.status}: ${errMsg}`);
        lastErr = new Error(errMsg);
        // continue to next method/endpoint
      } catch (err) {
        console.error(`[apiService] fallo al llamar ${method} ${url}:`, err);
        lastErr = err;
      }
    }
  }

  // Si llegamos aquí, todas las opciones fallaron
  const finalErr = lastErr || new Error('No se pudo actualizar el perfil.');
  console.error(`[apiService] updateUserProfile falló para ${userId}:`, finalErr);
  throw finalErr;
};

export const registerUser = async (payload: UserRegistrationPayload): Promise<UserProfile> => {
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

export const fetchMedicationById = async (medId: string): Promise<MedicationWithSchedules | null> => {
  if (!medId) return null;
  const requestUrl = `${API_URL}/medications/${medId}`;
  
  try {
    const response = await fetch(requestUrl); // Usando fetch
    
    if (!response.ok) {
       if (response.status === 404) return null; 
       throw new Error(`Error del servidor: ${response.status}`);
    }
    
    return await response.json(); // Usando response.json()
  } catch (error) {
    console.error(`[apiService] Error fetching medication by ID ${medId}:`, error);
    throw error;
  }
};

/**
 * 2. ACTUALIZAR UN MEDICAMENTO (PUT) (CORREGIDO)
 */
export const updateMedication = async (medId: string, payload: UpdateMedicationPayload): Promise<Medication> => {
  if (!medId) throw new Error("El ID del medicamento es requerido para actualizar.");
  const requestUrl = `${API_URL}/medications/${medId}`;
  
  try {
    const response = await fetch(requestUrl, { // Usando fetch
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
       const errorData = await response.json();
       throw new Error(errorData.error || `Error del servidor al actualizar: ${response.status}`);
    }

    return await response.json(); // Usando response.json()
  } catch (error) {
    console.error(`[apiService] Error updating medication ${medId}:`, error);
    throw error;
  }
};
// ... (Funciones de Caregiver se mantienen igual) ...
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
    // Try to parse JSON, otherwise fall back to text
    try {
      const errorData = await response.json();
      throw new Error(errorData.error || `Error del servidor: ${response.status}`);
    } catch (e) {
      const text = await response.text();
      throw new Error(text || `Error del servidor: ${response.status}`);
    }
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
    try {
      const errorData = await response.json();
      throw new Error(errorData.error || `Error del servidor: ${response.status}`);
    } catch (e) {
      const text = await response.text();
      throw new Error(text || `Error del servidor: ${response.status}`);
    }
  }
  return await response.json();
};
export const fetchPatientDashboard = async (
  caregiverId: string,
  patientId: string
): Promise<PatientDashboard> => {
  if (!caregiverId || !patientId) {
    throw new Error("El ID del cuidador y del paciente son requeridos.");
  }
  const requestUrl = `${API_URL}/caregivers/${caregiverId}/patients/${patientId}/dashboard`;
  try {
    const response = await fetch(requestUrl);
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || `Error del servidor: ${response.status}`);
    }
    return await response.json();
  } catch (error) {
    console.error("Error en fetchPatientDashboard:", error);
    throw error;
  }
};
// ... (sendMessageToChatbot se mantiene igual) ...
export const sendMessageToChatbot = async (message: string, patientId: string): Promise<{ response: string }> => {
  if (!message || !patientId) {
    throw new Error('El mensaje y el ID del paciente son requeridos.');
  }
  const requestUrl = `${API_URL}/chatbot/interpret`;
  try {
    const response = await fetch(requestUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message, patientId }),
    });
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'El chatbot no pudo responder.');
    }
    return await response.json();
  } catch (error) {
    console.error('Error en sendMessageToChatbot:', error);
    throw error;
  }
};

// --- FUNCIÓN MODIFICADA ---
export const fetchRemainingDosesToday = async (patientId: string): Promise<NextDose[]> => {
  if (!patientId) return [];
  
  // 1. Obtener el offset de la zona horaria del dispositivo
  const tzOffsetMinutes = new Date().getTimezoneOffset();
  
  // 2. Añadir el offset como query parameter
  const requestUrl = `${API_URL}/patients/${patientId}/remaining-doses-today?tzOffsetMinutes=${tzOffsetMinutes}`;
  
  try {
    const response = await fetch(requestUrl);
    if (!response.ok) {
      throw new Error('Error al obtener las dosis restantes del día.');
    }
    const data: NextDose[] = await response.json();
    console.log(" apiService | Dosis restantes del día recibidas:", data);
    return data;
  } catch (error) {
    console.error('Error en fetchRemainingDosesToday:', error);
    throw error;
  }
};