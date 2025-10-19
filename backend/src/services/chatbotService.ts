import axios from 'axios';
import 'dotenv/config';

// 1. Cargamos la API Key de Gemini desde el archivo .env
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

// 2. Usamos la URL correcta con el modelo que sí está disponible para ti
const GEMINI_URL = 'https://generativelanguage.googleapis.com/v1/models/gemini-2.5-flash:generateContent';

// Definimos los tipos que usaremos
type Intent = 'ADD_MEDICATION' | 'GREETING' | 'GENERAL_QUESTION' | 'UNKNOWN';
interface MedicationDetails {
  medication: { name: string; dosage?: string; };
  schedules: Array<{ time: string; frequencyType: 'DAILY' | 'WEEKLY' | 'HOURLY'; }>;
}

// Creamos un objeto de configuración para las peticiones de Axios
const axiosConfig = {
  headers: {
    'x-goog-api-key': GEMINI_API_KEY,
    'Content-Type': 'application/json',
  },
};


/**
 * Función 1: Clasifica la intención - VERSIÓN SIMPLIFICADA (YA FUNCIONA)
 */
export async function classifyIntent(userMessage: string): Promise<Intent> {
  const prompt = `Clasifica el siguiente mensaje con una sola palabra de esta lista: [ADD_MEDICATION, GREETING, GENERAL_QUESTION, UNKNOWN]. Mensaje: "${userMessage}"`;

  try {
    const response = await axios.post(GEMINI_URL, {
      contents: [{ parts: [{ text: prompt }] }],
    }, axiosConfig);

    const candidates = response.data.candidates;
    if (!candidates || candidates.length === 0 || !candidates[0].content?.parts?.[0]?.text) {
      console.error("Gemini devolvió una respuesta vacía en 'classifyIntent'.");
      return 'UNKNOWN';
    }
    
    const intent = candidates[0].content.parts[0].text.trim().toUpperCase();
    if (['ADD_MEDICATION', 'GREETING', 'GENERAL_QUESTION', 'UNKNOWN'].includes(intent)) {
      return intent as Intent;
    }
    return 'UNKNOWN';
  } catch (error) {
    if (axios.isAxiosError(error)) {
        console.error('Error de API en classifyIntent:', JSON.stringify(error.response?.data, null, 2));
    } else {
        console.error('Error inesperado en classifyIntent:', error);
    }
    return 'UNKNOWN';
  }
}

/**
 * Función 2: Extrae detalles - VERSIÓN SIMPLIFICADA FINAL
 */
export async function extractMedicationDetails(userMessage: string): Promise<MedicationDetails | null> {
  const prompt = `Analiza el siguiente texto de un usuario para extraer los detalles de un medicamento. Tu única tarea es devolver un objeto JSON válido con la estructura: {"medication":{"name":"string","dosage":"string"},"schedules":[{"time":"HH:mm","frequencyType":"string"}]}.

- El campo "name" debe ser solo el nombre del medicamento.
- El campo "dosage" es opcional, pero si existe, debe incluir la unidad (ej: "500mg", "1g").
- El campo "time" debe estar en formato 24 horas (ej: si el usuario dice "10 de la noche" debes usar "22:00").
- El campo "frequencyType" debe ser "DAILY" si el usuario dice "todos los días" o no especifica una frecuencia.
- Si no puedes extraer la información, devuelve null en el JSON.

Ejemplo 1:
Usuario: "agrega Losartán de 50mg todos los días a las 9pm"
Tu Respuesta: {"medication":{"name":"Losartán","dosage":"50mg"},"schedules":[{"time":"21:00","frequencyType":"DAILY"}]}

Ejemplo 2:
Usuario: "Por favor, necesito registrar Paracetamol 1g para tomar cada día a las 10 de la noche"
Tu Respuesta: {"medication":{"name":"Paracetamol","dosage":"1g"},"schedules":[{"time":"22:00","frequencyType":"DAILY"}]}

Ahora, analiza este mensaje: "${userMessage}"`;

  try {
    const response = await axios.post(GEMINI_URL, {
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: { 
        responseMimeType: "application.json",
      }
    }, axiosConfig);

    const candidates = response.data.candidates;
    if (!candidates || candidates.length === 0 || !candidates[0].content?.parts?.[0]?.text) {
        console.error("Gemini devolvió una respuesta vacía en 'extractMedicationDetails'.");
        return null;
    }

    const resultText = candidates[0].content.parts[0].text;
    const resultJson = JSON.parse(resultText);

    // Verificación extra por si la IA devuelve 'null' dentro del JSON
    if (!resultJson || !resultJson.medication) {
        return null;
    }

    return resultJson as MedicationDetails;
  } catch (error) {
    if (axios.isAxiosError(error)) {
        console.error('Error de API en extractMedicationDetails:', JSON.stringify(error.response?.data, null, 2));
    } else {
        console.error('Error inesperado en extractMedicationDetails:', error);
    }
    return null;
  }
}

/**
 * Función 3: Genera una respuesta conversacional - VERSIÓN SIMPLIFICADA FINAL
 */
export async function getConversationalResponse(userMessage: string): Promise<string> {
  const prompt = `Eres Pasti, un asistente amigable de la app PastillApp. Responde de forma breve y humana al siguiente mensaje: "${userMessage}"`;

    try {
        const response = await axios.post(GEMINI_URL, {
            // Eliminamos toda la configuración extra, igual que en la función que sí funcionó
            contents: [{ parts: [{ text: prompt }] }],
        }, axiosConfig);
        
        const candidates = response.data.candidates;
        if (!candidates || candidates.length === 0 || !candidates[0].content?.parts?.[0]?.text) {
          console.error("Gemini devolvió una respuesta vacía en 'getConversationalResponse'.");
          return "Lo siento, tuve un problema para generar la respuesta.";
        }
        
        return candidates[0].content.parts[0].text.trim();
    } catch (error) {
        if (axios.isAxiosError(error)) {
            console.error('Error de API en getConversationalResponse:', JSON.stringify(error.response?.data, null, 2));
        } else {
            console.error('Error inesperado en getConversationalResponse:', error);
        }
        return "Lo siento, ahora mismo no puedo responder. Por favor, intenta de nuevo.";
    }
}