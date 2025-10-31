// frontend/services/pushNotificationService.ts
import * as Notifications from 'expo-notifications';
import { Platform, Alert } from 'react-native';
import * as apiService from './apiService'; // Asumiendo que apiService exporta la API_URL
import { API_URL } from '../constants/Config'; // O impórtala de donde venga

/**
 * Pide permisos de notificación.
 */
async function requestPermissions(): Promise<boolean> {
  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;
  
  if (existingStatus !== 'granted') {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }
  
  if (finalStatus !== 'granted') {
    Alert.alert('Permiso denegado', 'No podremos notificarte sobre tus pacientes.');
    return false;
  }
  return true;
}

/**
 * Configura el canal de Android (necesario).
 */
async function setupAndroidChannel() {
  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('caregiver-alerts', {
      name: 'Alertas de Pacientes',
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#FF231F7C',
    });
  }
}

/**
 * Llama al endpoint del backend para guardar el token.
 */
async function saveTokenToBackend(userId: string, token: string): Promise<boolean> {
  if (!userId || !token) return false;
  
  const requestUrl = `${API_URL}/users/${userId}/push-token`;
  try {
    const response = await fetch(requestUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token }),
    });
    return response.ok;
  } catch (error) {
    console.error('Error en saveTokenToBackend:', error);
    return false;
  }
}

/**
 * Función principal: Registra al usuario para notificaciones push.
 * Pide permiso, obtiene el token y lo guarda en el backend.
 */
export async function registerForPushNotifications(userId: string, projectId: string) {
  const hasPermission = await requestPermissions();
  if (!hasPermission) return;

  await setupAndroidChannel();

  let token;
  try {
    token = (await Notifications.getExpoPushTokenAsync({ projectId })).data;
    console.log("[Push Service] Token obtenido:", token);
  } catch (e) {
    console.error("Error obteniendo el push token:", e);
    Alert.alert('Error', 'No se pudo obtener el token de notificación. Asegúrate de que el "projectId" en app.json es correcto.');
    return;
  }

  if (token) {
    try {
      const success = await saveTokenToBackend(userId, token);
      if (success) {
        console.log("[Push Service] Token guardado en el backend.");
      } else {
        console.warn("[Push Service] El token se obtuvo, pero no se pudo guardar en el backend.");
      }
    } catch (e) {
      console.error("Error guardando el token:", e);
    }
  }
}