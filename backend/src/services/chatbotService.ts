import axios, { AxiosError } from 'axios';
import dotenv from 'dotenv';
import { MedicationType, AlertType } from "@prisma/client";

dotenv.config();

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
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
  confidence: 'high' | 'medium' | 'low'; // Confianza en la clasificación
  error?: string;
}

/**
 * Prompt mejorado: clasificación de intención con ejemplos claros
 */
const classificationPrompt = (userMessage: string): string => {
  return `
Eres un asistente especializado en clasificar intenciones de usuario en una app de gestión de medicamentos.
Tu tarea: Analizar el mensaje y clasificarlo en UNA sola intención.

INTENCIONES VÁLIDAS:
1. "ADD_MEDICINE": Agregar medicamento nuevo (ej: "quiero agregar paracetamol", "añade ibuprofeno cada 8 horas")
2. "VIEW_SCHEDULE": Ver medicamentos o horarios (ej: "qué medicamentos tengo", "cuáles son mis pastillas")
3. "CONFIRM_INTAKE": Confirmar que se tomó un medicamento (ej: "ya me tomé la pastilla", "confirmar toma de antibiótico")
4. "GREETING": Saludos simples (ej: "hola", "buenos días", "¿qué tal?")
5. "FAREWELL": Despedidas (ej: "adiós", "hasta luego", "nos vemos")
6. "HELP": Pedir ayuda (ej: "¿cómo funciona esto?", "necesito ayuda", "no entiendo")
7. "UNKNOWN": Ninguna de las anteriores

INSTRUCCIONES:
- Sé muy específico: "ADD_MEDICINE" es SOLO si el usuario quiere AGREGAR un medicamento NUEVO.
- "CONFIRM_INTAKE" es SOLO si confirma tomar un medicamento YA EXISTENTE.
- Extrae el detalle principal en "details" (nombre del medicamento, saludo, etc.).
- "confidence": Qué tan seguro estás (high/medium/low).
- RESPONDE SOLO CON JSON VÁLIDO.

Formato exacto:
{"intent": "INTENCIÓN", "details": "Detalle o null", "confidence": "high|medium|low"}

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
      temperature: 0.2, // Más bajo para clasificación consistente
      responseMimeType: "application/json",
      maxOutputTokens: 100, // Limitar tokens para respuesta rápida
    }
  };

  try {
    console.log(`[chatbotService.analyzeChatIntent] Clasificando: "${userMessage}"`);
    const response = await axios.post(GEMINI_API_URL, requestBody, { timeout: 10000 });
    
    if (!response.data?.candidates?.[0]?.content?.parts?.[0]?.text) {
      throw new Error('Respuesta inesperada de API');
    }

    const rawResponse = response.data.candidates[0].content.parts[0].text;
    console.log(`[chatbotService.analyzeChatIntent] Respuesta: ${rawResponse}`);
    
    const parsedJson: IntentResponse = JSON.parse(rawResponse);
    
    // Validación de campos
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

/**
 * Prompt mejorado: extracción de medicamentos con validaciones
 */
const extractionPrompt = (userMessage: string): string => {
  return `
Eres un asistente médico especializado en extraer información de medicamentos de forma segura.

TAREA: Analizar el mensaje del usuario y extraer los detalles del medicamento en formato JSON.

REGLAS CRÍTICAS:
1. El nombre del medicamento (medication.name) es OBLIGATORIO.
2. El horario (time) es OBLIGATORIO en formato "HH:MM" (24h: 08:00 = 8am, 22:00 = 10pm).
3. Si no se menciona algo, OMITE el campo (no uses null).
4. frequencyType: DAILY (defecto), HOURLY (ej: "cada 4 horas"), o WEEKLY.
5. frequencyValue: Para HOURLY, cuántas horas (ej: 4, 6, 8). Para WEEKLY, ignorar.
6. type: PILL (defecto), SYRUP, INJECTION, o INHALER.
7. quantity: Cantidad de dosis en la caja (defecto 30).
8. daysOfWeek: Solo si es WEEKLY (domingo=0, lunes=1, ..., sábado=6).
9. alertType: NOTIFICATION (defecto) o ALARM.
10. instructions: Instrucciones especiales (ej: "tomar con agua", "en ayunas").

EJEMPLOS:
- "Paracetamol 500mg cada 8 horas" → time: 08:00, frequencyType: HOURLY, frequencyValue: 8
- "Antibiótico a las 9 de la mañana todos los días" → time: 09:00, frequencyType: DAILY
- "Vitamina los lunes y viernes a las 7" → time: 07:00, frequencyType: WEEKLY, daysOfWeek: "1,5"

RESPONDE SOLO CON JSON VÁLIDO (sin explicaciones):
{
  "medication": {
    "name": "NombreMedicamento",
    "dosage": "500mg",
    "quantity": 30,
    "type": "PILL"
  },
  "schedules": [
    {
      "time": "08:00",
      "frequencyType": "DAILY",
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
      temperature: 0.15, // Más consistente para extracción
      responseMimeType: "application/json",
      maxOutputTokens: 500,
    }
  };

  try {
    console.log(`[chatbotService.extractMedicationDetails] Extrayendo de: "${userMessage}"`);
    const response = await axios.post(GEMINI_API_URL, requestBody, { timeout: 10000 });
    
    if (!response.data?.candidates?.[0]?.content?.parts?.[0]?.text) {
      throw new Error('Respuesta inesperada de API');
    }

    const rawResponse = response.data.candidates[0].content.parts[0].text;
    const parsedJson: MedicationDetails = JSON.parse(rawResponse);
    
    // Validación de campos requeridos
    if (!parsedJson.medication?.name) {
      console.warn('[chatbotService] Falta nombre del medicamento');
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

/**
 * Prompt mejorado: respuestas contextuales y amigables
 */
const conversationalPrompt = (userMessage: string): string => {
  return `
Eres "Pasti", un asistente amigable y profesional para gestión de medicamentos.

TONO: Cordial, empático, profesional pero accesible. Máx 20 palabras.

CONTEXTO: Estás en una app para recordar y gestionar medicamentos. El usuario puede:
- Saludarte
- Despedirse
- Pedir ayuda general
- Comentar sobre su salud

INSTRUCCIONES:
- Sé breve y directo.
- Si es un saludo, responde con calidez.
- Si pide ayuda, ofrece opciones claras (agregar medicamento, ver horarios, confirmar toma).
- NO des consejos médicos; remite al médico si es necesario.
- Responde en español, el mismo idioma del usuario.

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
      temperature: 0.7, // Más variabilidad para conversación natural
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
    return "Perdón, no pude entender eso. ¿Necesitas ayuda? Puedo: agregar medicamentos, ver tu horario o confirmar una toma.";
  }
};

// ====================================================================
// 4. FUNCIONES AUXILIARES
// ====================================================================

/**
 * Convierte una hora en texto (ej: "8 de la mañana") a formato 24h (08:00)
 */
export const parseTimeToHHMM = (timeText: string): string | null => {
  const lowerText = timeText.toLowerCase();
  
  // Buscar patrones como "8 de la mañana", "8am", "20:00", etc.
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
  
  // Patrón 24h directo "09:00" o "9:00"
  const directMatch = timeText.match(/(\d{1,2}):(\d{2})/);
  if (directMatch) {
    const hour = parseInt(directMatch[1]);
    const minute = parseInt(directMatch[2]);
    if (hour < 0 || hour > 23 || minute < 0 || minute > 59) return null;
    return `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`;
  }
  
  return null;
};

/**
 * Valida un objeto MedicationDetails antes de guardarlo
 */
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