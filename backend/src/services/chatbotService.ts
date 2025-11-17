import axios, { AxiosError } from 'axios';
import dotenv from 'dotenv';
import { MedicationType, AlertType } from "@prisma/client";

dotenv.config();

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
// Corregido: La URL base no debe incluir el método, se pone en la llamada de axios
const GEMINI_API_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-09-2025:generateContent?key=${GEMINI_API_KEY}`;

// ====================================================================
// 1. TIPOS DE INTENCIÓN
// ====================================================================

export type ChatIntent = 
  | 'ADD_MEDICINE'
  | 'VIEW_SCHEDULE'
  | 'CONFIRM_INTAKE'
  | 'GREETING'
  | 'FAREWELL'
  | 'HELP'
  | 'UNKNOWN';

export interface IntentResponse {
  intent: ChatIntent;
  details: string | null;
  confidence: 'high' | 'medium' | 'low';
  error?: string;
}

const classificationPrompt = (userMessage: string): string => {
  return `
Eres un clasificador de intenciones.
Tu tarea: Analizar el mensaje y clasificarlo.
Intenciones válidas: [ADD_MEDICINE, VIEW_SCHEDULE, CONFIRM_INTAKE, GREETING, FAREWELL, HELP, UNKNOWN]

REGLAS:
- "ADD_MEDICINE": Agregar un medicamento NUEVO.
- "CONFIRM_INTAKE": Confirmar que se tomó un medicamento YA EXISTENTE.
- RESPONDE SOLO CON JSON VÁLIDO. NADA MÁS. SIN TEXTO ADICIONAL.

Formato exacto:
{"intent": "INTENCIÓN", "details": "Detalle o null", "confidence": "high"}

Mensaje del usuario:
"${userMessage}"

