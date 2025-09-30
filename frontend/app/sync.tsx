import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ActivityIndicator, Alert, SafeAreaView } from 'react-native';
import { syncLocalDataToBackend } from '../services/syncService';
import { initializeDatabase } from '../services/database';
import { SQLiteDatabase } from 'expo-sqlite';

const SyncScreen = () => {
  // Estado para saber si el proceso de sincronización está en curso.
  const [isSyncing, setIsSyncing] = useState(false);
  // Estado para mostrar mensajes de éxito o error al usuario.
  const [message, setMessage] = useState('');
  // Estado para guardar la conexión a la base de datos local.
  const [db, setDb] = useState<SQLiteDatabase | null>(null);

  // useEffect se ejecuta una vez cuando el componente se carga.
  // Lo usamos para inicializar la conexión con la base de datos local.
  useEffect(() => {
    const initDB = async () => {
      const database = await initializeDatabase();
      setDb(database);
    };
    initDB();
  }, []);

  // Esta función se ejecuta cuando el usuario presiona el botón.
  const handleSync = async () => {
    // Verificación para asegurar que la base de datos esté lista.
    if (!db) {
      Alert.alert('Error', 'La base de datos local no está lista. Intenta de nuevo.');
      return;
    }

    // Mostramos una alerta de confirmación porque es una acción importante.
    Alert.alert(
      'Confirmar Sincronización',
      'Esto enviará todos tus datos locales al servidor y reemplazará los datos existentes allí. ¿Deseas continuar?',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Sincronizar',
          onPress: async () => {
            setIsSyncing(true);
            setMessage('Sincronizando... Esto puede tardar unos momentos.');
            
            // Llamamos a la función principal de nuestro servicio de sincronización.
            const success = await syncLocalDataToBackend(db);
            
            if (success) {
              setMessage('✅ ¡Sincronización completada con éxito!');
            } else {
              setMessage('❌ Ocurrió un error. Revisa la consola para más detalles.');
            }
            setIsSyncing(false);
          },
        },
      ]
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.title}>Sincronización de Datos</Text>
      <Text style={styles.description}>
        Presiona el botón para enviar todos los datos guardados en este dispositivo al servidor.
        Este proceso debe realizarse una sola vez para la migración inicial.
      </Text>

      <TouchableOpacity
        style={[styles.button, isSyncing && styles.buttonDisabled]}
        onPress={handleSync}
        disabled={isSyncing || !db} // Deshabilitamos el botón si está sincronizando o si la BD no está lista.
      >
        <Text style={styles.buttonText}>Iniciar Sincronización</Text>
      </TouchableOpacity>

      {/* Mostramos un indicador de carga mientras isSyncing es true */}
      {isSyncing && <ActivityIndicator size="large" color="#007bff" style={{ marginTop: 20 }} />}
      
      {/* Mostramos el mensaje de estado */}
      {message && <Text style={[styles.message, message.includes('❌') && styles.errorMessage]}>{message}</Text>}
    </SafeAreaView>
  );
};

// --- Estilos ---
const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20, backgroundColor: '#f0f4f8' },
  title: { fontSize: 24, fontWeight: 'bold', marginBottom: 15, textAlign: 'center' },
  description: { fontSize: 16, textAlign: 'center', color: '#555', marginBottom: 40 },
  button: { backgroundColor: '#007bff', paddingVertical: 15, paddingHorizontal: 40, borderRadius: 10, elevation: 3 },
  buttonDisabled: { backgroundColor: '#999' },
  buttonText: { color: 'white', fontSize: 18, fontWeight: 'bold' },
  message: { marginTop: 20, fontSize: 16, textAlign: 'center', fontWeight: '500' },
  errorMessage: { color: 'red' },
});

export default SyncScreen;