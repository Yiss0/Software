import { API_URL } from '../constants/Config';
import * as db from './database'; // Importamos todas las funciones de tu archivo database.ts
import { SQLiteDatabase } from 'expo-sqlite';

/**
 * Recolecta todos los datos de la base de datos local de SQLite.
 * Esta función lee cada tabla y devuelve un objeto listo para ser enviado como JSON.
 * @param localDb - La instancia de la base de datos SQLite.
 */
async function gatherAllLocalData(localDb: SQLiteDatabase) {
  // Leemos todas las filas de cada tabla importante.
  // Es importante que el usuario exista para poder obtener los datos relacionados.
  const users = await localDb.getAllAsync<any>('SELECT * FROM users;');
  const userId = users[0]?.id;

  // Si no hay usuario, no hay nada que sincronizar.
  if (!userId) {
    console.log('No se encontró ningún usuario en la base de datos local.');
    return { users: [], medications: [], schedules: [], intakeLogs: [] };
  }

  // Obtenemos el resto de los datos.
  const medications = await localDb.getAllAsync<any>('SELECT * FROM medications;');
  const schedules = await localDb.getAllAsync<any>('SELECT * FROM schedules;');
  const intakeLogs = await localDb.getAllAsync<any>('SELECT * FROM intake_logs;');

  console.log(`Datos recolectados: ${users.length} usuarios, ${medications.length} medicamentos, ${schedules.length} horarios, ${intakeLogs.length} registros.`);
  return { users, medications, schedules, intakeLogs };
}

/**
 * Envía todos los datos locales al backend para una sincronización completa.
 * @param localDb - La instancia de la base de datos SQLite.
 * @returns {Promise<boolean>} - Devuelve 'true' si la sincronización fue exitosa, 'false' si no.
 */
export const syncLocalDataToBackend = async (localDb: SQLiteDatabase): Promise<boolean> => {
  try {
    console.log('Recolectando datos locales para sincronizar...');
    const payload = await gatherAllLocalData(localDb);

    // Si no hay usuarios, no se envía nada.
    if (payload.users.length === 0) {
      console.log('No hay datos locales para sincronizar.');
      return true; // Se considera éxito porque no había nada que hacer.
    }

    console.log('Enviando payload al backend...');
    const response = await fetch(`${API_URL}/sync/full`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      // Convertimos el objeto de JavaScript a un string en formato JSON.
      body: JSON.stringify(payload),
    });

    // Si la respuesta del servidor no es 'OK' (ej: status 400 o 500)
    if (!response.ok) {
      const errorData = await response.json();
      // Lanzamos un error para que sea capturado por el bloque 'catch'.
      throw new Error(errorData.error || 'Error en la respuesta del servidor.');
    }

    const result = await response.json();
    console.log('Respuesta del servidor:', result.message);
    return true;

  } catch (error) {
    console.error('Falló la sincronización:', error);
    // Devolvemos 'false' para indicar que el proceso falló.
    return false;
  }
};