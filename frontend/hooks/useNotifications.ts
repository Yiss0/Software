import * as Notifications from "expo-notifications";
import * as Device from "expo-device";
import { useEffect } from "react";

// Configura el comportamiento de las notificaciones
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true, // Muestra un banner de notificación
    shouldShowList: true,   // Agrega la notificación a la lista de notificaciones
    shouldPlaySound: true,  // Reproduce un sonido
    shouldSetBadge: false,  // No actualiza el contador de notificaciones en el ícono
  }),
});

export default function useNotifications() {
  useEffect(() => {
    const configureNotifications = async () => {
      try {
        if (Device.isDevice) {
          const { status } = await Notifications.requestPermissionsAsync();
          if (status !== "granted") {
            alert("Se requieren permisos para enviar notificaciones.");
          }
        } else {
          console.warn("Las notificaciones no son compatibles con el emulador. Prueba en un dispositivo físico.");
        }
      } catch (error) {
        console.error("Error al configurar las notificaciones:", error);
      }
    };

    configureNotifications();
  }, []);

  // Programar una notificación en una hora específica
  const scheduleNotificationAtTime = async (title: string, body: string, hour: number, minute: number) => {
    try {
      if (hour < 0 || hour > 23 || minute < 0 || minute > 59) {
        throw new Error("La hora o los minutos proporcionados no son válidos.");
      }

      await Notifications.scheduleNotificationAsync({
        content: {
          title,
          body,
        },
        trigger: null
      });
    } catch (error) {
      console.error("Error al programar la notificación:", error);
    }
  };

  return { scheduleNotificationAtTime };
}