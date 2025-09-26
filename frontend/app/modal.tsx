import { StatusBar } from 'expo-status-bar';
import { Platform, StyleSheet, Text, View } from 'react-native';

export default function ModalScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Modal</Text>
      
      {/* Usamos un View normal como separador, sin las propiedades personalizadas */}
      <View style={styles.separator} />

      {/* Eliminamos la referencia al componente EditScreenInfo que no existe */}

      {/* Usamos una barra de estado clara en iOS para el espacio negro sobre el modal */}
      <StatusBar style={Platform.OS === 'ios' ? 'light' : 'auto'} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  separator: {
    marginVertical: 30,
    height: 1,
    width: '80%',
    // Le añadimos un color de fondo para que siga siendo visible
    backgroundColor: '#eee',
  },
});