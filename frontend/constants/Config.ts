// En este archivo guardaremos constantes que se usan en varias partes de la app.

// URL base de tu API.
// El backend corre en el puerto 3001.
// ¡MUY IMPORTANTE!: Cambia 'TU_IP_LOCAL' por la IP de tu computador en la red (ej: 192.168.1.100).
const API_URL = 'http://192.168.100.3:3001';

// Este ID ya no es necesario para la sincronización, pero es buena práctica tener el archivo de configuración.
const MOCK_PATIENT_ID = 'id_de_prueba_si_lo_necesitas'; 

export { API_URL, MOCK_PATIENT_ID };