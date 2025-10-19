import axios from 'axios';
import 'dotenv/config';

// 1. Cargamos la API Key de Gemini desde el archivo .env
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

// 2. Usamos la URL correcta con el modelo que sí está disponible para ti
const GEMINI_URL = 'https://generativelanguage.googleapis.com/v1/models/gemini-2.5-flash:generateContent';

// --- PASO 1: AÑADIMOS LA NUEVA INTENCIÓN ---
type Intent = 'ADD_MEDICATION' | 'CONFIRM_INTAKE' | 'GREETING' | 'GENERAL_QUESTION' | 'UNKNOWN';

interface MedicationDetails {
  medication: { name: string; dosage?: string; };
  schedules: Array<{ time: string; frequencyType: 'DAILY' | 'WEEKLY' | 'HOURLY'; }>;
}

const axiosConfig = {
  headers: {
    'x-goog-api-key': GEMINI_API_KEY,
    'Content-Type': 'application/json',
  },
};

export async function classifyIntent(userMessage: string): Promise<Intent> {
  // --- PASO 2: ACTUALIZAMOS EL PROMPT PARA QUE ENTIENDA LA NUEVA INTENCIÓN ---
  const prompt = `Clasifica el siguiente mensaje con una sola palabra de esta lista: [ADD_MEDICATION, CONFIRM_INTAKE, GREETING, UNKNOWN].
- ADD_MEDICATION: para registrar, añadir o agendar un medicamento.
- CONFIRM_INTAKE: si el usuario confirma que ya tomó una pastilla (ej: "ya me la tomé", "toma registrada").
- GREETING: para saludos o despedidas.

Ejemplos:
- "hola que tal" -> GREETING
- "agrega losartán 50mg a las 8pm" -> ADD_MEDICATION
- "listo, ya me tomé la pastilla" -> CONFIRM_INTAKE
- "confirmo la toma de mi medicamento" -> CONFIRM_INTAKE

Clasifica este mensaje: "${userMessage}"`;

  try {
    const response = await axios.post(GEMINI_URL, {
      contents: [{ parts: [{ text: prompt }] }],
    }, axiosConfig);

    const candidates = response.data.candidates;
    if (!candidates || candidates.length === 0 || !candidates[0].content?.parts?.[0]?.text) {
      return 'UNKNOWN';
    }
    
    const intent = candidates[0].content.parts[0].text.trim().toUpperCase();
    if (['ADD_MEDICATION', 'CONFIRM_INTAKE', 'GREETING', 'UNKNOWN'].includes(intent)) {
      return intent as Intent;
    }
    return 'UNKNOWN';
  } catch (error) {
    console.error('Error en classifyIntent:', error);
    return 'UNKNOWN';
  }
}

// (Las funciones extractMedicationDetails y getConversationalResponse no necesitan cambios)

export async function extractMedicationDetails(userMessage: string): Promise<MedicationDetails | null> {
    const prompt = `Tu única tarea es analizar el texto del usuario y devolver un objeto JSON.
La estructura debe ser: {"medication":{"name":"string","dosage":"string"},"schedules":[{"time":"HH:mm","frequencyType":"string"}]}.
Tu respuesta DEBE SER ÚNICAMENTE el texto JSON, sin nada más. No incluyas "json" ni ninguna otra palabra.

Ejemplo:
Usuario: "Por favor, agrega Paracetamol de 500mg todos los días a las 10 de la noche"
Tu Respuesta: {"medication":{"name":"Paracetamol","dosage":"500mg"},"schedules":[{"time":"22:00","frequencyType":"DAILY"}]}

Ahora, analiza este mensaje: "${userMessage}"`;
  
    try {
      const response = await axios.post(GEMINI_URL, {
        contents: [{ parts: [{ text: prompt }] }],
      }, axiosConfig);
  
      const candidates = response.data.candidates;
      if (!candidates || candidates.length === 0 || !candidates[0].content?.parts?.[0]?.text) {
          return null;
      }
  
      const resultText = candidates[0].content.parts[0].text.replace(/```json/g, '').replace(/```/g, '').trim();
      const resultJson = JSON.parse(resultText);
  
      if (!resultJson || !resultJson.medication) {
          return null;
      }
  
      return resultJson as MedicationDetails;
    } catch (error) {
      console.error('Error en extractMedicationDetails:', error);
      return null;
    }
}
  
export async function getConversationalResponse(userMessage: string): Promise<string> {
    const prompt = `Eres Pasti, un asistente amigable de la app PastillApp. Responde de forma breve y humana al siguiente mensaje: "${userMessage}"`;
  
    try {
        const response = await axios.post(GEMINI_URL, {
            contents: [{ parts: [{ text: prompt }] }],
        }, axiosConfig);
        
        const candidates = response.data.candidates;
        if (!candidates || candidates.length === 0 || !candidates[0].content?.parts?.[0]?.text) {
          return "Lo siento, tuve un problema para generar la respuesta.";
        }
        
        return candidates[0].content.parts[0].text.trim();
    } catch (error) {
        console.error('Error en getConversationalResponse:', error);
        return "Lo siento, ahora mismo no puedo responder.";
    }
}