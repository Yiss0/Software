import React, { useEffect, useState } from 'react';
import { View, StyleSheet, Alert, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, useLocalSearchParams } from 'expo-router';
import * as apiService from '../services/apiService';

// NOTA: Este componente está mayormente deshabilitado porque el backend
// no tiene los endpoints necesarios para obtener y actualizar un solo medicamento.
// Muestra una alerta y regresa a la pantalla anterior.

export default function EditMedicationScreen() {
  const params = useLocalSearchParams<{ medId: string }>();
  const medId = params.medId;

  useEffect(() => {
    // Esta función se ejecuta tan pronto como la pantalla carga.
    Alert.alert(
      "Función no disponible", 
      "La edición de medicamentos aún no está implementada en el servidor.", 
      [{ text: "OK", onPress: () => router.back() }]
    );
  }, []);

  // Mostramos un indicador de carga mientras aparece la alerta y se navega hacia atrás.
  return (
    <SafeAreaView style={styles.container}>
        <ActivityIndicator size="large" color="#2563EB" />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    backgroundColor: '#F8FAFC',
    justifyContent: 'center',
    alignItems: 'center'
  },
});