Respuesta JSON:`;
};

export const analyzeChatIntent = async (userMessage: string): Promise<IntentResponse> => {
  if (!GEMINI_API_KEY) {
    console.error('[chatbotService] Error: GEMINI_API_KEY no configurada');
    return { 
      intent: 'UNKNOWN', 
      details: null, 
      confidence: 'low',
      error: 'Configuración del servidor incompleta.' 
    };
  }

  const requestBody = {
    contents: [{ parts: [{ text: classificationPrompt(userMessage) }] }],
    generationConfig: {
      temperature: 0.2,
      maxOutputTokens: 100,
      // ELIMINADO: responseMimeType: "application/json" (Esto causaba el error 400)
    }
  };

  try {
    console.log(`[chatbotService.analyzeChatIntent] Clasificando: "${userMessage}"`);
    const response = await axios.post(GEMINI_API_URL, requestBody, { timeout: 10000 });
    
    if (!response.data?.candidates?.[0]?.content?.parts?.[0]?.text) {
      throw new Error('Respuesta inesperada de API');
    }

    // Limpieza de la respuesta para asegurar que sea solo JSON
    const rawResponse = response.data.candidates[0].content.parts[0].text
      .replace(/```json/g, '')
      .replace(/```/g, '')
      .trim();
      
    console.log(`[chatbotService.analyzeChatIntent] Respuesta: ${rawResponse}`);
    
    const parsedJson: IntentResponse = JSON.parse(rawResponse);
    
    if (!parsedJson.intent || !Object.values(['ADD_MEDICINE', 'VIEW_SCHEDULE', 'CONFIRM_INTAKE', 'GREETING', 'FAREWELL', 'HELP', 'UNKNOWN']).includes(parsedJson.intent)) {
      parsedJson.intent = 'UNKNOWN';
    }
    
    return parsedJson;
  } catch (error) {
    console.error(`[chatbotService.analyzeChatIntent] Error:`, error instanceof Error ? error.message : error);
    return { 
      intent: 'UNKNOWN', 
      details: null, 
      confidence: 'low',
      error: 'Error procesando la solicitud.' 
    };
  }
};

// ====================================================================
// 2. EXTRACCIÓN DE DETALLES DE MEDICAMENTO
// ====================================================================

export interface MedicationDetails {
  medication: {
    name: string;
    dosage?: string;
    quantity?: number;
    instructions?: string;
    type?: MedicationType;
  };
  schedules: {
    time: string; // "HH:MM"
    frequencyType?: 'DAILY' | 'HOURLY' | 'WEEKLY';
    frequencyValue?: number;
    daysOfWeek?: string;
    alertType?: AlertType;
  }[];
}

const extractionPrompt = (userMessage: string): string => {
  return `
Eres un asistente médico especializado en extraer información de medicamentos.
TAREA: Analizar el mensaje y extraer detalles en formato JSON.

REGLAS CRÍTICAS:
1. El nombre del medicamento (medication.name) es OBLIGATORIO.
2. El horario (time) es OBLIGATORIO en formato "HH:MM" (24h: 08:00 = 8am, 22:00 = 10pm).
3. RESPONDE SOLO CON JSON VÁLIDO. NADA MÁS. SIN TEXTO ADICIONAL.
4. Si falta información obligatoria (nombre u hora), responde con:
   {"medication": null, "schedules": []}

EJEMPLO:
- "Paracetamol 500mg cada 8 horas"
JSON:
{
  "medication": {
    "name": "Paracetamol",
    "dosage": "500mg",
    "quantity": 30,
    "type": "PILL"
  },
  "schedules": [
    {
      "time": "08:00", 
      "frequencyType": "HOURLY",
      "frequencyValue": 8,
      "alertType": "NOTIFICATION"
    }
  ]
}

Mensaje del usuario:
"${userMessage}"

JSON:`;
};

export const extractMedicationDetails = async (userMessage: string): Promise<MedicationDetails | null> => {
  if (!GEMINI_API_KEY) {
    console.error('[chatbotService] GEMINI_API_KEY no configurada');
    return null;
  }

  const requestBody = {
    contents: [{ parts: [{ text: extractionPrompt(userMessage) }] }],
    generationConfig: {
      temperature: 0.15,
      maxOutputTokens: 500,
      // ELIMINADO: responseMimeType: "application/json" (Esto causaba el error 400)
    }
  };

  try {
    console.log(`[chatbotService.extractMedicationDetails] Extrayendo de: "${userMessage}"`);
    const response = await axios.post(GEMINI_API_URL, requestBody, { timeout: 10000 });
    
    if (!response.data?.candidates?.[0]?.content?.parts?.[0]?.text) {
      throw new Error('Respuesta inesperada de API');
    }

    // Limpieza de la respuesta para asegurar que sea solo JSON
    const rawResponse = response.data.candidates[0].content.parts[0].text
      .replace(/```json/g, '')
      .replace(/```/g, '')
      .trim();

    const parsedJson: MedicationDetails = JSON.parse(rawResponse);
    
    // Validación de campos requeridos (ahora la IA devuelve null si falla)
    if (!parsedJson.medication?.name) {
      console.warn('[chatbotService] Falta nombre del medicamento o la IA no pudo extraerlo.');
      return null;
    }
    
    if (!parsedJson.schedules?.length) {
      console.warn('[chatbotService] Falta información de horario');
      return null;
    }
    
    console.log('[chatbotService.extractMedicationDetails] Éxito:', parsedJson.medication.name);
    return parsedJson;
  } catch (error) {
    console.error('[chatbotService.extractMedicationDetails] Error:', error instanceof Error ? error.message : error);
    return null;
  }
};

// ====================================================================
// 3. RESPUESTAS CONVERSACIONALES
// ====================================================================

const conversationalPrompt = (userMessage: string): string => {
  return `
Eres "Pastillin", un asistente amigable y profesional para gestión de medicamentos.
TONO: Cordial, empático, profesional pero accesible. Máx 20 palabras.
Responde en español.

Mensaje del usuario:
"${userMessage}"

Respuesta (solo texto, sin comillas):`;
};

export const getConversationalResponse = async (userMessage: string): Promise<string> => {
  if (!GEMINI_API_KEY) {
    return "Hola, soy Pasti. ¿Cómo puedo ayudarte?";
  }

  const requestBody = {
    contents: [{ parts: [{ text: conversationalPrompt(userMessage) }] }],
    generationConfig: {
      temperature: 0.7,
      maxOutputTokens: 100,
    }
  };

  try {
    console.log(`[chatbotService.getConversationalResponse] Generando respuesta para: "${userMessage}"`);
    const response = await axios.post(GEMINI_API_URL, requestBody, { timeout: 10000 });
    
    if (!response.data?.candidates?.[0]?.content?.parts?.[0]?.text) {
      throw new Error('Respuesta inesperada');
    }

    const rawResponse = response.data.candidates[0].content.parts[0].text.trim();
    console.log(`[chatbotService.getConversationalResponse] Respuesta generada`);
    return rawResponse;
  } catch (error) {
    console.error('[chatbotService.getConversationalResponse] Error:', error instanceof Error ? error.message : error);
    return "Perdón, no pude entender eso. ¿Necesitas ayuda?";
  }
};

// ====================================================================
// 4. FUNCIONES AUXILIARES (Las mantengo como las tenías)
// ====================================================================

export const parseTimeToHHMM = (timeText: string): string | null => {
  const lowerText = timeText.toLowerCase();
  
  const ampmMatch = lowerText.match(/(\d{1,2})\s*(?:de la)?\s*(?:mañana|am|a\.m\.)/);
  if (ampmMatch) {
    const hour = parseInt(ampmMatch[1]);
    if (hour < 1 || hour > 12) return null;
    return `${String(hour).padStart(2, '0')}:00`;
  }
  
  const pmMatch = lowerText.match(/(\d{1,2})\s*(?:de la)?\s*(?:tarde|noche|pm|p\.m\.)/);
  if (pmMatch) {
    const hour = parseInt(pmMatch[1]);
    if (hour < 1 || hour > 12) return null;
    const convertedHour = hour === 12 ? 12 : hour + 12;
    return `${String(convertedHour).padStart(2, '0')}:00`;
  }
  
  const directMatch = timeText.match(/(\d{1,2}):(\d{2})/);
  if (directMatch) {
    const hour = parseInt(directMatch[1]);
    const minute = parseInt(directMatch[2]);
    if (hour < 0 || hour > 23 || minute < 0 || minute > 59) return null;
    return `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`;
  }
  
  return null;
};

export const validateMedicationDetails = (details: MedicationDetails): { valid: boolean; errors: string[] } => {
  const errors: string[] = [];

  if (!details.medication?.name?.trim()) {
    errors.push('Falta el nombre del medicamento');
  }

  if (!details.schedules?.length) {
    errors.push('Falta al menos un horario');
  } else {
    details.schedules.forEach((sch, idx) => {
      if (!sch.time || !sch.time.match(/^\d{2}:\d{2}$/)) {
        errors.push(`Horario ${idx + 1} inválido (debe ser HH:MM)`);
      }
      if (sch.frequencyType && !['DAILY', 'HOURLY', 'WEEKLY'].includes(sch.frequencyType)) {
        errors.push(`Frecuencia ${idx + 1} inválida`);
      }
    });
  }

  if (details.medication?.type && !['PILL', 'SYRUP', 'INJECTION', 'INHALER'].includes(details.medication.type)) {
    errors.push('Tipo de medicamento inválido');
  }

  return {
    valid: errors.length === 0,
    errors
  };
};
