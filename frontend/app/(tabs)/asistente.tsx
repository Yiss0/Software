import { Bot } from 'lucide-react-native';
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function AsistenteScreen() {
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <Bot size={64} color="#9CA3AF" strokeWidth={1.5} />
        <Text style={styles.title}>Asistente IA</Text>
        <Text style={styles.subtitle}>
          Esta funcionalidad estará disponible en futuras versiones.
        </Text>
        <Text style={styles.description}>
          Pronto podrás gestionar tus medicamentos, horarios y más, 
          simplemente hablando con tu asistente personal.
        </Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    alignItems: 'center',
    padding: 20,
    maxWidth: 300,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1F2937',
    marginTop: 24,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#4B5563',
    textAlign: 'center',
    marginBottom: 16,
  },
  description: {
    fontSize: 16,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 24,
  },
});