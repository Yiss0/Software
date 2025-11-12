import axios, { AxiosError } from 'axios';
import dotenv from 'dotenv';
import { MedicationType, AlertType } from "@prisma/client";

dotenv.config();

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
// URL CORREGIDA: Usando el nombre del modelo exacto que mencionaste.
const GEMINI_API_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-09-2025:generateContent?key=${GEMINI_API_KEY}`;

// ====================================================================
// 1. TIPOS DE INTENCIÓN (Para la primera llamada de clasificación)
// ====================================================================

export type ChatIntent = 
  | 'ADD_MEDICINE'
  | 'VIEW_SCHEDULE'
  | 'CONFIRM_INTAKE' // Añadido
  | 'GREETING'
  | 'FAREWELL'
  | 'HELP'
  | 'UNKNOWN';

export interface IntentResponse {
  intent: ChatIntent;
  details: string | null; // El texto crudo (ej: "paracetamol")
  error?: string;
}

const classificationPrompt = (userMessage: string): string => {
  return `
    Tu única tarea es analizar el siguiente mensaje del usuario y clasificar su intención.
    Debes responder únicamente con un objeto JSON válido.
    
    Las intenciones posibles son:
    - "ADD_MEDICINE": El usuario quiere agregar un nuevo medicamento.
    - "VIEW_SCHEDULE": El usuario quiere ver sus medicamentos o el horario.
    - "CONFIRM_INTAKE": El usuario quiere confirmar que se tomó un medicamento (ej: "ya me tomé la pastilla", "confirmar toma").
    - "GREETING": Un saludo simple.
    - "FAREWELL": Una despedida.
    - "HELP": El usuario pide ayuda.
    - "UNKNOWN": La intención no está clara.

    Extrae el detalle principal en el campo "details" (ej: el nombre del medicamento, o el saludo).

    Formato de respuesta (solo el JSON):
    {"intent": "INTENCION_DETECTADA", "details": "Detalle principal o null"}

    Mensaje del usuario a analizar:
    "${userMessage}"
  `;
};

/**
 * FUNCIÓN 1: Clasifica la intención general del usuario.
 * Reemplaza al antiguo 'classifyIntent' pero devuelve un objeto.
 */
export const analyzeChatIntent = async (userMessage: string): Promise<IntentResponse> => {
  if (!GEMINI_API_KEY) {
    console.error('Error: GEMINI_API_KEY no está configurada.');
    return { intent: 'UNKNOWN', details: null, error: 'Configuración del servidor incompleta.' };
  }

  const requestBody = {
    contents: [{ parts: [{ text: classificationPrompt(userMessage) }] }],
    generationConfig: {
      temperature: 0.1,
      responseMimeType: "application/json",
    }
  };

  try {
    // Log para verificar la URL y el cuerpo (opcional)
    // console.log(`[chatbotService] Enviando a URL: ${GEMINI_API_URL}`);
    
    const response = await axios.post(GEMINI_API_URL, requestBody);
    const rawResponse = response.data.candidates[0].content.parts[0].text;
    console.log(`[chatbotService.analyzeChatIntent] Respuesta cruda: ${rawResponse}`);
    const parsedJson: IntentResponse = JSON.parse(rawResponse);
    return parsedJson;

  } catch (error) {
    // Error detallado
    console.error(`[chatbotService.analyzeChatIntent] Error en API:`);
    if (axios.isAxiosError(error)) {
      console.error(JSON.stringify(error.response?.data, null, 2));
    } else {
      console.error(error);
    }
    
    return { 
      intent: 'UNKNOWN', 
      details: null, 
      error: 'No se pudo procesar la solicitud con la IA.' 
    };
  }
};


// ====================================================================
// 2. TIPOS DE EXTRACCIÓN (Para la segunda llamada de detalles)
// ====================================================================

// Este es el tipo que 'index.ts' espera
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
    daysOfWeek?: string; // "0,1,5"
    alertType?: AlertType;
  }[];
}

const extractionPrompt = (userMessage: string): string => {
  return `
    Tu tarea es analizar el siguiente mensaje del usuario, que quiere agregar un medicamento, y extraer los detalles en un formato JSON específico.
    Debes responder únicamente con el objeto JSON. No incluyas "json" o "".

    Reglas:
    1.  'name' (medicamento) y 'time' (horario) son obligatorios.
    2.  Si no se menciona la dosis (dosage), instrucciones, etc., omite el campo (no uses 'null' o 'undefined').
    3.  El 'time' debe estar en formato "HH:MM". (ej: 8am -> "08:00", 10pm -> "22:00").
    4.  'frequencyType' por defecto es "DAILY" si solo se da una hora.
    5.  'type' (MedicationType) debe ser 'PILL', 'SYRUP', 'INJECTION', o 'OTHER'. Por defecto 'PILL'.
    6.  'quantity' por defecto es 30.
    7.  'daysOfWeek' solo aplica si frequencyType es "WEEKLY". (Domingo=0, Lunes=1...).

    Formato de respuesta (solo el JSON):
    {
      "medication": {
        "name": "NombreMedicamento",
        "dosage": "500mg" 
      },
      "schedules": [
        { "time": "08:00", "frequencyType": "DAILY" },
        { "time": "20:00", "frequencyType": "DAILY" }
      ]
    }

    Mensaje del usuario a analizar:
    "${userMessage}"
  `;
};

/**
 * FUNCIÓN 2: Extrae los detalles estructurados de un medicamento.
 * (Esta es la función que faltaba)
 */
export const extractMedicationDetails = async (userMessage: string): Promise<MedicationDetails | null> => {
  if (!GEMINI_API_KEY) return null;

  const requestBody = {
    contents: [{ parts: [{ text: extractionPrompt(userMessage) }] }],
    generationConfig: {
      temperature: 0.1,
      responseMimeType: "application/json",
    }
  };

  try {
    const response = await axios.post(GEMINI_API_URL, requestBody);
    const rawResponse = response.data.candidates[0].content.parts[0].text;
    console.log(`[chatbotService.extractMedicationDetails] Respuesta cruda: ${rawResponse}`);
    const parsedJson: MedicationDetails = JSON.parse(rawResponse);
    return parsedJson;
  } catch (error) {
    console.error(`[chatbotService.extractMedicationDetails] Error en API:`);
    if (axios.isAxiosError(error)) {
      console.error(JSON.stringify(error.response?.data, null, 2));
    } else {
      console.error(error);
    }
    return null;
  }
};


// ====================================================================
// 3. RESPUESTA CONVERSACIONAL (Para saludos, etc.)
// ====================================================================

const conversationalPrompt = (userMessage: string): string => {
  return `
    Eres "Asistente Pasti". Responde al siguiente saludo o comentario casual del usuario de forma amigable y breve (máx 15 palabras).
    
    Usuario: "${userMessage}"
    Asistente:
  `;
};

/**
 * FUNCIÓN 3: Genera una respuesta casual.
 * (Esta es la otra función que faltaba)
 */
export const getConversationalResponse = async (userMessage: string): Promise<string> => {
  if (!GEMINI_API_KEY) return "Hola.";

  const requestBody = {
    contents: [{ parts: [{ text: conversationalPrompt(userMessage) }] }],
    generationConfig: {
      temperature: 0.7,
    }
  };

  try {
    const response = await axios.post(GEMINI_API_URL, requestBody);
    const rawResponse = response.data.candidates[0].content.parts[0].text;
    return rawResponse.trim();
  } catch (error) {
    console.error(`[chatbotService.getConversationalResponse] Error en API:`);
    if (axios.isAxiosError(error)) {
      console.error(JSON.stringify(error.response?.data, null, 2));
    } else {
      console.error(error);
    }
    return "No pude procesar eso, pero ¡hola!";
  }
};